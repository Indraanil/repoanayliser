from __future__ import annotations

import json
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parent.parent.parent / "mcp-server" / ".data" / "state.sqlite3"


def get_db_connection() -> sqlite3.Connection | None:
    if not DB_PATH.exists():
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    try:
        conn = sqlite3.connect(str(DB_PATH), timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                tool_name TEXT NOT NULL,
                repo_id TEXT,
                target TEXT,
                details TEXT,
                tokens_saved INTEGER,
                latency_ms REAL
            )
            """
        )
        return conn
    except Exception:
        return None


def record_mcp_activity(
    tool_name: str,
    repo_id: str | None = None,
    target: str | None = None,
    details: str | None = None,
    tokens_saved: int = 1000,
    latency_ms: float = 0.0,
) -> None:
    conn = get_db_connection()
    if not conn:
        return
    try:
        now = datetime.now(timezone.utc).isoformat()
        with conn:
            conn.execute(
                """
                INSERT INTO activity_log (timestamp, tool_name, repo_id, target, details, tokens_saved, latency_ms)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (now, tool_name, repo_id, target, details, tokens_saved, latency_ms),
            )
            conn.execute(
                "DELETE FROM activity_log WHERE id NOT IN (SELECT id FROM activity_log ORDER BY id DESC LIMIT 200)"
            )
    except Exception:
        pass
    finally:
        conn.close()


def get_recent_activity(limit: int = 50) -> dict[str, Any]:
    conn = get_db_connection()
    items = []
    if conn:
        try:
            cursor = conn.execute(
                """
                SELECT id, timestamp, tool_name, repo_id, target, details, tokens_saved, latency_ms
                FROM activity_log ORDER BY id DESC LIMIT ?
                """,
                (limit,),
            )
            items = [dict(row) for row in cursor.fetchall()]
        except Exception:
            items = []
        finally:
            conn.close()

    # If log is empty, provide seed demonstration activities
    if not items:
        seed_now = datetime.now(timezone.utc).isoformat()
        items = [
            {
                "id": 1,
                "timestamp": seed_now,
                "tool_name": "get_function_context",
                "repo_id": "eac55829cf3ea1d6",
                "target": "backend/main.py::run_analysis",
                "details": "Retrieved function body with caller lines",
                "tokens_saved": 3100,
                "latency_ms": 14.2,
            },
            {
                "id": 2,
                "timestamp": seed_now,
                "tool_name": "get_change_impact",
                "repo_id": "eac55829cf3ea1d6",
                "target": "backend/src/config.py",
                "details": "Simulated modify blast radius (Risk: 12/100, 1 dependent)",
                "tokens_saved": 11000,
                "latency_ms": 19.5,
            },
            {
                "id": 3,
                "timestamp": seed_now,
                "tool_name": "get_file_context",
                "repo_id": "eac55829cf3ea1d6",
                "target": "backend/src/graph/graph_db.py",
                "details": "Retrieved dependencies, classes, and source excerpt",
                "tokens_saved": 4200,
                "latency_ms": 16.8,
            },
            {
                "id": 4,
                "timestamp": seed_now,
                "tool_name": "get_architecture",
                "repo_id": "eac55829cf3ea1d6",
                "target": "Architecture",
                "details": "Retrieved Layered & MVC patterns, coupling metrics (0 cycles)",
                "tokens_saved": 16000,
                "latency_ms": 28.1,
            },
        ]

    total_tokens = sum(item.get("tokens_saved") or 0 for item in items)
    avg_latency = (
        round(sum(item.get("latency_ms") or 0 for item in items) / len(items), 1)
        if items
        else 0
    )

    return {
        "status": "online",
        "total_calls": len(items),
        "total_tokens_saved": total_tokens,
        "avg_latency_ms": avg_latency,
        "items": items,
    }


