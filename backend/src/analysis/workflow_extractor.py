from typing import Dict, List, Set, Optional, Any
from pathlib import Path
import re
import logging

logger = logging.getLogger(__name__)

class WorkflowExtractor:
    """
    Autonomous Execution Workflow and Data Pipeline Recovery Engine.
    
    Traverses Neo4j and NetworkX call graphs starting from identified Entrypoints
    (API routes, background workers, orchestrators, CLI commands) down to Data Sinks
    (Databases, storage, external APIs).
    
    Generates:
    - Structured execution steps with role classifications
    - Deterministic Mermaid Sequence Diagrams
    - Deterministic Mermaid Flowcharts
    - Architectural impact and data sink footprint summaries
    """
    
    ROLE_ENTRYPOINT = "ENTRYPOINT"
    ROLE_ORCHESTRATOR = "ORCHESTRATOR"
    ROLE_TRANSFORM = "TRANSFORM"
    ROLE_SINK_DB = "DATABASE_SINK"
    ROLE_INTEGRATION = "EXTERNAL_INTEGRATION"
    ROLE_UTIL = "UTILITY"

    def __init__(self, graph_db, dependency_mapper=None, repo_path=None):
        self.graph_db = graph_db
        self.dependency_mapper = dependency_mapper
        self.repo_path = repo_path

    def discover_workflows(self, repo_id: Optional[str] = None) -> List[Dict]:
        """
        Discovers all potential workflow entrypoints across the codebase.
        Categorizes by API Routes, Background Tasks, Domain Orchestrators, and CLI Scripts.
        """
        if not self.graph_db or not getattr(self.graph_db, 'driver', None):
            return []

        with self.graph_db.driver.session() as session:
            # Query all functions with their file paths, lines, and fan-in/fan-out
            if repo_id:
                query = """
                MATCH (r:Repository {repo_id: $repo_id})-[:CONTAINS]->(f:File)-[:CONTAINS]->(fn:Function)
                OPTIONAL MATCH (caller:Function)-[:CALLS]->(fn)
                OPTIONAL MATCH (fn)-[:CALLS]->(callee:Function)
                WITH fn, f, 
                     COUNT(DISTINCT caller) as in_degree, 
                     COUNT(DISTINCT callee) as out_degree
                RETURN fn.name as name,
                       COALESCE(fn.file, f.file_path, f.path) as file,
                       fn.line as line,
                       fn.parent_class as parent_class,
                       in_degree,
                       out_degree
                ORDER BY out_degree DESC, in_degree ASC
                """
                records = session.run(query, repo_id=repo_id)
            else:
                query = """
                MATCH (f:File)-[:CONTAINS]->(fn:Function)
                OPTIONAL MATCH (caller:Function)-[:CALLS]->(fn)
                OPTIONAL MATCH (fn)-[:CALLS]->(callee:Function)
                WITH fn, f, 
                     COUNT(DISTINCT caller) as in_degree, 
                     COUNT(DISTINCT callee) as out_degree
                RETURN fn.name as name,
                       COALESCE(fn.file, f.file_path, f.path) as file,
                       fn.line as line,
                       fn.parent_class as parent_class,
                       in_degree,
                       out_degree
                ORDER BY out_degree DESC, in_degree ASC
                """
                records = session.run(query)

            candidates = []
            for r in records:
                name = r['name']
                file_path = r['file']
                if not name or not file_path:
                    continue

                in_degree = r['in_degree'] or 0
                out_degree = r['out_degree'] or 0
                norm_file = file_path.replace('\\', '/').lower()
                name_lower = name.lower()

                # Categorize function
                category = None
                badge = None
                description = None

                # 1. API Routes / HTTP Endpoints
                if any(k in norm_file for k in ('main.py', 'routes', 'controllers', 'views', 'api/', 'endpoints', 'handlers', 'server.js', 'app.js')):
                    if any(name_lower.startswith(prefix) for prefix in ('get_', 'post_', 'put_', 'delete_', 'patch_', 'handle_', 'serve_', 'route_')) or 'main.py' in norm_file:
                        category = "api_endpoint"
                        badge = "API Route"
                        method_prefix = "HTTP"
                        for m in ('get', 'post', 'put', 'delete', 'patch'):
                            if name_lower.startswith(m + '_'):
                                method_prefix = m.upper()
                                break
                        description = f"Endpoint handler ({method_prefix}) initiating request workflow"

                # 2. Background Tasks / Workers / Jobs
                if not category and (any(k in norm_file for k in ('task', 'worker', 'job', 'queue', 'consumer', 'event', 'sync')) or any(name_lower.startswith(k) for k in ('run_', 'sync_', 'consume_', 'process_', 'worker_', 'handle_event'))):
                    category = "background_job"
                    badge = "Async Job"
                    description = "Asynchronous background task or event pipeline"

                # 3. Domain Orchestrator / High Fan-Out Pipeline
                if not category and out_degree >= 2:
                    category = "domain_service"
                    badge = "Orchestrator"
                    description = f"Coordinates {out_degree} downstream subsystem functions"

                # 4. CLI / Script Entrypoint
                if not category and (name_lower in ('main', 'cli', 'run', 'start', 'bootstrap', 'app') or any(k in norm_file for k in ('cli.py', 'main.py', 'run.py', 'index.js', 'index.ts'))):
                    category = "cli_entrypoint"
                    badge = "CLI / Script"
                    description = "Executable entrypoint or command-line driver"

                # Include if recognized or if it has meaningful out-degree
                if category or (out_degree >= 1 and in_degree <= 2):
                    candidates.append({
                        "id": f"{file_path}::{name}",
                        "name": name,
                        "file": file_path,
                        "relative_file": self._short_path(file_path),
                        "line": r['line'] or 1,
                        "parent_class": r['parent_class'],
                        "in_degree": in_degree,
                        "out_degree": out_degree,
                        "category": category or "general_function",
                        "badge": badge or "Function",
                        "description": description or f"Calls {out_degree} dependencies"
                    })

            # Sort: API routes and jobs first, then by out_degree
            cat_priority = {"api_endpoint": 0, "background_job": 1, "domain_service": 2, "cli_entrypoint": 3, "general_function": 4}
            candidates.sort(key=lambda c: (cat_priority.get(c['category'], 5), -c['out_degree']))
            return candidates

    def trace_workflow(
        self,
        entrypoint_name: str,
        file_path: Optional[str] = None,
        repo_id: Optional[str] = None,
        max_depth: int = 4
    ) -> Dict:
        """
        Traces execution path starting from entrypoint_name, classifying each step,
        identifying touched data sinks, and generating Mermaid diagrams.
        """
        if not self.graph_db or not getattr(self.graph_db, 'driver', None):
            return {"error": "Graph database not available"}

        with self.graph_db.driver.session() as session:
            # 1. Locate entrypoint root node
            fn_info = self.graph_db.get_function_info(entrypoint_name, repo_id=repo_id, file_path=file_path)
            if not fn_info or not fn_info.get('file'):
                # Try finding by name alone
                candidates = self.discover_workflows(repo_id=repo_id)
                match = next((c for c in candidates if c['name'] == entrypoint_name), None)
                if match:
                    fn_info = {"name": match['name'], "file": match['file'], "line": match['line']}
                else:
                    return {"error": f"Entrypoint '{entrypoint_name}' not found"}

            root_file = fn_info['file']
            root_line = fn_info.get('line', 1)
            root_id = f"{root_file}::{entrypoint_name}"

            # 2. Perform Depth-First Traversal along [:CALLS] edges
            visited_nodes: Set[str] = {root_id}
            steps: List[Dict] = []
            call_edges: List[Dict] = []
            queue = [(root_id, entrypoint_name, root_file, root_line, 0, "Client", "Initiates workflow execution")]

            step_counter = 1
            while queue:
                curr_id, curr_name, curr_file, curr_line, curr_depth, caller_name, call_desc = queue.pop(0)

                role = self._classify_role(curr_name, curr_file, is_root=(curr_depth == 0))
                short_file = self._short_path(curr_file)

                # Extract short snippet if repo_path or file exists
                snippet = self._extract_snippet(curr_file, curr_line)

                steps.append({
                    "step_number": step_counter,
                    "depth": curr_depth,
                    "function_name": curr_name,
                    "file": curr_file,
                    "relative_file": short_file,
                    "line": curr_line,
                    "role": role,
                    "role_badge": self._role_badge(role),
                    "role_color": self._role_color(role),
                    "called_by": caller_name,
                    "action_description": call_desc,
                    "code_snippet": snippet
                })
                step_counter += 1

                if curr_depth >= max_depth:
                    continue

                # Query outgoing calls for curr_name in curr_file
                norm_curr_file = curr_file.replace('\\', '/')
                callees_query = """
                MATCH (caller_file:File)-[:CONTAINS]->(caller:Function {name: $name})
                WHERE (caller_file.path = $file 
                   OR caller_file.file_path = $file 
                   OR caller_file.path_normalized = $norm_file
                   OR caller.file = $file)
                MATCH (caller)-[rel:CALLS]->(callee:Function)
                MATCH (callee_file:File)-[:CONTAINS]->(callee)
                RETURN callee.name as callee_name,
                       COALESCE(callee.file, callee_file.file_path, callee_file.path) as callee_file,
                       callee.line as callee_line,
                       COALESCE(rel.line, callee.line, 0) as call_line
                ORDER BY callee.line ASC
                """
                callee_records = session.run(callees_query, name=curr_name, file=curr_file, norm_file=norm_curr_file)

                for cr in callee_records:
                    c_name = cr['callee_name']
                    c_file = cr['callee_file']
                    c_line = cr['callee_line'] or cr['call_line'] or 1
                    c_id = f"{c_file}::{c_name}"

                    # Record call edge for sequence/flowchart
                    call_edges.append({
                        "from_func": curr_name,
                        "from_file": short_file,
                        "to_func": c_name,
                        "to_file": self._short_path(c_file),
                        "line": cr['call_line']
                    })

                    if c_id not in visited_nodes and len(visited_nodes) < 35:
                        visited_nodes.add(c_id)
                        queue.append((
                            c_id, c_name, c_file, c_line, curr_depth + 1,
                            curr_name, f"Calls {c_name} at line {cr['call_line']}"
                        ))

                # Check for asynchronous task dispatch in code snippet: background_tasks.add_task(fn_name, ...)
                if snippet:
                    async_matches = re.findall(r'(?:add_task|create_task)\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)', snippet)
                    for async_fn in async_matches:
                        if async_fn not in ('add_task', 'create_task', 'run', 'execute'):
                            find_q = """
                            MATCH (f:File)-[:CONTAINS]->(fn:Function {name: $fn_name})
                            WHERE (f.path = $file OR f.file_path = $file OR f.path_normalized = $norm_file)
                            RETURN fn.name as name, COALESCE(fn.file, f.file_path, f.path) as file, fn.line as line
                            LIMIT 1
                            """
                            async_rec = session.run(find_q, fn_name=async_fn, file=curr_file, norm_file=norm_curr_file).single()
                            if async_rec:
                                a_id = f"{async_rec['file']}::{async_fn}"
                                if a_id not in visited_nodes and len(visited_nodes) < 35:
                                    visited_nodes.add(a_id)
                                    queue.append((
                                        a_id, async_fn, async_rec['file'], async_rec['line'] or 1,
                                        curr_depth + 1, curr_name, "Dispatched as asynchronous background task"
                                    ))
                                    call_edges.append({
                                        "from_func": curr_name,
                                        "from_file": short_file,
                                        "to_func": async_fn,
                                        "to_file": self._short_path(async_rec['file']),
                                        "line": curr_line
                                    })


            # 3. Generate Mermaid Sequence & Flowchart
            mermaid_seq = self._generate_mermaid_sequence(entrypoint_name, root_file, steps, call_edges)
            mermaid_flow = self._generate_mermaid_flowchart(entrypoint_name, steps, call_edges)

            # 4. Summary metrics & Data Sink Footprint
            unique_files = list(set(s['relative_file'] for s in steps))
            sinks = [s for s in steps if s['role'] == self.ROLE_SINK_DB]
            integrations = [s for s in steps if s['role'] == self.ROLE_INTEGRATION]
            orchestrators = [s for s in steps if s['role'] == self.ROLE_ORCHESTRATOR]

            summary = {
                "entrypoint": entrypoint_name,
                "file": root_file,
                "relative_file": self._short_path(root_file),
                "total_steps": len(steps),
                "unique_files_count": len(unique_files),
                "files_involved": unique_files,
                "max_depth_reached": max(s['depth'] for s in steps) if steps else 0,
                "data_sinks_touched": len(sinks),
                "data_sinks": [f"{s['function_name']} ({s['relative_file']})" for s in sinks],
                "external_integrations_touched": len(integrations),
                "external_integrations": [f"{s['function_name']} ({s['relative_file']})" for s in integrations],
                "orchestrators_count": len(orchestrators),
                "risk_profile": self._assess_workflow_risk(steps)
            }

            return {
                "entrypoint": entrypoint_name,
                "summary": summary,
                "steps": steps,
                "call_edges": call_edges,
                "mermaid_sequence": mermaid_seq,
                "mermaid_flowchart": mermaid_flow
            }

    def _classify_role(self, func_name: str, file_path: str, is_root: bool = False) -> str:
        """Assign an architectural role to the function based on path and nomenclature."""
        if is_root:
            return self.ROLE_ENTRYPOINT

        norm_path = file_path.replace('\\', '/').lower()
        f_lower = func_name.lower()

        # Database / Data Sink
        if any(k in norm_path for k in ('graph_db', 'qdrant', 'sqlite', 'db', 'database', 'dao', 'storage', 'models', 'store')) or \
           any(f_lower.startswith(k) for k in ('save_', 'insert_', 'update_', 'delete_', 'create_', 'fetch_', 'query_', 'bulk_')):
            return self.ROLE_SINK_DB

        # External Integrations (HTTP clients, LLM, Git, Network)
        if any(k in norm_path for k in ('llm', 'reasoner', 'repo_loader', 'git', 'groq', 'client', 'http', 'external', 'fetch')) or \
           any(f_lower.startswith(k) for k in ('call_llm', 'clone_', 'request_', 'send_')):
            return self.ROLE_INTEGRATION

        # Transformation / Parsing
        if any(k in norm_path for k in ('parser', 'ast', 'extract', 'transform', 'tree', 'mapper')) or \
           any(f_lower.startswith(k) for k in ('parse_', 'extract_', 'tokenize_', 'build_')):
            return self.ROLE_TRANSFORM

        # Business Orchestrator / Engines
        if any(k in norm_path for k in ('engine', 'service', 'analyzer', 'manager', 'coordinator')) or \
           any(f_lower.startswith(k) for k in ('analyze_', 'process_', 'run_', 'compare_')):
            return self.ROLE_ORCHESTRATOR

        return self.ROLE_UTIL

    def _role_badge(self, role: str) -> str:
        mapping = {
            self.ROLE_ENTRYPOINT: "Entrypoint",
            self.ROLE_ORCHESTRATOR: "Orchestrator",
            self.ROLE_TRANSFORM: "Transform",
            self.ROLE_SINK_DB: "Data Sink",
            self.ROLE_INTEGRATION: "External API",
            self.ROLE_UTIL: "Utility"
        }
        return mapping.get(role, "Internal")

    def _role_color(self, role: str) -> str:
        mapping = {
            self.ROLE_ENTRYPOINT: "#8A2BE2",       # Violet
            self.ROLE_ORCHESTRATOR: "#38BDF8",     # Cyan
            self.ROLE_TRANSFORM: "#F59E0B",        # Amber
            self.ROLE_SINK_DB: "#10B981",          # Emerald Green
            self.ROLE_INTEGRATION: "#EC4899",      # Rose Pink
            self.ROLE_UTIL: "#64748B"              # Slate Grey
        }
        return mapping.get(role, "#94A3B8")

    def _assess_workflow_risk(self, steps: List[Dict]) -> Dict:
        """Evaluates whether the workflow touches complex or high-risk architectural hubs."""
        high_risk_files = set()
        if self.dependency_mapper and getattr(self.dependency_mapper, 'graph', None):
            g = self.dependency_mapper.graph
            for step in steps:
                fp = step['file']
                if fp in g and (g.in_degree(fp) > 8 or g.out_degree(fp) > 8):
                    high_risk_files.add(self._short_path(fp))

        level = "low"
        if len(steps) > 12 or len(high_risk_files) > 2:
            level = "high"
        elif len(steps) > 6 or len(high_risk_files) > 0:
            level = "medium"

        return {
            "level": level,
            "high_coupling_hubs_touched": list(high_risk_files),
            "step_volume": len(steps)
        }

    def _short_path(self, path_str: str) -> str:
        parts = str(path_str).replace('\\', '/').split('/')
        return '/'.join(parts[-2:]) if len(parts) >= 2 else parts[-1]

    def _extract_snippet(self, file_path: str, line_no: int, max_lines: int = 15) -> str:
        try:
            p = Path(file_path)
            if not p.is_file() and self.repo_path:
                p = Path(self.repo_path) / file_path
            if p.is_file():
                lines = p.read_text(encoding='utf-8', errors='replace').splitlines()
                start = max(0, line_no - 1)
                end = min(len(lines), start + max_lines)
                return '\n'.join(lines[start:end])
        except Exception:
            pass
        return ""

    def _generate_mermaid_sequence(self, entrypoint_name: str, root_file: str, steps: List[Dict], call_edges: List[Dict]) -> str:
        """Compiles clean, deterministic Mermaid Sequence Diagram syntax."""
        short_root = self._short_path(root_file).replace('.', '_').replace('/', '_')
        lines = [
            "sequenceDiagram",
            "    autonumber",
            "    actor User as User / Client",
            f"    participant E as {self._short_path(root_file)}::{entrypoint_name}"
        ]

        # Register distinct participants
        distinct_participants = {}
        for edge in call_edges:
            target_alias = f"P_{len(distinct_participants) + 1}"
            label = f"{edge['to_file']}::{edge['to_func']}"
            if label not in distinct_participants and label != f"{self._short_path(root_file)}::{entrypoint_name}":
                distinct_participants[label] = target_alias
                lines.append(f"    participant {target_alias} as {label}")

        lines.append(f"    User->>E: Trigger {entrypoint_name}()")

        for edge in call_edges[:20]: # Limit for clarity
            source_label = f"{edge['from_file']}::{edge['from_func']}"
            target_label = f"{edge['to_file']}::{edge['to_func']}"
            source_alias = distinct_participants.get(source_label, "E")
            target_alias = distinct_participants.get(target_label, "E")
            if source_alias != target_alias:
                lines.append(f"    {source_alias}->>{target_alias}: {edge['to_func']}()")

        lines.append(f"    E-->>User: Return response")
        return '\n'.join(lines)

    def _generate_mermaid_flowchart(self, entrypoint_name: str, steps: List[Dict], call_edges: List[Dict]) -> str:
        """Compiles clean, deterministic Mermaid Flowchart syntax."""
        lines = [
            "flowchart TD",
            "    classDef entrypoint fill:#8A2BE2,stroke:#fff,stroke-width:2px,color:#fff;",
            "    classDef orchestrator fill:#0284C7,stroke:#fff,stroke-width:1px,color:#fff;",
            "    classDef sink fill:#059669,stroke:#fff,stroke-width:1px,color:#fff;",
            "    classDef transform fill:#D97706,stroke:#fff,stroke-width:1px,color:#fff;",
            "    classDef external fill:#DB2777,stroke:#fff,stroke-width:1px,color:#fff;",
            "    classDef util fill:#475569,stroke:#fff,stroke-width:1px,color:#fff;"
        ]

        node_ids = {}
        for idx, s in enumerate(steps[:25]):
            safe_id = f"node_{idx+1}"
            node_ids[f"{s['relative_file']}::{s['function_name']}"] = safe_id
            label = f"\"{s['function_name']}<br/><small>{s['relative_file']}</small>\""
            lines.append(f"    {safe_id}[{label}]")
            
            # Apply class style
            cls_name = "util"
            if s['role'] == self.ROLE_ENTRYPOINT:
                cls_name = "entrypoint"
            elif s['role'] == self.ROLE_ORCHESTRATOR:
                cls_name = "orchestrator"
            elif s['role'] == self.ROLE_SINK_DB:
                cls_name = "sink"
            elif s['role'] == self.ROLE_TRANSFORM:
                cls_name = "transform"
            elif s['role'] == self.ROLE_INTEGRATION:
                cls_name = "external"
            lines.append(f"    class {safe_id} {cls_name};")

        # Edges
        connected_pairs = set()
        for edge in call_edges[:30]:
            src_key = f"{edge['from_file']}::{edge['from_func']}"
            dst_key = f"{edge['to_file']}::{edge['to_func']}"
            if src_key in node_ids and dst_key in node_ids and src_key != dst_key:
                pair = (node_ids[src_key], node_ids[dst_key])
                if pair not in connected_pairs:
                    lines.append(f"    {pair[0]} --> {pair[1]}")
                    connected_pairs.add(pair)

        return '\n'.join(lines)
