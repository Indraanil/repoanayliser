"""
RetrievalEngine
---------------
Graph RAG retrieval engine:
1. Primary: Qdrant dual-vector store (Hugging Face 768-dim dense + BM25 sparse)
   with Neo4j graph topology expansion and affinity boosting.
2. Fallback: Graphify AST retriever.
"""

import logging
from typing import Dict, List, Optional, Set
from .graphify_retriever import GraphifyRetriever
from .graph_rag import GraphRAGEngine
from ..graph.graph_db import GraphDB

logger = logging.getLogger(__name__)


class RetrievalEngine:
    """Orchestrates hybrid semantic and graph-based retrieval for repo analysis."""

    def __init__(
        self,
        graphify_retriever: GraphifyRetriever,
        graph_db: GraphDB,
        graph_rag: Optional[GraphRAGEngine] = None,
    ):
        self.graphify = graphify_retriever
        self.graph_db = graph_db
        self.graph_rag = graph_rag or GraphRAGEngine(graph_db=graph_db)

    def retrieve_evidence(
        self,
        query: str,
        context_file: Optional[str] = None,
        repo_id: Optional[str] = None,
        mode: str = "hybrid",
        top_k: int = 5,
    ) -> Dict:
        """
        Retrieve evidence for a query using Qdrant Graph RAG (Hybrid Search + Graph Expansion).
        Falls back to Graphify keyword search if Qdrant index has no points for repo.
        """
        # Try Qdrant Graph RAG first
        try:
            rag_result = self.graph_rag.retrieve(
                query=query,
                repo_id=repo_id,
                context_file=context_file,
                top_k=top_k,
                mode=mode,
            )

            if rag_result and rag_result.get("evidence"):
                evidence = []
                for item in rag_result["evidence"]:
                    code_parts = []
                    if item.get("name"):
                        code_parts.append(f"{item.get('type', 'symbol')}: {item['name']}")
                    if item.get("signature"):
                        code_parts.append(f"signature: {item['signature']}")
                    if item.get("docstring"):
                        code_parts.append(f"docstring: {item['docstring']}")
                    if item.get("calls"):
                        code_parts.append(f"calls: {', '.join(item['calls'])}")
                    if item.get("connected_edges"):
                        code_parts.append(f"graph_relations: {', '.join(item['connected_edges'])}")
                    if item.get("code_preview"):
                        code_parts.append(f"code excerpt:\n{item['code_preview']}")
                    elif item.get("text_excerpt"):
                        code_parts.append(item["text_excerpt"])

                    evidence.append({
                        "file": item.get("file", ""),
                        "code": "\n".join(code_parts) if code_parts else str(item),
                        "score": item.get("score", 1.0),
                        "vector_score": item.get("vector_score", 1.0),
                        "graph_boost": item.get("graph_boost", 0.0),
                        "metadata": {
                            "file_path": item.get("file", ""),
                            "type": item.get("type", "unknown"),
                            "name": item.get("name", ""),
                            "connected_edges": item.get("connected_edges", []),
                        },
                    })

                return {
                    "query": query,
                    "evidence": evidence,
                    "context_file": context_file,
                    "source": "qdrant_graph_rag",
                    "model": rag_result.get("model", "BAAI/bge-base-en-v1.5"),
                    "dimensions": rag_result.get("dimensions", 768),
                    "mode": mode,
                }
        except Exception as e:
            logger.warning(f"⚠️ Qdrant Graph RAG lookup failed, attempting Graphify fallback: {e}")

        # Fallback to Graphify structural search
        graphify_nodes = self.graphify.get_context_for_query(query, top_k=12)

        structural_context: Set[str] = set()
        if context_file:
            try:
                deps = self.graph_db.get_dependencies(context_file, repo_id=repo_id)
                affected = self.graph_db.get_affected_files(context_file, repo_id=repo_id)
                structural_context = set(deps + affected)
            except Exception:
                pass

        evidence = self._build_evidence(graphify_nodes, structural_context)

        return {
            "query": query,
            "evidence": evidence,
            "context_file": context_file,
            "source": "graphify" if self.graphify.is_available else "unavailable",
            "model": "keyword_fallback",
            "dimensions": 0,
            "mode": "lexical_fallback",
        }

    def retrieve_file_context(self, file_path: str, repo_id: Optional[str] = None) -> Dict:
        """
        Get detailed structural context for a specific file.
        Uses Qdrant Graph RAG entities first, falling back to Graphify.
        Used by blast-radius and function analysis LLM prompts.
        """
        try:
            entities = self.graph_rag.qdrant.get_file_entities(repo_id, file_path)
            if entities:
                functions = []
                classes = []
                callers = []
                imports = []
                for e in entities:
                    t = e.get("type")
                    if t == "function":
                        fn_name = e.get("name")
                        if fn_name:
                            functions.append(fn_name)
                        for c in e.get("calls", []):
                            callers.append(c)
                    elif t == "class":
                        cls_name = e.get("name")
                        if cls_name:
                            classes.append(cls_name)
                    elif t == "file":
                        imports = e.get("outgoing_deps", [])
                return {
                    "functions": functions,
                    "classes": classes,
                    "callers": callers,
                    "imports": imports,
                    "source": "qdrant_graph_rag",
                }
        except Exception:
            pass

        return self.graphify.get_path_context(file_path)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_evidence(
        self, nodes: List[Dict], structural_context: Set[str]
    ) -> List[Dict]:
        """Convert Graphify nodes to the evidence format expected by LLMReasoner."""
        evidence = []
        for node in nodes:
            file_path = node.get("file", "")
            base_score = node.get("_score", 1.0)

            # Boost if file is in structural dependency context
            if any(
                file_path.endswith(ctx) or ctx.endswith(file_path)
                for ctx in structural_context
            ):
                base_score += 0.5

            code_parts = []
            if node.get("name"):
                code_parts.append(f"{node.get('type', 'symbol')}: {node['name']}")
            if node.get("summary") or node.get("docstring"):
                code_parts.append(node.get("summary") or node.get("docstring"))
            if node.get("signature"):
                code_parts.append(f"signature: {node['signature']}")

            evidence.append({
                "file": file_path,
                "code": "\n".join(code_parts) if code_parts else str(node),
                "score": base_score,
                "metadata": {
                    "file_path": file_path,
                    "type": node.get("type", "unknown"),
                    "name": node.get("name", ""),
                },
            })

        evidence.sort(key=lambda x: x["score"], reverse=True)
        return evidence[:5]
