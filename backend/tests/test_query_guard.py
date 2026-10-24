import sys
from pathlib import Path
import unittest
from unittest.mock import Mock

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.analysis_engine import AnalysisEngine
from src.reasoning.query_guard import ProjectQueryGuard


class ProjectQueryGuardTests(unittest.TestCase):
    def test_allows_project_questions(self):
        guard = ProjectQueryGuard()

        result = guard.evaluate("How does graph RAG retrieve related code?")

        self.assertEqual(result, {
            "allowed": True,
            "decision": "in_scope",
            "reason": "project_vocabulary",
        })
        self.assertTrue(guard.evaluate("Explain backend/src/analysis_engine.py")["allowed"])
        self.assertTrue(guard.evaluate("Tell me about Graph RAG")["allowed"])

    def test_rejects_unrelated_questions(self):
        result = ProjectQueryGuard().evaluate("What's a good dinner recipe?")

        self.assertFalse(result["allowed"])
        self.assertEqual(result["decision"], "out_of_scope")

    def test_out_of_scope_question_skips_retrieval_and_llm(self):
        engine = AnalysisEngine.__new__(AnalysisEngine)
        engine.project_query_guard = ProjectQueryGuard()
        engine.current_repo_id = "test-repo"
        engine.retrieval_engine = Mock()
        engine.llm = Mock()

        response = engine.answer_project_question("What's a good dinner recipe?")

        engine.retrieval_engine.retrieve_evidence.assert_not_called()
        engine.llm._execute_chat_completion.assert_not_called()
        self.assertEqual(response["guardrail"]["decision"], "out_of_scope")

    def test_in_scope_question_uses_retrieved_evidence(self):
        engine = AnalysisEngine.__new__(AnalysisEngine)
        engine.project_query_guard = ProjectQueryGuard()
        engine.current_repo_id = "test-repo"
        engine.retrieval_engine = Mock()
        engine.retrieval_engine.retrieve_evidence.return_value = {
            "evidence": [{
                "file": "backend/main.py",
                "code": "function: chat_with_project",
                "score": 0.9,
                "metadata": {"type": "function", "name": "chat_with_project"},
            }],
            "source": "qdrant_graph_rag",
        }
        engine.llm = Mock()
        engine.llm._execute_chat_completion.return_value = Mock(
            choices=[Mock(message=Mock(content="The chat route is in backend/main.py."))]
        )

        response = engine.answer_project_question("Explain the project API route")

        engine.retrieval_engine.retrieve_evidence.assert_called_once_with(
            query="Explain the project API route",
            repo_id="test-repo",
            mode="graph_rag",
            top_k=5,
        )
        self.assertEqual(response["answer"], "The chat route is in backend/main.py.")
        self.assertEqual(response["sources"][0]["file"], "backend/main.py")
        self.assertEqual(response["retrieval_source"], "qdrant_graph_rag")


if __name__ == "__main__":
    unittest.main()
