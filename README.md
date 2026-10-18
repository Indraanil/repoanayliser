# ARCHITECH 📐

### *Autonomous Architectural Recovery, Knowledge Graph Synthesis, Blast Radius Simulator & Model Context Protocol (MCP) Server for AI Coding Agents*

<p align="center">
  <a href="https://modelcontextprotocol.io/"><img src="https://img.shields.io/badge/Protocol-Model_Context_Protocol-8A2BE2?style=for-the-badge&logo=anthropic&logoColor=white" alt="MCP"></a>
  <a href="https://neo4j.com/"><img src="https://img.shields.io/badge/Graph_Database-Neo4j_5.x-008CC1?style=for-the-badge&logo=neo4j&logoColor=white" alt="Neo4j"></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/API_Framework-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"></a>
  <a href="https://tree-sitter.github.io/tree-sitter/"><img src="https://img.shields.io/badge/AST_Parsing-Tree--sitter-1e293b?style=for-the-badge" alt="Tree-sitter"></a>
  <a href="https://networkx.org/"><img src="https://img.shields.io/badge/Graph_Algorithms-NetworkX-38bdf8?style=for-the-badge" alt="NetworkX"></a>
  <a href="https://groq.com/"><img src="https://img.shields.io/badge/LLM_Reasoning-Groq_Llama_3.3_70B-f97316?style=for-the-badge" alt="Groq"></a>
  <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/Frontend-React_18_%2B_D3.js-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge" alt="License: MIT"></a>
</p>

<p align="center">
  <a href="#-quickstart--installation"><b>⚡ Quickstart</b></a> •
  <a href="#-model-context-protocol-mcp-server"><b>🤖 MCP Server & AI Agents</b></a> •
  <a href="#-live-inspector-hud"><b>📊 Live Inspector HUD</b></a> •
  <a href="#-core-capabilities--feature-matrix"><b>✨ Feature Matrix</b></a> •
  <a href="#-core-architectural-subsystems"><b>🔬 Core Subsystems</b></a> •
  <a href="#-complete-rest-api-reference"><b>📡 REST API</b></a>
</p>

---

## 📑 Table of Contents

