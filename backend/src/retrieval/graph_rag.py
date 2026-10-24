"""
GraphRAGEngine
--------------
Orchestrates Graph RAG retrieval combining:
1. Qdrant Hybrid Search: Dense 768-dim embeddings (Hugging Face) + Sparse BM25
2. Knowledge Graph Topology: Multi-hop graph traversal over Neo4j & NetworkX
3. Graph Context Fusion: Re-ranking via centrality, neighborhood affinity & blast radius
"""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
import networkx as nx

from .embedding_service import EmbeddingService
from .qdrant_store import QdrantRAGStore
from ..graph.graph_db import GraphDB

logger = logging.getLogger(__name__)


from collections import OrderedDict
from threading import Lock

class GraphRAGEngine:
    """Graph-enhanced Retrieval-Augmented Generation using Qdrant and Neo4j."""

    def __init__(
        self,
        qdrant_store: Optional[QdrantRAGStore] = None,
        graph_db: Optional[GraphDB] = None,
    ):
        self.qdrant = qdrant_store or QdrantRAGStore.get_instance()
        self.graph_db = graph_db
        self._query_cache: OrderedDict = OrderedDict()
        self._cache_lock: Lock = Lock()
        self._max_cache_size: int = 200

    # ------------------------------------------------------------------
    # Indexing Knowledge Graph & Code Entities into Qdrant
    # ------------------------------------------------------------------

    def index_codebase(
        self,
        repo_id: str,
        parsed_files: List[Dict[str, Any]],
        dependency_graph: Optional[nx.DiGraph] = None,
        coupling_metrics: Optional[Dict[str, Any]] = None,
    ) -> int:
        """
        Build and index graph-enriched code entities into Qdrant.
        Combines AST metadata, symbol definitions, docstrings, and graph connectivity.
        """
        entities = []
        coupling_lookup = coupling_metrics or {}

        for parsed in parsed_files:
            file_path = parsed.get("file", "")
            if not file_path:
                continue

            clean_path = str(file_path).replace("\\", "/")
            rel_path = clean_path.split("/")[-1] if "/" in clean_path else clean_path

            # Graph context for file
            incoming_deps = []
            outgoing_deps = []
            if dependency_graph and dependency_graph.has_node(file_path):
                incoming_deps = [str(n).replace("\\", "/").split("/")[-1] for n in dependency_graph.predecessors(file_path)]
                outgoing_deps = [str(n).replace("\\", "/").split("/")[-1] for n in dependency_graph.successors(file_path)]

            file_coupling = coupling_lookup.get(file_path, {})
            instability = file_coupling.get("instability", 0.5)

            # 1. Index File Entity
            file_classes = [
                c.get("name", "") if isinstance(c, dict) else str(c)
                for c in parsed.get("classes", [])
            ]
            file_classes = [c for c in file_classes if c]

            file_functions = [
                f.get("name", "") if isinstance(f, dict) else str(f)
                for f in parsed.get("functions", [])
            ]
            file_functions = [f for f in file_functions if f]

            file_imports = [
                imp.get("module", "") if isinstance(imp, dict) else str(imp)
                for imp in parsed.get("imports", [])
            ]
            file_imports = [imp for imp in file_imports if imp]

            file_text_parts = [
                f"[File] {clean_path}",
                f"Language: {parsed.get('language', 'unknown')}",
                f"Classes defined: {', '.join(file_classes)}" if file_classes else "",
                f"Functions defined: {', '.join(file_functions)}" if file_functions else "",
                f"Imports: {', '.join(file_imports[:12])}" if file_imports else "",
                f"Dependent files: {', '.join(incoming_deps[:8])}" if incoming_deps else "",
                f"Imports files: {', '.join(outgoing_deps[:8])}" if outgoing_deps else "",
            ]
            file_text = "\n".join(p for p in file_text_parts if p)

            entities.append({
                "id": f"file:{clean_path}",
                "text": file_text,
                "type": "file",
                "file_path": clean_path,
                "payload": {
                    "name": rel_path,
                    "language": parsed.get("language", ""),
                    "classes_count": len(file_classes),
                    "functions_count": len(file_functions),
                    "incoming_deps": incoming_deps,
                    "outgoing_deps": outgoing_deps,
                    "instability": instability,
                },
            })

            # 2. Index Class Entities
            for cls_info in parsed.get("classes", []):
                if isinstance(cls_info, str):
                    cls_name = cls_info
                    methods = []
                    bases = []
                    docstring = ""
                elif isinstance(cls_info, dict):
                    cls_name = cls_info.get("name")
                    methods = [
                        m.get("name", "") if isinstance(m, dict) else str(m)
                        for m in cls_info.get("methods", [])
                    ]
                    methods = [m for m in methods if m]
                    bases = cls_info.get("bases", [])
                    docstring = cls_info.get("docstring", "") or ""
                else:
                    continue

                if not cls_name:
                    continue

                class_text_parts = [
                    f"[Class] {cls_name} in {clean_path}",
                    f"Inherits: {', '.join(bases)}" if bases else "",
                    f"Docstring: {docstring}" if docstring else "",
                    f"Methods: {', '.join(methods)}" if methods else "",
                    f"Belongs to file: {rel_path}",
                ]
                class_text = "\n".join(p for p in class_text_parts if p)

                entities.append({
                    "id": f"class:{clean_path}:{cls_name}",
                    "text": class_text,
                    "type": "class",
                    "file_path": clean_path,
                    "payload": {
                        "name": cls_name,
                        "bases": bases,
                        "methods": methods,
                        "docstring": docstring[:300],
                        "file": clean_path,
                    },
                })

            # 3. Index Function Entities
            for fn_info in parsed.get("functions", []):
                if isinstance(fn_info, str):
                    fn_name = fn_info
                    docstring = ""
                    signature = f"def {fn_name}()"
                    code_preview = ""
                    calls = []
                elif isinstance(fn_info, dict):
                    fn_name = fn_info.get("name")
                    docstring = fn_info.get("docstring", "") or ""
                    signature = fn_info.get("signature", "") or f"def {fn_name}()"
                    code_snippet = fn_info.get("code", "") or fn_info.get("body", "") or ""
                    code_preview = "\n".join(code_snippet.splitlines()[:15]) if code_snippet else ""
                    calls = [
                        c.get("target", "") if isinstance(c, dict) else str(c)
                        for c in fn_info.get("calls", [])
                    ]
                    calls = [c for c in calls if c]
                else:
                    continue

                if not fn_name:
                    continue

                fn_text_parts = [
                    f"[Function] {fn_name} in {clean_path}",
                    f"Signature: {signature}",
                    f"Docstring: {docstring}" if docstring else "",
                    f"Calls functions: {', '.join(calls[:8])}" if calls else "",
                    f"Defined in: {rel_path}",
                    f"Code excerpt:\n{code_preview}" if code_preview else "",
                ]
                fn_text = "\n".join(p for p in fn_text_parts if p)

                entities.append({
                    "id": f"function:{clean_path}:{fn_name}",
                    "text": fn_text,
                    "type": "function",
                    "file_path": clean_path,
                    "payload": {
                        "name": fn_name,
                        "signature": signature,
                        "docstring": docstring[:300],
                        "calls": calls[:10],
                        "code_preview": code_preview,
                        "file": clean_path,
                    },
                })

        logger.info(f"📊 Prepared {len(entities)} graph-enriched entities for Qdrant index")
        count = self.qdrant.index_entities(repo_id, entities)
        # Invalidate query cache for this repo
        with self._cache_lock:
            stale = [k for k in self._query_cache if k.startswith(f"{repo_id}:")]
            for k in stale:
                del self._query_cache[k]
        return count

    # ------------------------------------------------------------------
    # Graph RAG Search: Hybrid Vector Search + Knowledge Graph Expansion
    # ------------------------------------------------------------------

    def retrieve(
        self,
        query: str,
        repo_id: Optional[str] = None,
        context_file: Optional[str] = None,
        top_k: int = 8,
        mode: str = "hybrid",  # "hybrid", "dense", "sparse", "graph_rag"
    ) -> Dict[str, Any]:
        """
        Execute Graph RAG retrieval:
        1. Fetch candidate nodes using Qdrant (Hybrid RRF / Dense / Sparse).
        2. Expand multi-hop graph topology (callers, callees, dependencies from Neo4j/NetworkX).
        3. Re-score and blend semantic similarity with structural graph centrality.
        4. Package structured architectural evidence.
        """
        # Check in-memory query cache first
        cache_key = f"{repo_id}:{mode}:{top_k}:{context_file}:{query.strip().lower()}"
        with self._cache_lock:
            if cache_key in self._query_cache:
                self._query_cache.move_to_end(cache_key)
                return self._query_cache[cache_key]

        # Step 1: Vector Search in Qdrant
        if mode == "dense":
            raw_hits = self.qdrant.dense_search(query=query, repo_id=repo_id, top_k=top_k * 2)
        elif mode == "sparse":
            raw_hits = self.qdrant.sparse_search(query=query, repo_id=repo_id, top_k=top_k * 2)
        else:
            # Default to Hybrid RRF Search (768-dim dense + BM25 sparse)
            raw_hits = self.qdrant.hybrid_search(query=query, repo_id=repo_id, top_k=top_k * 2)

        # Step 2: Extract structural dependencies from Neo4j if context_file or graph_db is available
        context_files: Set[str] = set()
        if context_file:
            context_files.add(str(context_file).replace("\\", "/"))
            if self.graph_db:
                try:
                    deps = self.graph_db.get_dependencies(context_file, repo_id=repo_id)
                    affected = self.graph_db.get_affected_files(context_file, repo_id=repo_id)
                    for item in deps + affected:
                        context_files.add(str(item).replace("\\", "/"))
                except Exception as e:
                    logger.debug(f"Graph dependency expansion skipped: {e}")

        # Step 3: Graph Multi-Hop Expansion and Re-scoring
        scored_nodes = []
        seen_entities: Set[str] = set()

        for hit in raw_hits:
            payload = hit.get("payload", {})
            entity_id = payload.get("entity_id") or hit.get("id")
            if entity_id in seen_entities:
                continue
            seen_entities.add(entity_id)

            file_path = payload.get("file_path", "")
            base_score = float(hit.get("score", 0.0))

            # Graph Affinity Boost:
            # Check if this node is connected to the context_file or other seed nodes
            graph_boost = 0.0
            connected_edges = []

            # Match against context_files
            if any(file_path.endswith(ctx) or ctx.endswith(file_path) for ctx in context_files):
                graph_boost += 0.35
                connected_edges.append("direct_dependency_match")

            # Check incoming / outgoing edges in payload
            incoming = payload.get("incoming_deps", [])
            outgoing = payload.get("outgoing_deps", [])
            calls = payload.get("calls", [])

            if incoming or outgoing:
                graph_boost += min(0.2, (len(incoming) + len(outgoing)) * 0.03)

            # Transitive caller context from Neo4j if it is a function
            if payload.get("type") == "function" and self.graph_db and repo_id:
                try:
                    callers = self.graph_db.get_function_callers(payload.get("name", ""), repo_id=repo_id)
                    if callers:
                        connected_edges.extend([f"called_by:{c.get('caller_function')}" for c in callers[:3]])
                        graph_boost += 0.15
                except Exception:
                    pass

            final_score = round(base_score + graph_boost, 4)

            scored_nodes.append({
                "id": entity_id,
                "name": payload.get("name", ""),
                "type": payload.get("type", "symbol"),
                "file": file_path,
                "score": final_score,
                "vector_score": base_score,
                "graph_boost": round(graph_boost, 4),
                "signature": payload.get("signature", ""),
                "docstring": payload.get("docstring", ""),
                "code_preview": payload.get("code_preview", ""),
                "text_excerpt": payload.get("text_excerpt", ""),
                "incoming_deps": incoming,
                "outgoing_deps": outgoing,
                "calls": calls,
                "connected_edges": connected_edges,
            })

        # Sort by final fused score descending
        scored_nodes.sort(key=lambda x: x["score"], reverse=True)
        top_evidence = scored_nodes[:top_k]

        result = {
            "query": query,
            "repo_id": repo_id,
            "mode": mode,
            "model": self.qdrant.embedder.dense_model_name,
            "dimensions": self.qdrant.embedder.dim,
            "total_candidates": len(raw_hits),
            "evidence": top_evidence,
        }

        with self._cache_lock:
            self._query_cache[cache_key] = result
            if len(self._query_cache) > self._max_cache_size:
                self._query_cache.popitem(last=False)

        return result

    # ------------------------------------------------------------------
    # Formatting Evidence for LLM Reasoning
    # ------------------------------------------------------------------

    def format_evidence_for_llm(self, evidence: List[Dict]) -> str:
        """Format retrieved Graph RAG evidence into clean, structured Markdown for LLM prompt."""
        if not evidence:
            return "No relevant structural or semantic evidence found."

        blocks = []
        for i, item in enumerate(evidence, 1):
            title = f"{i}. [{item.get('type', 'symbol').upper()}] {item.get('name', 'Unknown')}"
            file_line = f"   File: {item.get('file', 'unknown')} (Score: {item.get('score', 0):.3f})"
            lines = [title, file_line]

            if item.get("signature"):
                lines.append(f"   Signature: {item['signature']}")
            if item.get("docstring"):
                lines.append(f"   Docstring: {item['docstring']}")
            if item.get("calls"):
                lines.append(f"   Calls: {', '.join(item['calls'][:5])}")
            if item.get("connected_edges"):
                lines.append(f"   Graph Relations: {', '.join(item['connected_edges'])}")
            if item.get("code_preview"):
                lines.append(f"   Snippet:\n```\n{item['code_preview'][:250]}\n```")

            blocks.append("\n".join(lines))

        return "\n\n".join(blocks)
