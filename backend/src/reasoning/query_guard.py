import re
from typing import Dict


class ProjectQueryGuard:
    """Small decision-tree guard for routing project and code questions."""

    _PROJECT_TERMS = {
        "api",
        "auth",
        "architecture",
        "backend",
        "bug",
        "class",
        "code",
        "codebase",
        "component",
        "config",
        "database",
        "db",
        "dependency",
        "endpoint",
        "error",
        "exception",
        "file",
        "function",
        "graph",
        "graphrag",
        "import",
        "llm",
        "login",
        "module",
        "package",
        "performance",
        "project",
        "query",
        "rag",
        "retrieval",
        "repository",
        "repo",
        "route",
        "schema",
        "search",
        "security",
        "service",
        "state",
        "symbol",
        "test",
        "ui",
    }
    _DEVELOPER_ACTIONS = {
        "add",
        "analyze",
        "change",
        "compare",
        "describe",
        "does",
        "explain",
        "find",
        "fix",
        "how",
        "implement",
        "is",
        "list",
        "locate",
        "map",
        "review",
        "show",
        "tell",
        "trace",
        "update",
        "use",
        "uses",
        "used",
        "where",
        "what",
        "why",
        "work",
        "works",
        "implemented",
    }
    _CODE_ARTIFACT = re.compile(
        r"(?:\b[\w.-]+\.(?:py|js|jsx|ts|tsx|java|json|css|html|md)\b"
        r"|(?:^|[\s`])(?:src|backend|frontend)[\\/][\w./\\-]+"
        r"|\b[a-z][a-z0-9]*_[a-z0-9_]+\b"
        r"|\b[A-Z][a-zA-Z0-9]*\.[a-zA-Z_][a-zA-Z0-9_]*\b)",
        re.IGNORECASE,
    )

    def evaluate(self, query: str) -> Dict[str, object]:
        normalized = query.strip().lower()
        if not normalized:
            return {
                "allowed": False,
                "decision": "out_of_scope",
                "reason": "empty_query",
            }

        tokens = set(re.findall(r"[a-z0-9_]+", normalized))
        project_terms = tokens.intersection(self._PROJECT_TERMS)
        has_code_artifact = bool(self._CODE_ARTIFACT.search(query))
        has_developer_action = bool(tokens.intersection(self._DEVELOPER_ACTIONS))

        if has_code_artifact:
            reason = "code_reference"
        elif len(project_terms) >= 2:
            reason = "project_vocabulary"
        elif project_terms and has_developer_action:
            reason = "developer_question"
        else:
            return {
                "allowed": False,
                "decision": "out_of_scope",
                "reason": "no_project_or_code_signals",
            }

        return {
            "allowed": True,
            "decision": "in_scope",
            "reason": reason,
        }