- [📌 Problem Statement & Breakthrough](#-problem-statement--breakthrough)
- [💡 Dual-Track System Architecture](#-dual-track-system-architecture)
- [✨ Core Capabilities & Feature Matrix](#-core-capabilities--feature-matrix)
- [🤖 Model Context Protocol (MCP) Server](#-model-context-protocol-mcp-server)
  - [The AI Context Dilemma & The Graph Advantage](#the-ai-context-dilemma--the-graph-advantage)
  - [MCP Server Architecture](#mcp-server-architecture)
  - [Available MCP Tools Reference](#available-mcp-tools-reference)
  - [Agent Integration Guides (VS Code, Cursor, Claude, Antigravity, Windsurf, Codex)](#agent-integration-guides)
  - [Recommended First-Use Agent Flow](#recommended-first-use-agent-flow)
  - [Real-Time Live Sync & Watchdog Engine](#real-time-live-sync--watchdog-engine)
- [📊 Live Inspector HUD](#-live-inspector-hud)
- [🔬 Core Architectural Subsystems](#-core-architectural-subsystems)
  - [1. Static AST Ingestion & Two-Pass OOP-Aware Parsing](#1-static-ast-ingestion--two-pass-oop-aware-parsing)
  - [2. Dual-Layer Graph Architecture (Neo4j + NetworkX)](#2-dual-layer-graph-architecture-neo4j--networkx)
  - [3. Multi-Signal Pattern Detection (8 Patterns)](#3-multi-signal-pattern-detection-8-patterns)
  - [4. Coupling Metrics & Structural Risk Scoring](#4-coupling-metrics--structural-risk-scoring)
  - [5. Change Impact & Blast Radius Simulation](#5-change-impact--blast-radius-simulation)
  - [6. Cryptographic Snapshot Lineage & Cross-Commit Auditing](#6-cryptographic-snapshot-lineage--cross-commit-auditing)
  - [7. Hybrid Semantic Synthesis (LLM Reasoning + Graphify)](#7-hybrid-semantic-synthesis-llm-reasoning--graphify)
- [⚡ Quickstart & Installation](#-quickstart--installation)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Start Neo4j Database](#3-start-neo4j-database)
  - [4. Backend Setup & Startup](#4-backend-setup--startup)
  - [5. Frontend Setup & Startup](#5-frontend-setup--startup)
  - [6. MCP Server Setup](#6-mcp-server-setup)
  - [Active Ports & URL Matrix](#active-ports--url-matrix)
- [📡 Complete REST API Reference](#-complete-rest-api-reference)
- [🗂️ Repository Matrix & Architecture](#️-repository-matrix--architecture)
- [🧪 Testing & Verification](#-testing--verification)
- [🛡️ Security, Privacy & Performance](#️-security-privacy--performance)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 📌 Problem Statement & Breakthrough

Modern software systems accumulate thousands of evolving source files, causing architectural intent to drift, module boundaries to blur, and circular coupling to quietly proliferate.

```
       WITHOUT ARCHITECH                                   WITH ARCHITECH
 ┌───────────────────────────┐               ┌─────────────────────────────────────────┐
 │ • 50,000+ Raw Code Tokens │               │ • Precise 1,500-Token Graph Subgraph    │
 │ • LLM Context Exhaustion  │   ────────►   │ • Sub-20ms Deterministic Cypher Queries │
 │ • Hallucinated Call Paths │               │ • Zero Hallucinations, Exact Callers    │
 │ • Blind, Risky Refactors  │               │ • Pre-Commit Blast Radius Simulation    │
 └───────────────────────────┘               └─────────────────────────────────────────┘
```

### The Human Challenge
Engineering teams suffer from slow developer onboarding, undocumented legacy architecture, unintended circular dependency chains, and risky refactoring where touching one file silently breaks distant modules.

### The AI Coding Agent Challenge
AI coding assistants (Claude Code, Cursor, GitHub Copilot, Antigravity) are forced to read raw files blindly or ingest thousands of lines of context. This leads to **context window bloat**, **prohibitive token costs**, and **hallucinations** regarding class hierarchies, imported utilities, and method caller relationships.

### The ARCHITECH Breakthrough
**ARCHITECH** transforms flat source code into a queryable, multi-dimensional **Knowledge Graph** served through two synchronized tracks:
1. **Interactive Visual Dashboard (React 18 + D3.js):** For human architects to inspect dependency graphs, explore circular cycles, evaluate pattern alignment, simulate blast radius, and compare historical snapshot diffs.
2. **Model Context Protocol (MCP) Server (FastMCP stdio):** For AI coding agents to dynamically query architecture, inspect caller chains, simulate change impact, and receive incremental AST updates as files change in real time.

---

## 💡 Dual-Track System Architecture

ARCHITECH executes across two parallel tracks converging on a unified, high-speed **Shared Knowledge Nexus** (Neo4j Graph Database + SQLite State Engine):

```
                                  ┌─────────────────────────────────────────┐
                                  │   Source Repository (GitHub / Local)    │
                                  └────────────────────┬────────────────────┘
                                                       │
                                                       ▼
                                  ┌─────────────────────────────────────────┐
                                  │ Polyglot AST Ingestion (Tree-sitter)    │
                                  │ Python, JS, TS, Java • OOP Method Calls │
                                  └────────────────────┬────────────────────┘
                                                       │
                         ┌─────────────────────────────┴─────────────────────────────┐
                         ▼                                                           ▼
        ┌─────────────────────────────────┐                         ┌─────────────────────────────────┐
        │ In-Memory DiGraph (NetworkX)    │                         │ Graph Database (Neo4j 5.x)      │
        │ • Johnson's Circuit Enumeration │                         │ • Persistent Node/Edge Topology │
        │ • Multi-Signal Pattern Analysis │                         │ • Transitive Call Chains        │
        │ • Fan-In / Fan-Out Metrics      │                         │ • Cryptographic Snapshot Lineage│
        └────────────────┬────────────────┘                         └────────────────┬────────────────┘
                         │                                                           │
                         └─────────────────────────────┬─────────────────────────────┘
                                                       │
                                                       ▼
                                  ┌─────────────────────────────────────────┐
                                  │ Semantic LLM Synthesis (Groq Llama 3.3) │
                                  │ Macro, Meso & Micro Architecture Review │
                                  └────────────────────┬────────────────────┘
                                                       │
                         ┌─────────────────────────────┴─────────────────────────────┐
                         ▼                                                           ▼
       [ TRACK 1: HUMAN DEVELOPER ]                                 [ TRACK 2: AI CODING AGENT ]
┌───────────────────────────────────────────┐               ┌───────────────────────────────────────────┐
│ Interactive Web Dashboard (React + D3.js) │               │ Model Context Protocol (MCP) Server       │
│ • Force-Directed Dependency & Call Graphs │               │ • Stdio JSON-RPC FastMCP Engine           │
│ • 8 Design Pattern Confidence Gauges      │               │ • 11 Precision Graph Tools (<2k tokens)   │
│ • Interactive Blast Radius Simulator      │               │ • Real-Time Watchfiles Live Sync (<100ms) │
│ • Cross-Commit Architectural Diffs        │               │ • Claude, Cursor, Copilot, Antigravity    │
└───────────────────────────────────────────┘               └───────────────────────────────────────────┘
                         │                                                           │
                         └─────────────────────────────┬─────────────────────────────┘
                                                       │
                                                       ▼
                                  ┌─────────────────────────────────────────┐
                                  │ Live Telemetry HUD (:8000/inspector)    │
                                  │ Real-Time Tool Activity & Token Ticker  │
                                  └─────────────────────────────────────────┘
```

---

## ✨ Core Capabilities & Feature Matrix

ARCHITECH provides 9 core architectural recovery modules designed for dual-mode human and AI-assisted workflows:

| Module / Capability | Primary Responsibility | Technical Subsystem & Output |
| :--- | :--- | :--- |
| **🚀 Ingestion & Parsing** | Non-executing AST extraction across Python, JS, TS, and Java; SHA-256 fingerprinting. | Polyglot Tree-sitter CST parsers with OOP method resolution. |
| **🗂️ Workspace & Snapshots** | Multi-repository workspace management, commit lineage backfilling, and integrity verification. | Neo4j `(:Repository)`, `(:Snapshot)`, `(:Commit)` lineage graph. |
| **📊 Architectural Report** | Synthesizes Macro, Meso, and Micro architecture review grounded in real code evidence. | Groq Llama-3.3-70B synthesis + Graphify structural AST index. |
| **🕸️ File Dependency Graph** | Zoomable, force-directed topological visualization of inter-file imports and module dependencies. | Force-directed D3.js canvas powered by Neo4j `[:DEPENDS_ON]`. |
| **🔗 Function Call Graph** | Interactive inspection of cross-file function invocations, caller-callee bindings, and deep call paths. | Tree-sitter receiver dispatch + Neo4j `[:CALLS_TRANSITIVE]`. |
| **🧩 Pattern Detection** | Heuristic classification across 8 patterns (Layered, MVC, Hexagonal, Event-Driven, etc.). | Multi-signal heuristics (directory stems, AST signatures, imports). |
| **📈 Coupling & Cycles** | Computes Fan-In ($C_a$), Fan-Out ($C_e$), Instability ($I$), and enumerates circular dependency cycles. | NetworkX Johnson's circuit algorithm (`nx.simple_cycles`). |
| **💥 Blast Radius Simulator** | Interactive change impact preview: 1-hop direct, 2–3 hop cascading, and function breaking surface. | Neo4j path traversal + weighted risk severity algorithm (0–100). |
| **🕒 Cross-Commit Diffing** | Compares any two historical commit snapshots to surface architectural drift and regression deltas. | Delta engine computing $\Delta \text{avg\_coupling}$, $\Delta \text{cycles}$, and pattern shifts. |

---

## 🤖 Model Context Protocol (MCP) Server

ARCHITECH includes a production-grade, local **Model Context Protocol (MCP)** stdio server located in `mcp-server/`. It connects your favorite AI coding assistant directly to the ARCHITECH repository knowledge graph.

### The AI Context Dilemma & The Graph Advantage

When an AI coding assistant attempts to understand or refactor code in large projects:
* **The Raw File Approach:** Reading files into LLM context costs **30,000 to 80,000+ tokens**, hits rate limits, and frequently misses indirect method dispatches.
* **The ARCHITECH MCP Advantage:** The assistant invokes bounded graph queries (`get_file_context`, `get_function_context`, `get_change_impact`), receiving an exact, structured slice in **<20ms** consuming **under 1,500 tokens**.

```
┌────────────────────────┐                   ┌────────────────────────┐
│  AI Coding Assistant   │   MCP JSON-RPC    │  ARCHITECH MCP Server  │
│  (Claude, Cursor, IDE) │ ◄───────────────► │  (architech_mcp)       │
└────────────────────────┘     (stdio)       └───────────┬────────────┘
                                                         │
                                        ┌────────────────┴────────────────┐
                                        ▼                                 ▼
                             ┌─────────────────────┐           ┌─────────────────────┐
                             │ Neo4j Knowledge DB  │           │ FastAPI Live Relay  │
                             │ Graph Queries & AST │           │ Real-time Telemetry │
                             └─────────────────────┘           └─────────────────────┘
```

### Available MCP Tools Reference

ARCHITECH provides **11 specialized tools** exposed via the Model Context Protocol:

| Tool Name | Type | Key Arguments | Est. Tokens Saved | Description |
| :--- | :---: | :--- | :---: | :--- |
| `list_repositories` | `Read-Only` | `query`, `cursor`, `limit` | ~1,200 | Lists indexed repositories, snapshot IDs, commit hashes, and file counts. |
| `analyze_repository`| `Analyze` | `source`, `source_kind` (`"local"` \| `"git"`) | Full Run | Initiates full AST extraction, graph indexing, and pattern analysis. |
| `search_symbols` | `Read-Only` | `repo_id`, `query`, `kinds`, `cursor`, `limit` | **~2,800** | Searches indexed classes, functions, and file paths with sub-20ms latency. |
| `get_file_context` | `Read-Only` | `repo_id`, `file_path`, `include_source`, `max_source_lines` | **~4,200** | Retrieves direct file dependencies, dependents, defined symbols, and code excerpts. |
| `get_function_context` | `Read-Only` | `repo_id`, `file_path`, `function_name`, `include_source` | **~3,100** | Retrieves exact function body, callers across the codebase, and call chains. |
| `get_architecture` | `Read-Only` | `repo_id`, `include_components`, `generate_if_missing` | **~16,000** | Returns macro/meso/micro architectural report, detected patterns, and metrics. |
| `get_change_impact` | `Read-Only` | `repo_id`, `file_path`, `change_type` (`"modify"`, `"move"`, `"delete"`), `depth` | **~11,000** | Simulates reverse-dependency blast radius, broken callers, and 0–100 risk score. |
| `get_code_health` | `Read-Only` | `repo_id`, `category` (`"files"`, `"functions"`, `"duplicate_files"`), `limit` | ~2,500 | Returns unused files, uncalled functions, duplicate files, and structural risks. |
| `get_snapshots` | `Read-Only` | `repo_id`, `compare_from`, `compare_to`, `limit` | ~2,000 | Lists cryptographic snapshots or computes structural diffs between two commits. |
| `sync_repository_changes` | `Local-Write` | `repo_id`, `create_checkpoint` | Incremental | Incrementally parses changed files and updates graph edges in real time. |
| `manage_live_sync` | `Local-Write` | `action` (`"start"`, `"stop"`, `"status"`), `repo_id`, `debounce_ms` | Real-time | Starts or stops a file system watcher (`watchfiles.awatch`) that automatically updates Neo4j on file save. |

---

### Agent Integration Guides

To integrate ARCHITECH with your preferred coding assistant, configure the stdio server command.

> [!TIP]
> Ensure you run `pip install -r requirements.txt` inside `mcp-server/` with Python 3.11+ before connecting your agent. Replace `<PATH_TO_REPO>` with the absolute path to your cloned repository.

#### 1. VS Code / GitHub Copilot

Create or edit `.vscode/mcp.json` in your workspace (or `.mcp.json` in root):

```json
{
  "servers": {
    "architech": {
      "type": "stdio",
      "command": "${workspaceFolder}/mcp-server/.venv/Scripts/python.exe",
      "args": [
        "${workspaceFolder}/mcp-server/server.py"
      ]
    }
  }
}
```
*(On macOS/Linux, replace `.venv/Scripts/python.exe` with `.venv/bin/python`)*

In GitHub Copilot Chat, ARCHITECH tools will automatically appear in the tool picker.

#### 2. Cursor IDE

In Cursor:
1. Open **Settings** $\rightarrow$ **Features** $\rightarrow$ **MCP**.
2. Click **+ Add New MCP Server**.
3. Configure:
   * **Name:** `architech`
   * **Type:** `stdio`
   * **Command:** `<PATH_TO_REPO>/mcp-server/.venv/Scripts/python.exe` *(or `.venv/bin/python`)*
   * **Args:** `<PATH_TO_REPO>/mcp-server/server.py`

Alternatively, add to your Cursor `mcp.json`:
```json
{
  "mcpServers": {
    "architech": {
      "command": "<PATH_TO_REPO>/mcp-server/.venv/Scripts/python.exe",
      "args": ["<PATH_TO_REPO>/mcp-server/server.py"]
    }
  }
}
```

#### 3. Claude Code CLI & Claude Desktop

**Claude Code CLI:**
```bash
claude mcp add --transport stdio architech -- <PATH_TO_REPO>/mcp-server/.venv/Scripts/python.exe <PATH_TO_REPO>/mcp-server/server.py
```
Verify with `claude mcp list`.

**Claude Desktop:**
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "architech": {
      "command": "<PATH_TO_REPO>/mcp-server/.venv/Scripts/python.exe",
      "args": ["<PATH_TO_REPO>/mcp-server/server.py"]
    }
  }
}
```

#### 4. Antigravity IDE & Gemini Agent

In Antigravity IDE:
1. Open the agent panel's **MCP Servers** menu $\rightarrow$ **Manage MCP Servers** $\rightarrow$ **View raw config**.
2. Add to `.agents/mcp_config.json` (workspace) or `~/.gemini/config/mcp_config.json` (global):
```json
{
  "mcpServers": {
    "architech": {
      "command": "<PATH_TO_REPO>\\mcp-server\\.venv\\Scripts\\python.exe",
      "args": ["<PATH_TO_REPO>\\mcp-server\\server.py"]
    }
  }
}
```
3. Type `/mcp` in the Antigravity chat panel to verify connection status.

#### 5. Windsurf IDE (Cascade)

Add to `~/.codeium/windsurf/mcp_config.json`:
```json
{
  "mcpServers": {
    "architech": {
      "command": "<PATH_TO_REPO>/mcp-server/.venv/Scripts/python.exe",
      "args": ["<PATH_TO_REPO>/mcp-server/server.py"]
    }
  }
}
```

#### 6. OpenAI Codex CLI

```bash
codex mcp add architech -- <PATH_TO_REPO>/mcp-server/.venv/Scripts/python.exe <PATH_TO_REPO>/mcp-server/server.py
```
Or add to `~/.codex/config.toml`:
```toml
[mcp_servers.architech]
command = "<PATH_TO_REPO>/mcp-server/.venv/Scripts/python.exe"
args = ["<PATH_TO_REPO>/mcp-server/server.py"]
```

---

### Recommended First-Use Agent Flow

When paired with an AI coding assistant, ARCHITECH enables an evidence-grounded investigation workflow:

```
Step 1: DISCOVER
Agent calls list_repositories() ──► Selects target repo_id

Step 2: LOCATE SYMBOLS
Agent calls search_symbols(query="PaymentGateway") ──► Finds file & line locations

Step 3: STRUCTURAL CONTEXT
Agent calls get_file_context(file_path="src/gateway.py") ──► Receives caller/callee sub-graph

Step 4: BLAST RADIUS SIMULATION
Agent calls get_change_impact(file_path="src/gateway.py", change_type="modify")
└── Inspects 1-hop & 2-hop broken surfaces and risk score (e.g. 74/100) BEFORE proposing edits

Step 5: LIVE SYNCHRONIZATION
Agent calls sync_repository_changes() OR activates manage_live_sync(action="start")
└── Graph updates automatically in <100ms on file save!
```

---

### Real-Time Live Sync & Watchdog Engine

ARCHITECH's Track 2 features an asynchronous file system watcher (`IncrementalAnalyzer` & `LiveSyncManager`):
1. **IDE Save Event Intercept:** Monitors local source directories via `watchfiles.awatch` with a configurable debounce (default: 750ms).
2. **Deterministic Dirty Check:** Queries SQLite (`.data/state.sqlite3`) to compare SHA-256 hashes, ensuring only genuinely modified files are processed.
3. **AST Delta Parse:** Selectively parses modified files via Tree-sitter without re-indexing untouched codebase trees.
4. **Atomic Cypher Patch:** Issues targeted Cypher `MERGE` and `DELETE` queries to patch Neo4j nodes and relationships in **<100ms**.
5. **Live Telemetry Dispatch:** Relays save events to `POST /api/live-events`, triggering real-time UI updates on the Live Inspector HUD.

---

## 📊 Live Inspector HUD

ARCHITECH includes a dedicated **Real-Time MCP Inspector & Telemetry HUD** hosted directly on the FastAPI server:

🌐 **Endpoint:** `http://localhost:8000/inspector`

```
┌────────────────────────────────────────────────────────────────────────┐
│ ARCHITECH LIVE MCP TELEMETRY HUD                          ● SYSTEM LIVE│
├─────────────────┬─────────────────┬──────────────────┬─────────────────┤
│ ACTIVE TOOLS    │ TOKENS SAVED    │ AVERAGE LATENCY  │ GRAPH SYNC      │
│ 11 Ready        │ 142,800 Tokens  │ 14.2 ms          │ Real-Time       │
├─────────────────┴─────────────────┴──────────────────┴─────────────────┤
│ LIVE ACTIVITY AUDIT STREAM                                             │
│ 14:02:11 | get_change_impact   | target: src/engine.py   | -11,000 tk │
│ 14:01:45 | get_file_context    | target: src/models.py   | -4,200 tk  │
│ 14:00:12 | search_symbols      | query: "Parser"         | -2,800 tk  │
│ 13:58:30 | LiveSync: SaveEvent | patched 2 nodes in 68ms | + Neo4j OK │
└────────────────────────────────────────────────────────────────────────┘
```

* **Live AI Activity Feed:** Real-time stream of tool calls executed by connected agents.
* **Token Savings Ticker:** Tracks cumulative context tokens conserved by serving graph slices over raw source dumps.
* **Latency Gauges:** Sub-millisecond performance monitoring across graph traversals and Cypher queries.
* **Direct File & AST Drilldown:** Instant preview of affected code bodies, callers, and class definitions.

---

## 🔬 Core Architectural Subsystems

### 1. Static AST Ingestion & Two-Pass OOP-Aware Parsing
* **Polyglot Grammar Parsers:** High-performance Tree-sitter parsers (`tree-sitter-python`, `tree-sitter-javascript`, `tree-sitter-typescript`, `tree-sitter-java`) convert source files into Concrete Syntax Trees without code execution.
* **Two-Pass Ingestion Protocol:**
  * **Pass 1 (Entity Extraction & Structural Typing):** Extracts `class_definition`, `function_definition`, `import_statement`, decorator bindings, and inspects `__init__` constructor assignments (`self.service = PaymentService()`) to infer object-oriented dependency injection. Files receive SHA-256 content hashes.
  * **Pass 2 (Cross-File Call Graph & OOP Resolution):** Recursively traverses method invocations to extract caller-callee bindings. Resolves indirect method dispatch (`self.target_service.execute()`) by matching receiver types against registered class methods across the entire repository.

---

### 2. Dual-Layer Graph Architecture (Neo4j + NetworkX)
ARCHITECH leverages a hybrid graph topology combining disk-backed persistence with high-speed in-memory graph algorithms:

| Graph Subsystem | Engine | Primary Responsibilities |
| :--- | :--- | :--- |
| **Persistent Knowledge Graph** | **Neo4j 5.x** (Cypher) | Entities (`Repository`, `Snapshot`, `Commit`, `User`, `File`, `Class`, `Function`, `Module`), multi-hop path traversals (`[:DEPENDS_ON*2..3]`), transitive call chain generation (`[:CALLS_TRANSITIVE]`), and cross-commit snapshot querying. |
| **Algorithmic Graph Engine** | **NetworkX** (`DiGraph`) | In-memory structural algorithms: Johnson's cycle detection (`nx.simple_cycles`), strongly connected components (`nx.strongly_connected_components`), instant in/out-degree calculations, and pattern classification heuristics. |

#### Neo4j Graph Taxonomy
```
(:Repository)-[:CONTAINS]->(:File)
(:Repository)-[:HAS_SNAPSHOT]->(:Snapshot)
(:Repository)-[:HAS_COMMIT]->(:Commit)-[:AUTHORED_BY]->(:User)
(:File)-[:CONTAINS]->(:Class | :Function)
(:File)-[:IMPORTS]->(:Module)
(:File)-[:DEPENDS_ON]->(:File)
(:File | :Function)-[:CALLS]->(:Function)
(:Function)-[:CALLS_TRANSITIVE]->(:Function)
(:File)-[:HAS_VERSION]->(:Version)-[:VERSION_AT]->(:Commit)
(:Version)-[:PREVIOUS_VERSION]->(:Version)
```

---

### 3. Multi-Signal Pattern Detection (8 Patterns)
Evaluates 8 architectural design patterns via multi-signal heuristic rules across 4 orthogonal dimensions:
1. **Filename Stems** (`*controller*`, `*service*`, `*repository*`, `*route*`)
2. **Directory Conventions** (`api/`, `domain/`, `infra/`, `components/`)
3. **AST Class & Function Signatures** (`class UserView`, `def handle_event`)
4. **Framework Import Signatures** (`fastapi`, `celery`, `kafka`, `pika`, `express`, `django`)

#### Supported Patterns
* **Layered (N-tier):** Validates physical separation of Presentation $\rightarrow$ Business $\rightarrow$ Data layers.
* **Model-View-Controller (MVC):** Detects controller routing, model entities, view components, and controller-to-model coupling.
* **Hexagonal (Ports & Adapters):** Identifies boundary interfaces, infrastructure adapters, and domain core isolation ($<30\%$ external coupling).
* **Event-Driven:** Detects event publishers, subscribers, event queues, and message brokers (`celery`, `kafka`, `rabbitmq`).
* **Pipe & Filter:** Detects data processing stages, transformation filters, and sequential pipeline flows.
* **Client-Server:** Identifies HTTP API producers versus frontend consumers.
* **Microkernel (Plugin):** Detects core orchestrator registry and dynamic plugin extensions.
* **Microservices:** Identifies autonomous service directories, API gateways, and RPC/gRPC communication channels.

---

### 4. Coupling Metrics & Structural Risk Scoring
For every file $f$, ARCHITECH computes object-oriented metrics:
* **Afferent Coupling / Fan-In ($C_a$):** Number of incoming dependencies pointing to $f$ (indicates responsibility).
* **Efferent Coupling / Fan-Out ($C_e$):** Number of external files $f$ depends upon (indicates instability).
* **Instability Index ($I$):**
  $$I = \frac{C_e}{C_a + C_e}$$
  * $I = 0$: Maximum architectural stability (e.g. core domain models).
  * $I = 1$: Maximum architectural fragility (e.g. peripheral orchestrators).
* **Circular Coupling Cycles:** Depth-first circuit enumeration identifies exact circular dependency paths.
* **Objective Structural Risk Score $R \in [0, 100]$:**
  $$R = \min\left(100, (C_a \times 8) + (C_e \times 5) + \text{CycleBonus} + \text{HighFanBonus}\right)$$
  * $\text{CycleBonus} = 30$ if $f$ participates in any circular dependency.
  * $\text{HighFanBonus} = 10 \text{ if } C_a > 5 \;+\; 10 \text{ if } C_e > 5$.
  * Severity Tiers: **Critical** ($R \ge 80$), **High** ($R \ge 60$), **Medium** ($R \ge 30$), **Low** ($R < 30$).

---

### 5. Change Impact & Blast Radius Simulation
Simulates cascading blast radius before code modifications are committed:
* **Direct Blast Radius (1-Hop):** Exact files with direct `[:DEPENDS_ON]` edges to the target file.
* **Indirect Blast Radius (2–3 Hops):** Cascading files affected through transitive dependency propagation.
* **Function Breaking Surface:** Functions defined in the target file and their external callers.
* **Change Modes:**
  * `DELETE`: Evaluates catastrophic breakages (30 pts per dependent + 20 pts per function caller).
  * `MOVE`: Evaluates import reference breaks across existing callers (8 pts per dependent).
  * `MODIFY`: Evaluates logic regression and testing surface (5 pts per affected dependent).

---

### 6. Cryptographic Snapshot Lineage & Cross-Commit Auditing
* **SHA-256 Content Fingerprinting:** Cryptographically hashes source files to detect modifications and prevent redundant AST parsing.
* **Git Lineage Backfilling:** Ingests repository commit histories into Neo4j graph nodes.
* **Architectural Delta Engine (`compare_snapshots`):** Computes architectural diffs between any two historical commits:
  * File diffs (added, removed, modified)
  * Net coupling metric changes ($\Delta \text{avg\_coupling}$)
  * Net circular dependency changes ($\Delta \text{cycles}$)
  * Architectural pattern shifts (e.g., emerging MVC or degraded Hexagonal isolation)

---

### 7. Hybrid Semantic Synthesis (LLM Reasoning + Graphify)
To generate actionable, grounded architectural insights rather than superficial summaries, ARCHITECH compiles graph topology into an enriched structural context prompt for **Groq Llama-3.3-70B**:
1. **Macro Level (System Overview):** High-level architectural style, domain boundaries, and subsystem responsibilities.
2. **Meso Level (Module Relationships):** Inter-module data flow, boundary violations, and separation of concerns.
3. **Micro Level (Critical Files & Hubs):** God objects, single points of failure, bottleneck classes, and refactoring action items.

---

## ⚡ Quickstart & Installation

### Prerequisites
* **Python 3.11+**
* **Node.js 18+** & **npm 9+**
* **Neo4j 5.x** (Desktop or Docker)
* **Groq Cloud API Key** (for Llama-3.3-70B synthesis)

---

### 1. Clone Repository
```bash
git clone https://github.com/NHR-09/repoanayliser.git
cd repoanayliser
```

---

### 2. Environment Configuration
Create or configure `backend/.env`:
```dotenv
NEO4J_URI=neo4j://127.0.0.1:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_secure_password

GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
```

---

### 3. Start Neo4j Database
1. Launch **Neo4j Desktop** (or run `docker run -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/your_secure_password neo4j:5`).
2. Verify that Bolt is active on port `7687`.

---

### 4. Backend Setup & Startup
```powershell
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\activate   # On Linux/macOS: source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run the FastAPI server
python main.py
```
> The backend server starts at `http://localhost:8000`.

---

### 5. Frontend Setup & Startup
In a separate terminal:
```powershell
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start React development server
npm start
```
> The React dashboard opens automatically at `http://localhost:3000`.

---

### 6. MCP Server Setup
The MCP server maintains an isolated virtual environment to avoid dependency conflicts:
```powershell
cd mcp-server
python -m venv .venv
.\.venv\Scripts\activate   # On Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
```
Test the MCP server directly:
```powershell
python server.py
```
*(The server communicates via stdio JSON-RPC; diagnostic messages output to stderr).*

---

### Active Ports & URL Matrix

| Service | Address | Description |
| :--- | :--- | :--- |
| **Frontend Web Dashboard** | [http://localhost:3000](http://localhost:3000) | Interactive React + D3.js dashboard |
| **FastAPI REST API** | [http://localhost:8000](http://localhost:8000) | Core analysis engine & background jobs |
| **Live MCP Inspector HUD** | [http://localhost:8000/inspector](http://localhost:8000/inspector) | Real-time tool stream and telemetry |
| **FastAPI Swagger Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive OpenAPI explorer |
| **Neo4j Graph Bolt** | `neo4j://127.0.0.1:7687` | Knowledge graph persistence |

---

## 📡 Complete REST API Reference

| HTTP Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/analyze` | Clones and analyzes a remote GitHub repository in the background. |
| `POST` | `/analyze/local` | Ingests and analyzes a local directory from the host machine. |
| `GET` | `/status/{job_id}` | Polls status (`processing`, `completed`, `failed`) of background jobs. |
| `GET` | `/browse-folder` | Opens native OS folder picker dialog to select local projects. |
| `GET` | `/architecture` | Returns the synthesized 3-tier architectural report and stats. |
| `GET` | `/patterns` | Returns detected patterns, layer breakdowns, and confidence scores. |
| `GET` | `/coupling` | Returns high-coupling files, Fan-In/Fan-Out metrics, and cycles. |
| `GET` | `/confidence-report` | Returns confidence scores and validation evidence for claims. |
| `GET` | `/blast-radius/{file_path}` | Simulates change impact (Modify, Move, Delete) and risk score. |
| `POST` | `/impact` | Returns AI semantic impact analysis for a specific file change. |
| `GET` | `/graph/data` | Returns node and edge collections for file dependency graph. |
| `GET` | `/graph/functions` | Returns node and edge collections for function call graph. |
| `GET` | `/graph/function/{name}`| Returns the multi-hop call chain for a specific function. |
| `GET` | `/functions` | Lists all indexed functions with their source files and line spans. |
| `GET` | `/function/{name}` | Returns callers, implementation code, and LLM explanation. |
| `GET` | `/repositories` | Lists all analyzed repositories with snapshot and file counts. |
| `POST` | `/repository/{id}/load` | Loads a repository's cached analysis state into memory. |
| `DELETE`| `/repository/{id}` | Deletes a repository and all associated graph nodes and snapshots. |
| `GET` | `/repository/{id}/snapshots` | Lists historical snapshots with commit hashes and timestamps. |
| `GET` | `/repository/{id}/compare-snapshots/{s1}/{s2}` | Performs architectural diff between two commits. |
| `GET` | `/repository/{id}/commits` | Returns commit lineage for a repository. |
| `GET` | `/repository/{id}/file-history` | Returns cryptographic SHA-256 version lineage for a file. |
| `POST` | `/repository/{id}/check-integrity` | Verifies current file content against stored hash to detect tampering. |
| `GET` | `/inspector` | Serves the interactive MCP Live Inspector and Telemetry HUD. |
| `GET` | `/api/mcp/activity` | Returns recent AI MCP tool activity and token savings telemetry. |
| `POST` | `/api/live-events` | Ingests real-time file-save events from MCP watchdog into HUD. |

---

## 🗂️ Repository Matrix & Architecture

```
repoanayliser/
├── backend/
│   ├── main.py                     # FastAPI REST API controller, background tasks & routes
│   ├── requirements.txt            # Python dependencies (fastapi, neo4j, networkx, tree-sitter)
│   ├── setup.bat                   # Windows one-click environment setup script
│   └── src/
│       ├── analysis_engine.py      # Core orchestrator: coordinates parsing, graph, & caching
│       ├── config.py               # Pydantic settings loading from backend/.env
│       ├── mcp_inspector.py        # Live Inspector HUD HTML/JS renderer & SQLite telemetry
│       ├── analysis/
│       │   ├── architecture_grounding.py # Grounds claims against extracted evidence
│       │   └── confidence_analyzer.py    # Failure mode and confidence scoring
│       ├── graph/
│       │   ├── analyzers.py        # PatternDetector (8 patterns) & CouplingAnalyzer (metrics & risk)
│       │   ├── blast_radius.py     # Systemic change simulator (Delete, Move, Modify)
│       │   ├── dependency_mapper.py# In-memory NetworkX DiGraph builder & cycle detector
│       │   ├── function_graph.py   # Function-level call chain builder
│       │   ├── graph_db.py         # Neo4j Cypher DAL for nodes, relationships & bulk writes
│       │   ├── live_events.py      # Event bus relaying live sync to Inspector HUD
│       │   └── version_tracker.py  # SHA-256 versioning, Git lineage & tamper detection
│       ├── parser/
│       │   ├── repo_loader.py      # Git cloning & local folder loader
│       │   ├── repository_filter.py# Language & file exclusion heuristics
│       │   └── static_parser.py    # Polyglot Tree-sitter AST parser with OOP resolution
│       ├── reasoning/
│       │   └── llm_reasoner.py     # Groq API integration for architectural synthesis
│       └── retrieval/
│           ├── graphify_retriever.py# Graphify AST indexing interface
│           └── retrieval_engine.py # Hybrid Graphify + Neo4j evidence retrieval
├── frontend/
│   ├── package.json                # React 18, D3.js, Axios, Three.js dependencies
│   ├── public/                     # Static HTML template & icons
│   └── src/
│       ├── App.js                  # Master application layout, navigation & state controller
│       ├── components/
│       │   ├── AnalyzeRepo.js       # Repository input form (GitHub / Local Folder)
│       │   ├── ArchitectureView.js  # Macro/Meso/Micro architecture report viewer
│       │   ├── BlastRadius.js       # Interactive blast radius simulator with D3 graph
│       │   ├── CouplingAnalysis.js  # Coupling metrics, KPIs & circular dependency list
│       │   ├── DependencyGraph.js   # Force-directed D3.js file-to-file dependency graph
│       │   ├── FunctionAnalysis.js  # Function caller inspection & AI explanation
│       │   ├── FunctionGraph.js     # Force-directed D3.js function call chain visualization
│       │   ├── ImpactAnalysis.js    # AI-assisted change impact report
│       │   ├── PatternDetection.js  # Detected pattern cards, gauges & layer breakdowns
│       │   ├── RepositoryManager.js # Workspace catalog, snapshots & integrity controls
│       │   └── SnapshotComparison.js# Cross-commit architectural diffing comparison
│       └── services/
│           └── api.js              # Centralized Axios REST client
└── mcp-server/
    ├── requirements.txt            # MCP server dependencies (mcp, watchfiles, neo4j)
    ├── server.py                   # MCP entrypoint
    └── architech_mcp/
        ├── config.py               # MCP environment configuration
        ├── incremental.py          # Real-time file system watcher & incremental parser
        ├── server.py               # Stdio MCP protocol implementation & 11 tool handlers
        ├── service.py              # High-level architecture query service
        ├── storage.py              # SQLite incremental state storage (.data/state.sqlite3)
        └── utils.py                # Text bounding, token bounding, and compact formatting
```

---

## 🧪 Testing & Verification

Run the backend automated test suite:
```bash
cd backend
.\venv\Scripts\activate
pytest tests/
```

Run MCP server tests:
```bash
cd mcp-server
.\.venv\Scripts\activate
python -m unittest discover -s tests
```

---

## 🛡️ Security, Privacy & Performance

* **Zero Source Code Exfiltration:** Analysis executes completely on the local machine. Only aggregated structural metadata, class signatures, and topological metrics are sent to the LLM reasoning engine.
* **Deterministic Caching:** SHA-256 commit hashing prevents redundant AST parsing and minimizes LLM API invocations.
* **Thread-Safe Memory LRU Cache:** Python `threading.Lock` and `collections.OrderedDict` guard the in-memory cache against multi-threaded request races.
* **Process Isolation:** Local folder dialog launchers run via isolated subprocesses to avoid blocking the asynchronous FastAPI event loop.
* **Sub-20ms Graph Retrieval:** Bounded Cypher queries ensure AI coding agents receive immediate answers without lag.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. **Fork** the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes: `git commit -m 'feat: add amazing feature'`.
4. Push to the branch: `git push origin feature/amazing-feature`.
5. Open a **Pull Request**.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
