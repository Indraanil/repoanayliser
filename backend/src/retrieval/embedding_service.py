"""
EmbeddingService
----------------
Provides dense 768-dimensional semantic embeddings from Hugging Face
(default: 'BAAI/bge-base-en-v1.5') and sparse BM25 lexical embeddings
(default: 'Qdrant/bm25') for hybrid vector retrieval.
"""

import logging
from typing import Dict, List, Optional
from qdrant_client import models
from fastembed import TextEmbedding, SparseTextEmbedding
from ..config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Manages dense 768-dim and sparse lexical embedding models."""

    _instance: Optional["EmbeddingService"] = None

    def __init__(
        self,
        dense_model_name: Optional[str] = None,
        sparse_model_name: Optional[str] = None,
    ):
        self.dense_model_name = dense_model_name or settings.embedding_model
        self.sparse_model_name = sparse_model_name or settings.sparse_model
        self.dim = settings.embedding_dim  # 768

        self._dense_model: Optional[TextEmbedding] = None
        self._sparse_model: Optional[SparseTextEmbedding] = None
        self._initialized = False

    @classmethod
    def get_instance(cls) -> "EmbeddingService":
        """Get or create singleton instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _ensure_models(self):
        """Lazy load embedding models on first use."""
        if self._initialized:
            return

        try:
            logger.info(
                f"🧠 Loading Hugging Face 768-dim dense embedding model: {self.dense_model_name}..."
            )
            self._dense_model = TextEmbedding(model_name=self.dense_model_name)
            
            logger.info(
                f"🔤 Loading sparse lexical embedding model: {self.sparse_model_name}..."
            )
            self._sparse_model = SparseTextEmbedding(model_name=self.sparse_model_name)
            self._initialized = True
            logger.info("✅ Embedding models ready for hybrid search")
        except Exception as e:
            logger.error(f"❌ Failed to initialize embedding models: {e}")
            raise

    # ------------------------------------------------------------------
    # Dense 768-dim Embeddings
    # ------------------------------------------------------------------

    def embed_dense(self, text: str) -> List[float]:
        """Generate a 768-dimensional dense embedding vector for a single text."""
        self._ensure_models()
        cleaned = (text or "").strip()
        if not cleaned:
            return [0.0] * self.dim

        embeddings = list(self._dense_model.embed([cleaned]))
        vec = embeddings[0].tolist() if hasattr(embeddings[0], "tolist") else list(embeddings[0])
        return vec

    def embed_dense_batch(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """Generate 768-dimensional dense embedding vectors for a batch of texts."""
        if not texts:
            return []

        self._ensure_models()
        cleaned = [(t or "").strip() or "empty" for t in texts]
        results = []
        for vec in self._dense_model.embed(cleaned, batch_size=batch_size):
            as_list = vec.tolist() if hasattr(vec, "tolist") else list(vec)
            results.append(as_list)
        return results

    # ------------------------------------------------------------------
    # Sparse BM25 Embeddings
    # ------------------------------------------------------------------

    def embed_sparse(self, text: str) -> models.SparseVector:
        """Generate a sparse lexical embedding vector for a single text."""
        self._ensure_models()
        cleaned = (text or "").strip()
        if not cleaned:
            return models.SparseVector(indices=[], values=[])

        sparse_outputs = list(self._sparse_model.embed([cleaned]))
        item = sparse_outputs[0]
        indices = item.indices.tolist() if hasattr(item.indices, "tolist") else list(item.indices)
        values = item.values.tolist() if hasattr(item.values, "tolist") else list(item.values)
        return models.SparseVector(indices=indices, values=values)

    def embed_sparse_batch(
        self, texts: List[str], batch_size: int = 32
    ) -> List[models.SparseVector]:
        """Generate sparse lexical vectors for a batch of texts."""
        if not texts:
            return []

        self._ensure_models()
        cleaned = [(t or "").strip() or "empty" for t in texts]
        results = []
        for item in self._sparse_model.embed(cleaned, batch_size=batch_size):
            indices = item.indices.tolist() if hasattr(item.indices, "tolist") else list(item.indices)
            values = item.values.tolist() if hasattr(item.values, "tolist") else list(item.values)
            results.append(models.SparseVector(indices=indices, values=values))
        return results

    # ------------------------------------------------------------------
    # Metadata & Health
    # ------------------------------------------------------------------

    def get_info(self) -> Dict:
        """Return information about the active models and configuration."""
        return {
            "dense_model": self.dense_model_name,
            "dense_dimensions": self.dim,
            "sparse_model": self.sparse_model_name,
            "status": "ready" if self._initialized else "standby",
            "provider": "Hugging Face / FastEmbed ONNX",
        }
