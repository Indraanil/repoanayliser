"""
QdrantRAGStore
--------------
Qdrant vector database interface supporting dual-vector storage:
1. Named dense vectors (768-dim from Hugging Face model)
2. Named sparse vectors (BM25 lexical frequencies)
Executes native Reciprocal Rank Fusion (RRF) hybrid search queries.
"""

import logging
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional
from qdrant_client import QdrantClient, models
from ..config import settings
from .embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

# Namespace for deterministic point UUIDs
NAMESPACE_UUID = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")


class QdrantRAGStore:
    """Manages collection, dual-vector indexing, and hybrid search in Qdrant."""

    _instance: Optional["QdrantRAGStore"] = None

    def __init__(
        self,
        collection_name: Optional[str] = None,
        embedding_service: Optional[EmbeddingService] = None,
    ):
        self.collection_name = collection_name or settings.qdrant_collection_name
        self.embedder = embedding_service or EmbeddingService.get_instance()
        self.client: Optional[QdrantClient] = None
        self._init_client()
        self._ensure_collection()

    @classmethod
    def get_instance(cls) -> "QdrantRAGStore":
        """Get or create singleton instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _init_client(self):
        """Initialize local embedded or remote Qdrant client."""
        try:
            if settings.qdrant_url:
                logger.info(f"Connecting to remote Qdrant at {settings.qdrant_url}")
                self.client = QdrantClient(
                    url=settings.qdrant_url,
                    api_key=settings.qdrant_api_key,
                    timeout=30,
                )
            else:
                qdrant_dir = Path(settings.qdrant_path).resolve()
                qdrant_dir.mkdir(parents=True, exist_ok=True)
                logger.info(f"📂 Initializing local embedded Qdrant at: {qdrant_dir}")
                self.client = QdrantClient(path=str(qdrant_dir))
        except Exception as e:
            logger.error(f"❌ Failed to initialize QdrantClient: {e}")
            # Fall back to in-memory instance so the application does not crash
            logger.warning("⚠️ Falling back to in-memory Qdrant instance (:memory:)")
            self.client = QdrantClient(":memory:")

    def _ensure_collection(self):
        """Ensure collection exists with dense 768-dim and sparse BM25 vector configs."""
        if not self.client:
            return

        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)

            if not exists:
                logger.info(
                    f"📦 Creating Qdrant collection '{self.collection_name}' with 768-dim dense & sparse BM25 vectors..."
                )
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config={
                        "dense": models.VectorParams(
                            size=settings.embedding_dim,  # 768
                            distance=models.Distance.COSINE,
                        )
                    },
                    sparse_vectors_config={
                        "sparse": models.SparseVectorParams()
                    },
                )

                # Create payload index for fast filtering (server Qdrant only)
                if settings.qdrant_url:
                    try:
                        self.client.create_payload_index(
                            collection_name=self.collection_name,
                            field_name="repo_id",
                            field_schema=models.PayloadSchemaType.KEYWORD,
                        )
                        self.client.create_payload_index(
                            collection_name=self.collection_name,
                            field_name="type",
                            field_schema=models.PayloadSchemaType.KEYWORD,
                        )
                    except Exception as idx_err:
                        logger.debug(f"Payload index creation info: {idx_err}")

                logger.info(f"✅ Qdrant collection '{self.collection_name}' ready")
        except Exception as e:
            logger.error(f"❌ Error ensuring Qdrant collection: {e}")

    # ------------------------------------------------------------------
    # Indexing
    # ------------------------------------------------------------------

    def index_entities(self, repo_id: str, entities: List[Dict[str, Any]], batch_size: int = 32) -> int:
        """
        Embed and upsert code entities into Qdrant.
        Each entity dict should contain:
            - id: str unique entity id
            - text: str (searchable text representation)
            - type: str (file, function, class, etc.)
            - file_path: str
            - payload: dict with arbitrary metadata (name, signature, docstring, graph context)
        """
        if not entities or not self.client:
            return 0

        total_upserted = 0
        total_entities = len(entities)

        logger.info(f"🚀 Indexing {total_entities} entities into Qdrant for repo {repo_id[:8]}...")

        for i in range(0, total_entities, batch_size):
            chunk = entities[i : i + batch_size]
            texts = [item.get("text", "") for item in chunk]

            # Generate 768-dim dense vectors and BM25 sparse vectors
            dense_vectors = self.embedder.embed_dense_batch(texts)
            sparse_vectors = self.embedder.embed_sparse_batch(texts)

            points = []
            for item, dense_vec, sparse_vec in zip(chunk, dense_vectors, sparse_vectors):
                entity_id = item.get("id") or str(uuid.uuid4())
                point_uuid = str(uuid.uuid5(NAMESPACE_UUID, f"{repo_id}:{entity_id}"))

                payload = dict(item.get("payload", {}))
                payload["repo_id"] = repo_id
                payload["entity_id"] = entity_id
                payload["type"] = item.get("type", "symbol")
                payload["file_path"] = item.get("file_path", "")
                payload["text_excerpt"] = (item.get("text", ""))[:400]

                points.append(
                    models.PointStruct(
                        id=point_uuid,
                        vector={
                            "dense": dense_vec,
                            "sparse": sparse_vec,
                        },
                        payload=payload,
                    )
                )

            try:
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=points,
                )
                total_upserted += len(points)
            except Exception as e:
                logger.error(f"❌ Error upserting batch into Qdrant: {e}")

        logger.info(f"✅ Upserted {total_upserted}/{total_entities} points to Qdrant collection '{self.collection_name}'")
        return total_upserted

    # ------------------------------------------------------------------
    # Hybrid Search (Dense 768-dim + BM25 Sparse via RRF)
    # ------------------------------------------------------------------

    def hybrid_search(
        self,
        query: str,
        repo_id: Optional[str] = None,
        top_k: int = 10,
        filter_type: Optional[str] = None,
    ) -> List[Dict]:
        """
        Execute hybrid search in Qdrant using native Reciprocal Rank Fusion (RRF).
        Combines 768-dim dense semantic vector with BM25 sparse lexical vector.
        """
        if not query or not self.client:
            return []

        # 1. Build query vectors
        dense_query = self.embedder.embed_dense(query)
        sparse_query = self.embedder.embed_sparse(query)

        # 2. Build filter conditions
        must_filters = []
        if repo_id:
            must_filters.append(
                models.FieldCondition(
                    key="repo_id",
                    match=models.MatchValue(value=repo_id),
                )
            )
        if filter_type:
            must_filters.append(
                models.FieldCondition(
                    key="type",
                    match=models.MatchValue(value=filter_type),
                )
            )

        query_filter = models.Filter(must=must_filters) if must_filters else None

        # 3. Native Qdrant Hybrid Prefetch + RRF Fusion
        try:
            prefetch = [
                models.Prefetch(
                    query=dense_query,
                    using="dense",
                    limit=top_k * 3,
                    filter=query_filter,
                ),
                models.Prefetch(
                    query=sparse_query,
                    using="sparse",
                    limit=top_k * 3,
                    filter=query_filter,
                ),
            ]

            response = self.client.query_points(
                collection_name=self.collection_name,
                prefetch=prefetch,
                query=models.FusionQuery(fusion=models.Fusion.RRF),
                limit=top_k,
            )

            hits = []
            for pt in response.points:
                hits.append({
                    "id": str(pt.id),
                    "score": round(float(pt.score), 4),
                    "search_mode": "hybrid_rrf",
                    "payload": pt.payload or {},
                })
            return hits
        except Exception as e:
            logger.warning(f"⚠️ Native hybrid query failed ({e}), falling back to dense search")
            return self.dense_search(query=query, repo_id=repo_id, top_k=top_k, filter_type=filter_type)

    # ------------------------------------------------------------------
    # Dense-Only and Sparse-Only Search (for comparison / fallback)
    # ------------------------------------------------------------------

    def dense_search(
        self,
        query: str,
        repo_id: Optional[str] = None,
        top_k: int = 10,
        filter_type: Optional[str] = None,
    ) -> List[Dict]:
        """Search using only the 768-dim dense embedding model."""
        if not query or not self.client:
            return []

        dense_query = self.embedder.embed_dense(query)
        must_filters = []
        if repo_id:
            must_filters.append(models.FieldCondition(key="repo_id", match=models.MatchValue(value=repo_id)))
        if filter_type:
            must_filters.append(models.FieldCondition(key="type", match=models.MatchValue(value=filter_type)))

        query_filter = models.Filter(must=must_filters) if must_filters else None

        try:
            response = self.client.query_points(
                collection_name=self.collection_name,
                query=dense_query,
                using="dense",
                query_filter=query_filter,
                limit=top_k,
            )
            return [
                {
                    "id": str(pt.id),
                    "score": round(float(pt.score), 4),
                    "search_mode": "dense_only",
                    "payload": pt.payload or {},
                }
                for pt in response.points
            ]
        except Exception as e:
            logger.error(f"❌ Dense search error: {e}")
            return []

    def sparse_search(
        self,
        query: str,
        repo_id: Optional[str] = None,
        top_k: int = 10,
    ) -> List[Dict]:
        """Search using only the sparse BM25 model."""
        if not query or not self.client:
            return []

        sparse_query = self.embedder.embed_sparse(query)
        must_filters = []
        if repo_id:
            must_filters.append(models.FieldCondition(key="repo_id", match=models.MatchValue(value=repo_id)))

        query_filter = models.Filter(must=must_filters) if must_filters else None

        try:
            response = self.client.query_points(
                collection_name=self.collection_name,
                query=sparse_query,
                using="sparse",
                query_filter=query_filter,
                limit=top_k,
            )
            return [
                {
                    "id": str(pt.id),
                    "score": round(float(pt.score), 4),
                    "search_mode": "sparse_only",
                    "payload": pt.payload or {},
                }
                for pt in response.points
            ]
        except Exception as e:
            logger.error(f"❌ Sparse search error: {e}")
            return []

    def get_file_entities(self, repo_id: Optional[str], file_path: str) -> List[Dict]:
        """Fetch all indexed symbols (functions, classes) for a specific file."""
        if not self.client or not file_path:
            return []
        clean_path = str(file_path).replace("\\", "/")
        must_filters = [
            models.FieldCondition(
                key="file_path",
                match=models.MatchValue(value=clean_path)
            )
        ]
        if repo_id:
            must_filters.append(
                models.FieldCondition(key="repo_id", match=models.MatchValue(value=repo_id))
            )
        try:
            scroll_res = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=models.Filter(must=must_filters),
                limit=100
            )
            return [pt.payload for pt in scroll_res[0] if pt.payload]
        except Exception:
            return []

    # ------------------------------------------------------------------
    # Maintenance & Management
    # ------------------------------------------------------------------

    def delete_repo(self, repo_id: str) -> bool:
        """Delete all vectors and payloads for a specific repository."""
        if not self.client or not repo_id:
            return False

        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="repo_id",
                                match=models.MatchValue(value=repo_id),
                            )
                        ]
                    )
                ),
            )
            logger.info(f"🗑️ Deleted all Qdrant vectors for repo {repo_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to delete Qdrant vectors for repo {repo_id}: {e}")
            return False

    def count_points(self, repo_id: Optional[str] = None) -> int:
        """Count points in the collection, optionally filtered by repo."""
        if not self.client:
            return 0
        try:
            if repo_id:
                count_res = self.client.count(
                    collection_name=self.collection_name,
                    count_filter=models.Filter(
                        must=[models.FieldCondition(key="repo_id", match=models.MatchValue(value=repo_id))]
                    ),
                )
                return count_res.count
            info = self.client.get_collection(self.collection_name)
            return info.points_count or 0
        except Exception:
            return 0

    def get_status(self) -> Dict:
        """Get status of Qdrant connection and vector collection."""
        total_points = self.count_points()
        model_info = self.embedder.get_info()
        return {
            "status": "connected" if self.client else "disconnected",
            "collection_name": self.collection_name,
            "total_points": total_points,
            "dense_model": model_info["dense_model"],
            "dimensions": model_info["dense_dimensions"],
            "sparse_model": model_info["sparse_model"],
            "provider": model_info["provider"],
            "storage": "remote" if settings.qdrant_url else f"embedded ({settings.qdrant_path})",
        }
