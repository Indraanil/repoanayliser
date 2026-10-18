from __future__ import annotations

import base64
import json
import sys
from pathlib import Path
from typing import Any

from .config import BACKEND_ROOT

backend_path = str(BACKEND_ROOT)
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from src.parser.repository_filter import (  # noqa: E402
    ALWAYS_IGNORED_DIRECTORIES,
    RepositoryFilter,
    SUPPORTED_PARSER_EXTENSIONS,
)

SUPPORTED_EXTENSIONS = SUPPORTED_PARSER_EXTENSIONS
IGNORED_PARTS = ALWAYS_IGNORED_DIRECTORIES


def clamp(value: int, minimum: int, maximum: int) -> int:
    return max(minimum, min(maximum, value))


def encode_cursor(offset: int) -> str | None:
    if offset <= 0:
        return None
    raw = json.dumps({"o": offset}, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def decode_cursor(cursor: str | None) -> int:
    if not cursor:
        return 0
    try:
        padded = cursor + "=" * (-len(cursor) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded).decode())
        return max(0, int(data["o"]))
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        raise ValueError("Invalid cursor") from None


def page(items: list[Any], cursor: str | None, limit: int, maximum: int = 100) -> dict[str, Any]:
    offset = decode_cursor(cursor)
    size = clamp(limit, 1, maximum)
    selected = items[offset:offset + size]
    next_offset = offset + len(selected)
    return {
        "items": selected,
        "next_cursor": encode_cursor(next_offset) if next_offset < len(items) else None,
        "returned": len(selected),
        "total": len(items),
    }


def ensure_inside(root: str | Path, candidate: str | Path) -> Path:
    resolved_root = Path(root).resolve()
    path = Path(candidate)
    resolved = path.resolve() if path.is_absolute() else (resolved_root / path).resolve()
    try:
        resolved.relative_to(resolved_root)
    except ValueError:
        raise ValueError("Path is outside the selected repository") from None
    return resolved


def relative(root: str | Path, candidate: str | Path | None) -> str | None:
    if not candidate:
        return None
    try:
        return Path(candidate).resolve().relative_to(Path(root).resolve()).as_posix()
    except (ValueError, OSError):
        return str(candidate).replace("\\", "/")


def supported_files(root: str | Path) -> list[Path]:
    return RepositoryFilter(root).discover(SUPPORTED_EXTENSIONS)


def compact(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: compact(item)
            for key, item in value.items()
            if item is not None and item != "" and item != [] and item != {}
        }
    if isinstance(value, list):
        return [compact(item) for item in value]
    return value


def bounded_text(text: str | None, maximum: int) -> tuple[str, bool]:
    text = text or ""
    if len(text) <= maximum:
        return text, False
    marker = "\n… [truncated]"
    return text[: max(0, maximum - len(marker))] + marker, True


def source_excerpt(path: Path, start_line: int = 1, max_lines: int = 120, max_chars: int = 12_000) -> dict[str, Any]:
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError as exc:
        return {"error": f"Source unavailable: {exc.__class__.__name__}"}
    start = clamp(start_line, 1, max(1, len(lines)))
    selected = lines[start - 1:start - 1 + max_lines]
    numbered = "\n".join(f"{index}: {line}" for index, line in enumerate(selected, start=start))
    text, truncated_chars = bounded_text(numbered, max_chars)
    return {
        "start_line": start,
        "end_line": start + max(0, len(selected) - 1),
        "text": text,
        "truncated": truncated_chars or start - 1 + len(selected) < len(lines),
    }


def extract_function_source(
    path: Path, start_line: int = 1, max_lines: int = 120, max_chars: int = 12_000
) -> dict[str, Any]:
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError as exc:
        return {"error": f"Source unavailable: {exc.__class__.__name__}"}
    if not lines or start_line < 1 or start_line > len(lines):
        return source_excerpt(path, start_line, max_lines, max_chars)

    def_idx = start_line - 1
    dec_idx = def_idx
    while dec_idx > 0 and lines[dec_idx - 1].strip().startswith("@"):
        dec_idx -= 1

    actual_start = dec_idx + 1
    suffix = path.suffix.lower()

    if suffix in {".py"}:
        def_line = lines[def_idx]
        base_indent = len(def_line) - len(def_line.lstrip())
        end_idx = def_idx + 1
        while end_idx < len(lines):
            curr = lines[end_idx]
            stripped = curr.strip()
            if not stripped or stripped.startswith("#"):
                end_idx += 1
                continue
            curr_indent = len(curr) - len(curr.lstrip())
            if curr_indent <= base_indent:
                break
            end_idx += 1
    elif suffix in {".js", ".jsx", ".ts", ".tsx"}:
        end_idx = def_idx
        brace_count = 0
        started_braces = False
        while end_idx < len(lines):
            line = lines[end_idx]
            brace_count += line.count("{") - line.count("}")
            if "{" in line:
                started_braces = True
            end_idx += 1
            if started_braces and brace_count <= 0:
                break
    else:
        end_idx = min(len(lines), def_idx + max_lines)

    while end_idx > dec_idx + 1 and not lines[end_idx - 1].strip():
        end_idx -= 1

    selected = lines[dec_idx:min(end_idx, dec_idx + max_lines)]
    numbered = "\n".join(f"{index}: {line}" for index, line in enumerate(selected, start=actual_start))
    text, truncated_chars = bounded_text(numbered, max_chars)
    return {
        "start_line": actual_start,
        "end_line": actual_start + max(0, len(selected) - 1),
        "text": text,
        "truncated": truncated_chars or len(selected) < (end_idx - dec_idx),
    }

