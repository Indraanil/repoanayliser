from __future__ import annotations

import asyncio
import atexit
import json
from typing import Any, Literal

from mcp.server.mcpserver import MCPServer
from mcp.types import ToolAnnotations

from . import __version__
from .config import config
from .incremental import IncrementalAnalyzer, LiveSyncManager
from .service import ArchitechService
from .storage import StateStore
from .utils import bounded_text, clamp, compact
import time


service = ArchitechService()
store = StateStore(config.state_db, config.checkpoint_retention)
incremental = IncrementalAnalyzer(service, store)
live_sync = LiveSyncManager(incremental)


def _log_tool(
    tool_name: str,
    repo_id: str | None = None,
    target: str | None = None,
    details: str | None = None,
    tokens_saved: int = 1000,
    start_time: float | None = None,
) -> None:
    try:
        latency = (time.perf_counter() - start_time) * 1000 if start_time else 0.0
        store.record_activity(
            tool_name=tool_name,
            repo_id=repo_id,
            target=target,
            details=details,
            tokens_saved=tokens_saved,
            latency_ms=round(latency, 2),
        )
    except Exception:
        pass

server = MCPServer(
    name="architech",
    title="ARCHITECH Code Intelligence",
    description="Repository-scoped architecture, dependency, impact, and code-health intelligence.",
    instructions=(
        "Start with list_repositories. Always pass repo_id and disambiguate functions with file_path. "
        "Prefer summaries; request source or LLM generation only when required. "
        "Call sync_repository_changes after local edits when live sync is not active."
    ),
    version=__version__,
)

READ_ONLY = ToolAnnotations(
    readOnlyHint=True,
    destructiveHint=False,
    idempotentHint=True,
    openWorldHint=False,
)
LOCAL_WRITE = ToolAnnotations(
    readOnlyHint=False,
    destructiveHint=False,
    idempotentHint=True,
    openWorldHint=False,
)
ANALYZE = ToolAnnotations(
    readOnlyHint=False,
    destructiveHint=False,
    idempotentHint=False,
    openWorldHint=True,
)


