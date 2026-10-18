from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

ARCHITECTURE_SCHEMA_VERSION = "1.0"
ARCHITECTURE_VALIDATOR_VERSION = "1.0"


class ArchitectureGrounding:
    def __init__(
        self,
        files: dict[str, str],
        file_details: dict[str, dict[str, Any]],
        dependencies: list[tuple[str, str]],
    ) -> None:
        self.files = files
        self.file_details = file_details
        self.dependencies = dependencies

    def public_evidence(self, patterns: dict[str, Any] | None = None) -> dict[str, Any]:
        return {
            "total_files": len(self.files),
            "total_dependencies": len(self.dependencies),
            "patterns": patterns or {},
        }


def collect_architecture_evidence(
    driver_wrapper: Any, repo_id: str, root: Path
) -> ArchitectureGrounding:
    files: dict[str, str] = {}
    file_details: dict[str, dict[str, Any]] = {}
    dependencies: list[tuple[str, str]] = []

    driver = getattr(driver_wrapper, "driver", driver_wrapper)
    if driver is None:
        return ArchitectureGrounding(files, file_details, dependencies)

    try:
        with driver.session() as session:
            file_result = session.run(
                """
                MATCH (r:Repository)-[:CONTAINS]->(f:File)
                WHERE r.repo_id = $repo_id OR r.id = $repo_id
                OPTIONAL MATCH (f)-[:CONTAINS]->(fn:Function)
                OPTIONAL MATCH (f)-[:CONTAINS]->(c:Class)
                OPTIONAL MATCH (f)-[:IMPORTS]->(m:Module)
                RETURN f.path as path, f.language as language,
                       collect(DISTINCT fn.name) as functions,
                       collect(DISTINCT c.name) as classes,
                       collect(DISTINCT m.name) as imports
                """,
                repo_id=repo_id,
            )
            for record in file_result:
                raw_path = record.get("path")
                if not raw_path:
                    continue
                path_str = str(Path(raw_path))
                files[path_str] = path_str
                file_details[path_str] = {
                    "language": record.get("language") or "unknown",
                    "functions": record.get("functions") or [],
                    "classes": record.get("classes") or [],
                    "imports": record.get("imports") or [],
                }

            dep_result = session.run(
                """
                MATCH (r:Repository)-[:CONTAINS]->(f1:File)-[:DEPENDS_ON]->(f2:File)<-[:CONTAINS]-(r)
                WHERE r.repo_id = $repo_id OR r.id = $repo_id
                RETURN f1.path as source, f2.path as target
                """,
                repo_id=repo_id,
            )
            for record in dep_result:
                src = record.get("source")
                tgt = record.get("target")
                if src and tgt:
                    src_str = str(Path(src))
                    tgt_str = str(Path(tgt))
                    if src_str in files and tgt_str in files:
                        dependencies.append((src_str, tgt_str))
    except Exception as e:
        logger.warning(f"Error collecting architecture evidence: {e}")

    return ArchitectureGrounding(files, file_details, dependencies)


def interpretation_cache_status(
    interpretation_revision: Any,
    current_revision: Any,
    schema_version: Any = None,
    validator_version: Any = None,
    validation_status: Any = None,
    has_interpretation: bool = False,
) -> str:
    if not has_interpretation and not interpretation_revision:
        return "missing"
    if interpretation_revision != current_revision:
        return "stale"
    if validation_status == "invalid":
        return "invalid"
    if schema_version and schema_version != ARCHITECTURE_SCHEMA_VERSION:
        return "stale"
    if not has_interpretation:
        return "missing"
    return "current"


def parse_structured_interpretation(raw_json: Any) -> tuple[dict[str, Any] | None, list[str]]:
    if not raw_json:
        return None, ["Missing interpretation data"]
    if isinstance(raw_json, dict):
        return raw_json, []
    if isinstance(raw_json, str):
        try:
            parsed = json.loads(raw_json)
            if isinstance(parsed, dict):
                return parsed, []
            return None, ["Interpretation JSON must be an object"]
        except Exception as e:
            return None, [f"JSON decode error: {e}"]
    return None, ["Invalid interpretation type"]


def validate_interpretation(
    parsed: dict[str, Any], grounding: Any
) -> tuple[dict[str, Any] | None, list[str]]:
    errors: list[str] = []
    if not isinstance(parsed, dict):
        return None, ["Interpretation must be a dictionary"]
    return parsed, errors


def render_interpretation(validated: dict[str, Any]) -> dict[str, str]:
    return {
        "overview": validated.get("overview") or validated.get("macro") or "",
        "modules": validated.get("modules") or validated.get("meso") or "",
        "key_files": validated.get("key_files") or validated.get("micro") or "",
    }