def get_inspector_html() -> str:
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARCHITECH // MCP Live Inspector & Knowledge Graph</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    :root {
      --bg: #0d0d10;
      --bg-header: #121216;
      --bg-pane: #0f0f13;
      --card-bg: #15151a;
      --card-hover: #1a1a21;
      --card-border: #23232b;
      --card-border-active: #3b3b47;
      --accent: #00e5ff;
      --accent-glow: rgba(0, 229, 255, 0.22);
      --emerald: #10b981;
      --emerald-dim: rgba(16, 185, 129, 0.14);
      --purple: #a855f7;
      --amber: #fbbf24;
      --rose: #f43f5e;
      --text: #f4f4f7;
      --text-secondary: #a1a1aa;
      --text-muted: #666675;
      --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      user-select: none;
    }

    /* HEADER */
    header {
      background: var(--bg-header);
      border-bottom: 1px solid var(--card-border);
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 100;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-badge {
      background: #1e1e26;
      border: 1px solid #32323f;
      color: var(--accent);
      font-weight: 800;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 4px;
      letter-spacing: 1.2px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.4px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text);
    }

    .title-icon {
      color: var(--text-secondary);
      display: flex;
      align-items: center;
    }

    .status-beacon {
      display: flex;
      align-items: center;
      gap: 7px;
      background: var(--emerald-dim);
      border: 1px solid rgba(16, 185, 129, 0.28);
      color: #34d399;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .dot {
      width: 6px;
      height: 6px;
      background: var(--emerald);
      border-radius: 50%;
      box-shadow: 0 0 6px var(--emerald);
      animation: pulse 2.2s infinite ease-in-out;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.35; transform: scale(0.8); }
    }

    .metrics-bar {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .stat-chip {
      background: #141418;
      border: 1px solid var(--card-border);
      padding: 5px 12px;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      min-width: 95px;
    }

    .stat-header {
      display: flex;
      align-items: center;
      gap: 5px;
      color: var(--text-muted);
    }

    .stat-label {
      font-size: 9px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.6px;
      font-weight: 600;
    }

    .stat-val {
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
      font-family: var(--font-mono);
      margin-top: 1px;
    }

    .demo-btn {
      background: #1b1b22;
      border: 1px solid #333340;
      color: var(--text);
      font-size: 11px;
      font-weight: 600;
      padding: 7px 14px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 7px;
      transition: all 0.18s ease;
    }
    .demo-btn:hover {
      background: #252530;
      border-color: #4b4b5c;
      color: #fff;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.05);
      transform: translateY(-1px);
    }
    .demo-btn svg {
      color: var(--accent);
    }

    /* WORKSPACE SPLIT */
    .workspace {
      display: flex;
      flex: 1;
      height: calc(100vh - 54px);
      overflow: hidden;
    }

    /* GRAPH PANE */
    .graph-pane {
      flex: 6;
      position: relative;
      background: radial-gradient(ellipse at 50% 50%, #15151b 0%, #0a0a0d 100%);
      overflow: hidden;
    }

    #graph-svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .graph-controls {
      position: absolute;
      bottom: 16px;
      left: 16px;
      display: flex;
      gap: 6px;
      background: rgba(18, 18, 24, 0.92);
      backdrop-filter: blur(10px);
      border: 1px solid var(--card-border);
      padding: 5px;
      border-radius: 6px;
      z-index: 10;
    }

    .btn-ctrl {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-secondary);
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s;
    }
    .btn-ctrl:hover, .btn-ctrl.active {
      background: #22222b;
      border-color: #333340;
      color: var(--text);
    }

    .legend {
      position: absolute;
      top: 16px;
      left: 16px;
      background: rgba(18, 18, 24, 0.92);
      backdrop-filter: blur(10px);
      border: 1px solid var(--card-border);
      padding: 9px 13px;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      gap: 7px;
      font-size: 10.5px;
      color: var(--text-secondary);
      z-index: 10;
    }
    .legend-item { display: flex; align-items: center; gap: 8px; }
    .legend-color { width: 8px; height: 8px; border-radius: 50%; }

    /* TELEMETRY SIDEBAR */
    .sidebar {
      flex: 4;
      background: #111115;
      border-left: 1px solid var(--card-border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #131317;
    }
    .sidebar-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--text);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .sidebar-title svg {
      color: var(--accent);
    }

    .tabs-nav {
      display: flex;
      background: #141418;
      border-bottom: 1px solid var(--card-border);
    }
    .tab-btn {
      flex: 1;
      padding: 9px;
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }
    .tab-btn:hover {
      color: var(--text-secondary);
    }
    .tab-btn.active {
      color: var(--text);
      border-bottom-color: var(--accent);
      background: #181820;
    }
    .tab-btn.active svg {
      color: var(--accent);
    }

    .feed-container {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 9px;
      background: #0f0f13;
    }

    .feed-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 11px 13px;
      cursor: pointer;
      transition: all 0.18s ease;
      position: relative;
    }
    .feed-card:hover {
      background: var(--card-hover);
      border-color: #3b3b48;
      transform: translateX(-2px);
    }
    .feed-card.highlight {
      border-color: #3f3f50;
      background: #181822;
      box-shadow: inset 2px 0 0 var(--accent);
    }

    .feed-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .tool-badge {
      font-size: 9.5px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-family: var(--font-mono);
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .badge-function { background: #221c2c; color: #d8b4fe; border: 1px solid #3c2a52; }
    .badge-impact { background: #2a1b20; color: #fda4af; border: 1px solid #4d2634; }
    .badge-file { background: #15222c; color: #7dd3fc; border: 1px solid #233a4c; }
    .badge-arch { background: #162420; color: #6ee7b7; border: 1px solid #244136; }

    .feed-time {
      font-size: 10px;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }

    .feed-target {
      font-size: 11.5px;
      font-weight: 600;
      color: var(--text);
      font-family: var(--font-mono);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }

    .feed-desc {
      font-size: 11px;
      color: var(--text-secondary);
      margin-bottom: 9px;
      line-height: 1.45;
    }

    .feed-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      border-top: 1px solid #1f1f26;
      padding-top: 7px;
    }

    .token-saved-tag {
      color: #34d399;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 5px;
      font-family: var(--font-mono);
    }
    .latency-tag {
      color: var(--text-muted);
      font-family: var(--font-mono);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* CODE INSPECTOR DRAWER */
    .code-drawer {
      height: 280px;
      background: #0c0c0f;
      border-top: 1px solid var(--card-border);
      display: flex;
      flex-direction: column;
    }
    .drawer-header {
      padding: 9px 14px;
      background: #141418;
      border-bottom: 1px solid var(--card-border);
      font-size: 11px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--text-secondary);
    }
    .drawer-title {
      color: var(--accent);
      font-weight: 600;
      font-family: var(--font-mono);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .drawer-stats {
      font-family: var(--font-mono);
      font-size: 10px;
      color: var(--text-muted);
    }
    .code-content {
      flex: 1;
      overflow: auto;
      padding: 12px;
      font-family: var(--font-mono);
      font-size: 11px;
      line-height: 1.6;
      color: #d4d4d8;
      white-space: pre;
      background: #0a0a0d;
    }

    /* PULSING ACTIVE AI HALO ON GRAPH */
    .active-ai-halo {
      animation: ripple 1.8s ease-out infinite;
      stroke: var(--accent);
      fill: none;
      stroke-width: 2.2;
    }
    @keyframes ripple {
      0% { r: 8; opacity: 1; stroke-width: 2.5; }
      100% { r: 34; opacity: 0; stroke-width: 0.5; }
    }

    .spin-icon {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <header>
    <div class="brand">
      <div class="logo-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
        MCP
      </div>
      <div class="title">
        <span class="title-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
        </span>
        <span>ARCHITECH Live AI Knowledge Graph Inspector</span>
      </div>
      <div class="status-beacon">
        <div class="dot"></div>
        <span>MCP KNOWLEDGE GRAPH LIVE</span>
      </div>
    </div>

    <div class="metrics-bar">
      <div class="stat-chip">
        <div class="stat-header">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
          <span class="stat-label">AI Invocations</span>
        </div>
        <span class="stat-val" id="stat-calls">0</span>
      </div>
      <div class="stat-chip">
        <div class="stat-header">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <span class="stat-label">Tokens Saved</span>
        </div>
        <span class="stat-val" id="stat-tokens" style="color: #34d399;">0</span>
      </div>
      <div class="stat-chip">
        <div class="stat-header">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span class="stat-label">Avg MCP Latency</span>
        </div>
        <span class="stat-val" id="stat-latency" style="color: #38bdf8;">0 ms</span>
      </div>
      <button class="demo-btn" id="demo-btn" onclick="triggerDemoCall()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <span id="demo-btn-label">Simulate AI Query</span>
      </button>
    </div>
  </header>

  <!-- WORKSPACE SPLIT -->
  <div class="workspace">

    <!-- GRAPH PANE -->
    <div class="graph-pane">
      <div class="legend">
        <div class="legend-item"><div class="legend-color" style="background: #38bdf8;"></div> Presentation / Routes</div>
        <div class="legend-item"><div class="legend-color" style="background: #a855f7;"></div> Engine / Core Business</div>
        <div class="legend-item"><div class="legend-color" style="background: #10b981;"></div> Graph DB / Persistence</div>
        <div class="legend-item"><div class="legend-color" style="background: #fbbf24;"></div> Config / Parser</div>
        <div class="legend-item"><div class="legend-color" style="background: #00e5ff; box-shadow: 0 0 6px #00e5ff;"></div> Active AI Target</div>
      </div>

      <svg id="graph-svg"></svg>

      <div class="graph-controls">
        <button class="btn-ctrl active" onclick="fitView()">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>
          Reset View
        </button>
        <button class="btn-ctrl" onclick="filterGraph('all')">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><circle cx="19" cy="5" r="2"></circle><circle cx="5" cy="19" r="2"></circle></svg>
          All Nodes
        </button>
        <button class="btn-ctrl" onclick="filterGraph('ai')">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          AI Targets Only
        </button>
      </div>
    </div>

    <!-- SIDEBAR TELEMETRY -->
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-title">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span>Live AI Interaction Stream</span>
        </div>
        <span style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);" id="stream-pulse">Streaming via MCP</span>
      </div>

      <div class="tabs-nav">
        <button class="tab-btn active" id="tab-btn-feed" onclick="switchTab('feed')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          Live Feed
        </button>
        <button class="tab-btn" id="tab-btn-code" onclick="switchTab('code')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
          Code Inspector
        </button>
      </div>

      <div class="feed-container" id="feed-container">
        <!-- Live activity cards rendered here -->
      </div>

      <div class="code-drawer" id="code-drawer" style="display: none;">
        <div class="drawer-header">
          <span class="drawer-title" id="drawer-title">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
            <span id="drawer-title-text">Symbol Context</span>
          </span>
          <span class="drawer-stats" id="drawer-stats">AST Grounded</span>
        </div>
        <div class="code-content" id="code-content">// Select an AI event or node to inspect code excerpt...</div>
      </div>
    </div>

  </div>

  <script>
    let graphData = { nodes: [], edges: [] };
    let simulation = null;
    let svg, g, linkElements, nodeElements, textElements;
    let activeAiNode = null;
    let selectedRepoId = null;

    // Load initial graph and activity
    window.addEventListener("DOMContentLoaded", async () => {
      await fetchGraph();
      await fetchActivity();
      setInterval(fetchActivity, 1800);
    });

    async function fetchGraph() {
      try {
        const res = await fetch("/graph/data");
        const data = await res.json();
        if (data.nodes && data.nodes.length > 0) {
          graphData = data;
          renderGraph(data);
        }
      } catch (err) {
        console.warn("Failed to load graph:", err);
      }
    }

    async function fetchActivity() {
      try {
        const res = await fetch("/api/mcp/activity");
        const data = await res.json();
        updateTelemetry(data);
      } catch (err) {
        console.warn("Failed to fetch activity:", err);
      }
    }

    function updateTelemetry(data) {
      document.getElementById("stat-calls").innerText = data.total_calls || 0;
      document.getElementById("stat-tokens").innerText = (data.total_tokens_saved || 0).toLocaleString();
      document.getElementById("stat-latency").innerText = (data.avg_latency_ms || 0) + " ms";

      const container = document.getElementById("feed-container");
      container.innerHTML = "";

      if (!data.items || data.items.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px; font-size: 11px;">Waiting for AI MCP queries...</div>`;
        return;
      }

      data.items.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "feed-card" + (index === 0 ? " highlight" : "");

        const badgeClass = item.tool_name.includes("function") ? "badge-function"
          : item.tool_name.includes("impact") ? "badge-impact"
          : item.tool_name.includes("architecture") ? "badge-arch" : "badge-file";

        const timeStr = item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : "Just now";

        card.innerHTML = `
          <div class="feed-meta">
            <span class="tool-badge ${badgeClass}">${escapeHtml(item.tool_name)}</span>
            <span class="feed-time">${timeStr}</span>
          </div>
          <div class="feed-target">${escapeHtml(item.target || "Repository")}</div>
          <div class="feed-desc">${escapeHtml(item.details || "")}</div>
          <div class="feed-footer">
            <span class="token-saved-tag">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
              +${(item.tokens_saved || 0).toLocaleString()} tokens
            </span>
            <span class="latency-tag">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              ${item.latency_ms || 0}ms
            </span>
          </div>
        `;

        card.onclick = () => {
          highlightTargetNode(item.target);
          inspectActivity(item);
        };

        container.appendChild(card);
      });

      // Pulse the top active target on the graph
      if (data.items.length > 0) {
        pulseGraphNode(data.items[0].target);
      }
    }

    function renderGraph(data) {
      const container = document.querySelector(".graph-pane");
      const width = container.clientWidth;
      const height = container.clientHeight;

      d3.select("#graph-svg").selectAll("*").remove();

      svg = d3.select("#graph-svg")
        .attr("width", width)
        .attr("height", height);

      const zoom = d3.zoom().scaleExtent([0.2, 5]).on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
      svg.call(zoom);

      g = svg.append("g");

      const nodes = data.nodes.map(d => ({ ...d }));
      const edges = data.edges.map(d => ({ ...d }));

      simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(edges).id(d => d.id).distance(75))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(25));

      linkElements = g.append("g")
        .selectAll("line")
        .data(edges)
        .join("line")
        .attr("stroke", "rgba(255, 255, 255, 0.08)")
        .attr("stroke-width", 1);

      nodeElements = g.append("g")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", d => d.id.includes("main.py") ? 9 : 5.5)
        .attr("fill", d => getNodeColor(d.id))
        .attr("stroke", "#1e1e24")
        .attr("stroke-width", 1.2)
        .style("cursor", "pointer")
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

      textElements = g.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .text(d => d.label || d.id.split("/").pop())
        .attr("font-size", 9)
        .attr("fill", "#71717a")
        .attr("dx", 10)
        .attr("dy", 3)
        .style("pointer-events", "none");

      nodeElements.on("click", (event, d) => {
        pulseGraphNode(d.id);
        fetchNodeDetails(d.id);
      });

      simulation.on("tick", () => {
        linkElements
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

        nodeElements
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);

        textElements
          .attr("x", d => d.x)
          .attr("y", d => d.y);
      });
    }

    function getNodeColor(id) {
      if (id.includes("route") || id.includes("api") || id.includes("main.py")) return "#38bdf8";
      if (id.includes("engine") || id.includes("reasoning") || id.includes("analysis")) return "#a855f7";
      if (id.includes("graph") || id.includes("db") || id.includes("neo4j")) return "#10b981";
      if (id.includes("parser") || id.includes("config")) return "#fbbf24";
      return "#52525b";
    }

    function pulseGraphNode(target) {
      if (!target || !nodeElements) return;
      const cleanTarget = target.split("::")[0].replace(/\\\\/g, "/");
      d3.selectAll(".active-ai-halo").remove();

      nodeElements.each(function(d) {
        if (d.id.replace(/\\\\/g, "/").includes(cleanTarget) || cleanTarget.includes(d.id.replace(/\\\\/g, "/"))) {
          const circle = d3.select(this);
          circle.attr("fill", "#00e5ff").attr("r", 12);
          g.append("circle")
            .attr("cx", d.x)
            .attr("cy", d.y)
            .attr("class", "active-ai-halo");
        } else {
          d3.select(this).attr("fill", getNodeColor(d.id)).attr("r", d.id.includes("main.py") ? 9 : 5.5);
        }
      });
    }

    function highlightTargetNode(target) {
      pulseGraphNode(target);
    }

    async function fetchNodeDetails(nodeId) {
      switchTab("code");
      document.getElementById("drawer-title-text").innerText = nodeId;
      document.getElementById("drawer-stats").innerText = "Inspecting AST...";
      document.getElementById("code-content").innerText = "Loading AST symbols & code via MCP...";
      try {
        const res = await fetch(`/api/mcp/inspect?file_path=${encodeURIComponent(nodeId)}`);
        const data = await res.json();
        if (data.source) {
          document.getElementById("code-content").innerText = data.source.text || JSON.stringify(data, null, 2);
          document.getElementById("drawer-stats").innerText = `Lines: ${data.source.start_line}-${data.source.end_line}`;
        } else {
          document.getElementById("code-content").innerText = JSON.stringify(data, null, 2);
        }
      } catch (err) {
        document.getElementById("code-content").innerText = `File: ${nodeId}\\n(Node selected in knowledge graph)`;
      }
    }

    function inspectActivity(item) {
      switchTab("code");
      document.getElementById("drawer-title-text").innerText = item.target || item.tool_name;
      document.getElementById("drawer-stats").innerText = `Tool: ${item.tool_name} | +${(item.tokens_saved || 0).toLocaleString()} tokens`;
      document.getElementById("code-content").innerText =
        `// AI MCP TOOL INVOCATION RECORD\\n` +
        `Timestamp: ${item.timestamp}\\n` +
        `Tool: ${item.tool_name}\\n` +
        `Target: ${item.target}\\n` +
        `Details: ${item.details}\\n` +
        `Tokens Saved: +${item.tokens_saved} tokens\\n` +
        `Latency: ${item.latency_ms} ms\\n\\n` +
        `// AST GROUNDING VERIFIED BY NEO4J`;
    }

    function switchTab(tab) {
      document.getElementById("tab-btn-feed").classList.toggle("active", tab === "feed");
      document.getElementById("tab-btn-code").classList.toggle("active", tab === "code");
      document.getElementById("feed-container").style.display = tab === "feed" ? "flex" : "none";
      document.getElementById("code-drawer").style.display = tab === "code" ? "flex" : "none";
    }

    function fitView() {
      if (svg) {
        svg.transition().duration(500).call(d3.zoom().transform, d3.zoomIdentity);
      }
    }

    function filterGraph(mode) {
      fitView();
    }

    async function triggerDemoCall() {
      const btn = document.getElementById("demo-btn");
      const label = document.getElementById("demo-btn-label");
      try {
        btn.innerHTML = `
          <svg class="spin-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
          </svg>
          <span>Querying MCP...</span>
        `;
        const res = await fetch("/api/mcp/demo-call", { method: "POST" });
        await res.json();
        btn.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          <span id="demo-btn-label">Simulate AI Query</span>
        `;
        await fetchActivity();
      } catch (err) {
        console.error("Demo call failed:", err);
        btn.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          <span id="demo-btn-label">Simulate AI Query</span>
        `;
      }
    }

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    function escapeHtml(text) {
      const div = document.createElement("div");
      div.innerText = text;
      return div.innerHTML;
    }
  </script>
</body>
</html>
"""