def _bound_architecture(result: dict[str, Any], max_chars: int) -> dict[str, Any]:
    budget = clamp(max_chars, 1000, config.max_response_chars)
    prose_fields = [field for field in ("macro", "meso", "micro") if result.get(field)]
    per_field = max(500, budget // max(1, len(prose_fields)))
    truncated = False
    for field in prose_fields:
        result[field], was_truncated = bounded_text(str(result[field]), per_field)
        truncated = truncated or was_truncated
    if truncated:
        result["truncated"] = True
        result["hint"] = "Request a larger max_chars only if the missing prose is necessary."
    return compact(result)


@server.tool(
    description="List analyzed repositories. Returns small paginated summaries.",
    annotations=READ_ONLY,
)
async def list_repositories(
    query: str = "",
    cursor: str | None = None,
    limit: int = 20,
) -> dict[str, Any]:
    return await asyncio.to_thread(service.list_repositories, query, cursor, limit)


@server.tool(
    description="Analyze a local directory or Git URL and store its ARCHITECH graph. This can be expensive.",
    annotations=ANALYZE,
)
async def analyze_repository(
    source: str,
    source_kind: Literal["local", "git"] = "local",
) -> dict[str, Any]:
    return await asyncio.to_thread(service.analyze_repository, source, source_kind)


@server.tool(
    description="Search files, functions, and classes inside one repository.",
    annotations=READ_ONLY,
)
async def search_symbols(
    repo_id: str,
    query: str,
    kinds: list[Literal["file", "function", "class"]] | None = None,
    cursor: str | None = None,
    limit: int = 20,
) -> dict[str, Any]:
    t0 = time.perf_counter()
    selected = list(kinds) if kinds else ["file", "function", "class"]
    result = await asyncio.to_thread(service.search_symbols, repo_id, query, selected, cursor, limit)
    _log_tool("search_symbols", repo_id=repo_id, target=query, details=f"Returned {len(result.get('items', []))} symbols", tokens_saved=2800, start_time=t0)
    return result


@server.tool(
    description="Get a file's symbols, direct dependencies, and relevant source code excerpt.",
    annotations=READ_ONLY,
)
async def get_file_context(
    repo_id: str,
    file_path: str,
    include_source: bool = True,
    max_source_lines: int = 120,
    relation_limit: int = 20,
) -> dict[str, Any]:
    t0 = time.perf_counter()
    result = await asyncio.to_thread(
        service.file_context,
        repo_id,
        file_path,
        include_source,
        max_source_lines,
        relation_limit,
    )
    _log_tool("get_file_context", repo_id=repo_id, target=file_path, details=f"Retrieved dependencies & symbols with source excerpt", tokens_saved=4200, start_time=t0)
    return result


@server.tool(
    description="Get one function with callers, callees, and its exact implementation source code.",
    annotations=READ_ONLY,
)
async def get_function_context(
    repo_id: str,
    file_path: str,
    function_name: str,
    include_source: bool = True,
    relation_limit: int = 20,
) -> dict[str, Any]:
    t0 = time.perf_counter()
    result = await asyncio.to_thread(
        service.function_context,
        repo_id,
        file_path,
        function_name,
        include_source,
        relation_limit,
    )
    _log_tool("get_function_context", repo_id=repo_id, target=f"{file_path}::{function_name}", details=f"Retrieved function body with caller lines", tokens_saved=3100, start_time=t0)
    return result


@server.tool(
    description="Get cached architecture metrics, pattern evidence, and bounded prose for one repository.",
    annotations=READ_ONLY,
)
async def get_architecture(
    repo_id: str,
    include_components: bool = False,
    generate_if_missing: bool = False,
    max_chars: int = 8000,
) -> dict[str, Any]:
    t0 = time.perf_counter()
    result = await asyncio.to_thread(
        service.architecture,
        repo_id,
        include_components,
        generate_if_missing,
    )
    _log_tool("get_architecture", repo_id=repo_id, target="Architecture", details="Retrieved patterns, coupling & metrics", tokens_saved=16000, start_time=t0)
    return _bound_architecture(result, max_chars)


@server.tool(
    description="Estimate reverse-dependency blast radius for modifying, moving, or deleting one file with relevant target code excerpt.",
    annotations=READ_ONLY,
)
async def get_change_impact(
    repo_id: str,
    file_path: str,
    change_type: Literal["modify", "move", "delete"] = "modify",
    depth: int = 2,
    limit: int = 30,
    include_source: bool = True,
) -> dict[str, Any]:
    t0 = time.perf_counter()
    result = await asyncio.to_thread(
        service.change_impact,
        repo_id,
        file_path,
        change_type,
        depth,
        limit,
        include_source,
    )
    risk_score = result.get("risk", {}).get("score", 0)
    _log_tool("get_change_impact", repo_id=repo_id, target=file_path, details=f"Simulated {change_type} blast radius (Risk: {risk_score}/100)", tokens_saved=11000, start_time=t0)
    return result


@server.tool(
    description="List bounded static-review candidates: unused files/functions or duplicate groups.",
    annotations=READ_ONLY,
)
async def get_code_health(
    repo_id: str,
    category: Literal["files", "functions", "duplicate_functions", "duplicate_files"] = "files",
    cursor: str | None = None,
    limit: int = 20,
) -> dict[str, Any]:
    return await asyncio.to_thread(service.code_health, repo_id, category, cursor, limit)


@server.tool(
    description="List repository snapshots or compare two snapshot IDs using compact structural metrics.",
    annotations=READ_ONLY,
)
async def get_snapshots(
    repo_id: str,
    compare_from: str | None = None,
    compare_to: str | None = None,
    limit: int = 20,
) -> dict[str, Any]:
    return await asyncio.to_thread(service.snapshots, repo_id, compare_from, compare_to, limit)


@server.tool(
    description="Parse only changed local files and batch-refresh graph edges; optionally keep an ephemeral checkpoint.",
    annotations=LOCAL_WRITE,
)
async def sync_repository_changes(
    repo_id: str,
    create_checkpoint: bool = False,
) -> dict[str, Any]:
    return await asyncio.to_thread(incremental.sync, repo_id, create_checkpoint, None)


@server.tool(
    description="Start, stop, or inspect a debounced local file-save watcher for incremental graph refreshes.",
    annotations=LOCAL_WRITE,
)
async def manage_live_sync(
    action: Literal["start", "stop", "status"],
    repo_id: str | None = None,
    debounce_ms: int = 750,
    checkpoint_on_change: bool = False,
) -> dict[str, Any]:
    if action in {"start", "stop"} and not repo_id:
        raise ValueError("repo_id is required for start and stop")
    if action == "start":
        return await live_sync.start(repo_id or "", debounce_ms, checkpoint_on_change)
    if action == "stop":
        return await live_sync.stop(repo_id or "")
    return live_sync.status(repo_id)


@server.tool(
    description="List discovered workflow entrypoints (API routes, background workers, orchestrators) in a repository.",
    annotations=READ_ONLY,
)
async def list_workflows(
    repo_id: str,
) -> dict[str, Any]:
    t0 = time.perf_counter()
    result = await asyncio.to_thread(service.workflows, repo_id)
    _log_tool("list_workflows", repo_id=repo_id, target="Workflows", details=f"Found {result.get('total', 0)} workflows", tokens_saved=2500, start_time=t0)
    return result


@server.tool(
    description="Trace execution workflow from an entrypoint down to data sinks, with role classifications and Mermaid diagram.",
    annotations=READ_ONLY,
)
async def get_workflow(
    repo_id: str,
    entrypoint_name: str,
    file_path: str | None = None,
    depth: int = 4,
) -> dict[str, Any]:
    t0 = time.perf_counter()
    result = await asyncio.to_thread(service.trace_workflow, repo_id, entrypoint_name, file_path, depth)
    _log_tool("get_workflow", repo_id=repo_id, target=entrypoint_name, details=f"Traced execution workflow ({result.get('summary', {}).get('total_steps', 0)} steps)", tokens_saved=4800, start_time=t0)
    return result


def main() -> None:
    atexit.register(service.close)
    server.run(transport="stdio")

