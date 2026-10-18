from __future__ import annotations

from pathlib import Path
from typing import Any

ALWAYS_IGNORED_DIRECTORIES = {
    ".git",
    ".github",
    ".vscode",
    ".idea",
    "node_modules",
    "venv",
    ".venv",
    "__pycache__",
    "dist",
    "build",
    "target",
    ".next",
    ".nuxt",
    ".turbo",
    ".svelte-kit",
    "coverage",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    "chroma_db",
    "workspace",
    ".data",
}

SUPPORTED_PARSER_EXTENSIONS = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".java": "java",
}

FILTER_POLICY_VERSION = "1.0"


def is_obviously_ignored(path: Path | str) -> bool:
    p = Path(path)
    for part in p.parts:
        if part in ALWAYS_IGNORED_DIRECTORIES:
            return True
    return False


class RepositoryFilter:
    def __init__(self, root: Path | str):
        self.root = Path(root).resolve()

    def should_include(self, path: Path | str) -> bool:
        resolved = Path(path).resolve()
        try:
            rel = resolved.relative_to(self.root)
        except ValueError:
            return False
        for part in rel.parts:
            if part in ALWAYS_IGNORED_DIRECTORIES:
                return False
        return True

    def filter_paths(self, paths: list[Path | str]) -> list[Path]:
        return [Path(p) for p in paths if self.should_include(p)]

    def discover(self, extensions: set[str] | list[str] | None = None) -> list[Path]:
        if extensions is None:
            extensions = SUPPORTED_PARSER_EXTENSIONS
        ext_set = {ext.lower() for ext in extensions}
        found: list[Path] = []
        if not self.root.exists():
            return found
        for item in self.root.rglob("*"):
            if item.is_file() and item.suffix.lower() in ext_set:
                if self.should_include(item):
                    found.append(item.resolve())
        return found

    def source_coverage(self) -> dict[str, Any]:
        files = self.discover()
        by_ext: dict[str, int] = {}
        for f in files:
            ext = f.suffix.lower()
            by_ext[ext] = by_ext.get(ext, 0) + 1
        return {
            "total_files": len(files),
            "by_extension": by_ext,
        }
