"""
Test Suite for Qdrant Vector DB & Hugging Face 768-dim Graph RAG
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.retrieval.embedding_service import EmbeddingService
from src.retrieval.qdrant_store import QdrantRAGStore
from src.retrieval.graph_rag import GraphRAGEngine
from src.analysis_engine import AnalysisEngine


def test_embedding_service():
    print("\n[1] Testing Hugging Face 768-dim Embedding Service...")
    embedder = EmbeddingService.get_instance()
    info = embedder.get_info()
    print("    Model Info:", info)
    assert info["dense_dimensions"] == 768, f"Expected 768 dims, got {info['dense_dimensions']}"

    dense_vec = embedder.embed_dense("def parse_file(path: str) -> ASTNode:")
    print(f"    Dense vector length: {len(dense_vec)} (first 3 values: {[round(v, 4) for v in dense_vec[:3]]})")
    assert len(dense_vec) == 768

    sparse_vec = embedder.embed_sparse("parse_file ASTNode")
    print(f"    Sparse vector indices count: {len(sparse_vec.indices)}")
    assert len(sparse_vec.indices) > 0
    print("    Embedding Service: PASSED")


def test_qdrant_hybrid_search():
    print("\n[2] Testing Qdrant Dual-Vector Store & Hybrid RRF Search...")
    qdrant = QdrantRAGStore.get_instance()
    status = qdrant.get_status()
    print("    Qdrant Status:", status)

    # Test indexing sample entities
    test_repo = "test-repo-rag-01"
    sample_entities = [
        {
            "id": "fn_parse",
            "text": "[Function] parse_file in parser.py\nSignature: def parse_file(self, path)\nDocstring: Parses file into AST tree\nCalls: tree_sitter.parse",
            "type": "function",
            "file_path": "backend/src/parser.py",
            "payload": {
                "name": "parse_file",
                "signature": "def parse_file(self, path)",
                "calls": ["tree_sitter.parse"],
                "file": "backend/src/parser.py"
            }
        },
        {
            "id": "fn_neo4j",
            "text": "[Function] store_graph in graph_db.py\nSignature: def store_graph(self, nodes, edges)\nDocstring: Bulk inserts nodes and edges into Neo4j database\nCalls: neo4j.session.run",
            "type": "function",
            "file_path": "backend/src/graph_db.py",
            "payload": {
                "name": "store_graph",
                "signature": "def store_graph(self, nodes, edges)",
                "calls": ["neo4j.session.run"],
                "file": "backend/src/graph_db.py"
            }
        },
        {
            "id": "cls_engine",
            "text": "[Class] AnalysisEngine in engine.py\nDocstring: Main orchestrator for static analysis, metrics, and Graph RAG retrieval\nMethods: analyze_repo, search_codebase",
            "type": "class",
            "file_path": "backend/src/engine.py",
            "payload": {
                "name": "AnalysisEngine",
                "methods": ["analyze_repo", "search_codebase"],
                "file": "backend/src/engine.py"
            }
        }
    ]

    indexed = qdrant.index_entities(test_repo, sample_entities)
    print(f"    Indexed {indexed} sample entities")
    assert indexed == 3

    # Test Hybrid Search
    results = qdrant.hybrid_search("how are AST nodes parsed?", repo_id=test_repo, top_k=2)
    print("    Hybrid Search Hits:")
    for r in results:
        payload = r.get("payload", {})
        print(f"      - [{payload.get('type')}] {payload.get('name')} (Score: {r['score']}, Mode: {r['search_mode']})")

    assert len(results) > 0
    top_hit_name = results[0]["payload"]["name"]
    assert top_hit_name == "parse_file", f"Expected 'parse_file' as top hit, got '{top_hit_name}'"

    # Cleanup test points
    qdrant.delete_repo(test_repo)
    print("    Qdrant Hybrid Search: PASSED")


def test_graph_rag_expansion():
    print("\n[3] Testing Graph RAG Multi-Hop & Neighborhood Expansion...")
    qdrant = QdrantRAGStore.get_instance()
    rag = GraphRAGEngine(qdrant_store=qdrant)

    test_repo = "test-repo-rag-02"
    sample_entities = [
        {
            "id": "fn_route",
            "text": "[Function] handle_request in api.py\nSignature: def handle_request(req)\nCalls: auth_service.verify, db.fetch",
            "type": "function",
            "file_path": "backend/api.py",
            "payload": {
                "name": "handle_request",
                "signature": "def handle_request(req)",
                "incoming_deps": ["server.py"],
                "outgoing_deps": ["auth.py", "db.py"],
                "calls": ["verify", "fetch"]
            }
        }
    ]
    qdrant.index_entities(test_repo, sample_entities)

    res = rag.retrieve("authentication and database query in API endpoint", repo_id=test_repo, top_k=3, mode="hybrid")
    print(f"    Retrieved {len(res['evidence'])} evidence items (Model: {res['model']}, Dim: {res['dimensions']})")
    assert len(res["evidence"]) == 1
    item = res["evidence"][0]
    print(f"    Evidence: {item['name']}, Fused Score: {item['score']}, Vector Score: {item['vector_score']}, Graph Boost: {item['graph_boost']}")
    assert item["graph_boost"] > 0, "Expected positive graph boost from incoming/outgoing deps"

    # Test evidence markdown formatting
    formatted = rag.format_evidence_for_llm(res["evidence"])
    print(f"    Formatted Markdown Length: {len(formatted)} chars")
    assert "handle_request" in formatted

    qdrant.delete_repo(test_repo)
    print("    Graph RAG Expansion: PASSED")


if __name__ == "__main__":
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    test_embedding_service()
    test_qdrant_hybrid_search()
    test_graph_rag_expansion()
    print("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<")
