/* eslint-disable no-template-curly-in-string */
import React from 'react';

/**
 * Authentic code snippets from repoanayliser codebase
 */
export const CODE_SNIPPETS = {
  analysisEngine: {
    file: 'backend/src/analysis_engine.py',
    lang: 'Python',
    lines: [
      { num: 14, tokens: [{ type: 'kw', text: 'class ' }, { type: 'fn', text: 'ArchitectureRecoveryEngine' }, { type: 'op', text: ':' }] },
      { num: 15, tokens: [{ type: 'comment', text: '    """Extracts semantic topologies and AST dependencies."""' }] },
      { num: 16, tokens: [{ type: 'kw', text: '    def ' }, { type: 'fn', text: '__init__' }, { type: 'op', text: '(self, repo_path: ' }, { type: 'type', text: 'str' }, { type: 'op', text: '):' }] },
      { num: 17, tokens: [{ type: 'text', text: '        self.graph = KnowledgeGraphBuilder()' }] },
      { num: 18, tokens: [{ type: 'text', text: '        self.parser = ASTDependencyParser()' }] },
      { num: 19, tokens: [{ type: 'kw', text: '    def ' }, { type: 'fn', text: 'synthesize_tiers' }, { type: 'op', text: '(self, depth: ' }, { type: 'type', text: 'int' }, { type: 'op', text: ' = 3):' }] },
      { num: 20, tokens: [{ type: 'text', text: '        nodes = self.extract_symbols()' }] },
      { num: 21, tokens: [{ type: 'kw', text: '        return ' }, { type: 'fn', text: 'detect_architectural_cycles' }, { type: 'op', text: '(nodes)' }] }
    ]
  },
  architectureView: {
    file: 'frontend/src/components/ArchitectureView.js',
    lang: 'React / JSX',
    lines: [
      { num: 1, tokens: [{ type: 'kw', text: 'import ' }, { type: 'text', text: 'React, { useState, useEffect } ' }, { type: 'kw', text: 'from ' }, { type: 'str', text: "'react'" }, { type: 'op', text: ';' }] },
      { num: 2, tokens: [{ type: 'kw', text: 'import ' }, { type: 'text', text: '{ api } ' }, { type: 'kw', text: 'from ' }, { type: 'str', text: "'../services/api'" }, { type: 'op', text: ';' }] },
      { num: 3, tokens: [{ type: 'kw', text: 'export default function ' }, { type: 'fn', text: 'ArchitectureView' }, { type: 'op', text: '({ repoId }) {' }] },
      { num: 4, tokens: [{ type: 'text', text: '  const [architecture, setArchitecture] = useState(null);' }] },
      { num: 5, tokens: [{ type: 'kw', text: '  const ' }, { type: 'fn', text: 'loadArchitecture' }, { type: 'op', text: ' = ' }, { type: 'kw', text: 'async ' }, { type: 'op', text: '() => {' }] },
      { num: 6, tokens: [{ type: 'kw', text: '    const ' }, { type: 'op', text: '{ data } = ' }, { type: 'kw', text: 'await ' }, { type: 'text', text: 'api.' }, { type: 'fn', text: 'getArchitecture' }, { type: 'op', text: '(repoId);' }] },
      { num: 7, tokens: [{ type: 'text', text: '    setArchitecture(data);' }] },
      { num: 8, tokens: [{ type: 'op', text: '  };' }] }
    ]
  },
  apiClient: {
    file: 'frontend/src/services/api.js',
    lang: 'JavaScript',
    lines: [
      { num: 3, tokens: [{ type: 'kw', text: 'const ' }, { type: 'text', text: 'API_BASE = ' }, { type: 'str', text: "'http://localhost:8000'" }, { type: 'op', text: ';' }] },
      { num: 5, tokens: [{ type: 'kw', text: 'export const ' }, { type: 'fn', text: 'api' }, { type: 'op', text: ' = {' }] },
      { num: 18, tokens: [{ type: 'fn', text: '  getArchitecture' }, { type: 'op', text: ': (repoId) => axios.get(' }, { type: 'str', text: '`${API_BASE}/architecture`' }, { type: 'op', text: '), ' }] },
      { num: 39, tokens: [{ type: 'fn', text: '  getGraphData' }, { type: 'op', text: ': (repoId) => axios.get(' }, { type: 'str', text: '`${API_BASE}/graph/data`' }, { type: 'op', text: '), ' }] },
      { num: 33, tokens: [{ type: 'fn', text: '  getBlastRadius' }, { type: 'op', text: ': (path, type) => axios.get(' }, { type: 'str', text: '`${API_BASE}/blast-radius`' }, { type: 'op', text: ') ' }] },
      { num: 56, tokens: [{ type: 'fn', text: '  getFunctionGraph' }, { type: 'op', text: ': (repoId) => axios.get(' }, { type: 'str', text: '`${API_BASE}/graph/functions`' }, { type: 'op', text: ') ' }] },
      { num: 113, tokens: [{ type: 'op', text: '};' }] }
    ]
  },
  knowledgeGraph: {
    file: 'graph/KnowledgeGraphBuilder.ts',
    lang: 'TypeScript',
    lines: [
      { num: 28, tokens: [{ type: 'kw', text: 'export class ' }, { type: 'fn', text: 'KnowledgeGraphBuilder' }, { type: 'op', text: ' {' }] },
      { num: 29, tokens: [{ type: 'kw', text: '  private ' }, { type: 'text', text: 'nodes: Map<string, GraphNode> = new Map();' }] },
      { num: 30, tokens: [{ type: 'kw', text: '  private ' }, { type: 'text', text: 'edges: GraphEdge[] = [];' }] },
      { num: 35, tokens: [{ type: 'kw', text: '  public ' }, { type: 'fn', text: 'addDependency' }, { type: 'op', text: '(from: string, to: string): ' }, { type: 'type', text: 'void' }, { type: 'op', text: ' {' }] },
      { num: 36, tokens: [{ type: 'text', text: '    this.edges.push({ source: from, target: to, type: ' }, { type: 'str', text: "'imports'" }, { type: 'text', text: ' });' }] },
      { num: 37, tokens: [{ type: 'text', text: '  }' }] }
    ]
  },
  blastRadius: {
    file: 'frontend/src/components/BlastRadius.js',
    lang: 'React / D3',
    lines: [
      { num: 12, tokens: [{ type: 'kw', text: 'const ' }, { type: 'fn', text: 'simulateBlastRadius' }, { type: 'op', text: ' = ' }, { type: 'kw', text: 'async ' }, { type: 'op', text: '(filePath) => {' }] },
      { num: 13, tokens: [{ type: 'kw', text: '  const ' }, { type: 'op', text: '{ data } = ' }, { type: 'kw', text: 'await ' }, { type: 'text', text: 'api.' }, { type: 'fn', text: 'getBlastRadius' }, { type: 'op', text: '(filePath);' }] },
      { num: 14, tokens: [{ type: 'text', text: '  setAffectedFiles(data.affected || []);' }] },
      { num: 15, tokens: [{ type: 'text', text: '  setSeverity(data.ripple_depth > 3 ? ' }, { type: 'str', text: "'CRITICAL'" }, { type: 'text', text: ' : ' }, { type: 'str', text: "'STABLE'" }, { type: 'text', text: ');' }] },
      { num: 16, tokens: [{ type: 'op', text: '};' }] }
    ]
  }
};

/**
 * Renders an individual stylized code window
 */
function CodeWindow({ snippet, style = {}, highlighted = false, id }) {
  return (
    <div className={`code-panel ${highlighted ? 'highlighted' : ''}`} style={style} id={id}>
      <div className="code-panel-header">
        <div className="code-panel-dots">
          <div className="code-panel-dot" style={{ background: highlighted ? '#f97316' : '#3f3f46' }} />
          <div className="code-panel-dot" />
          <div className="code-panel-dot" />
        </div>
        <span className="code-panel-title">{snippet.file}</span>
        <span className="code-panel-lang">{snippet.lang}</span>
      </div>
      <div className="code-panel-body">
        {snippet.lines.map((line, idx) => (
          <div key={idx} className="code-line">
            <span className="code-line-num">{line.num}</span>
            <span>
              {line.tokens.map((tok, tIdx) => (
                <span key={tIdx} className={tok.type}>
                  {tok.text}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 3D Layered Code Labyrinth Environment
 */
export default function CodeLabyrinth({
  scene = 1, // 1 to 6
  progress = 0, // 0 to 1 within scene
  camera = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0 },
}) {
  // Compute panel positions according to the scene narrative
  const getPanelTransforms = () => {
    if (scene === 1) {
      // Scene 1: Lost in the Codebase
      // Begins zoomed in on architectureView, then camera tracks backward into deep layered field
      const zOffset = progress * 600; // Pulls back
      return {
        architectureView: {
          transform: `translate3d(-80px, -40px, ${100 - zOffset * 0.4}px) rotateY(${progress * -8}deg)`,
          width: '540px',
          opacity: 1,
        },
        apiClient: {
          transform: `translate3d(360px, -140px, ${-320 - zOffset * 0.6}px) rotateY(${progress * 12}deg)`,
          width: '500px',
          opacity: Math.min(1, 0.2 + progress * 0.8),
        },
        analysisEngine: {
          transform: `translate3d(-460px, 120px, ${-580 - zOffset * 0.8}px) rotateX(${progress * 8}deg)`,
          width: '520px',
          opacity: Math.min(1, 0.1 + progress * 0.9),
        },
        knowledgeGraph: {
          transform: `translate3d(180px, 200px, ${-900 - zOffset}px)`,
          width: '480px',
          opacity: Math.min(1, progress * 0.9),
        },
        blastRadius: {
          transform: `translate3d(-240px, -260px, ${-1200 - zOffset * 1.2}px)`,
          width: '460px',
          opacity: Math.min(1, progress * 0.8),
        }
      };
    }

    if (scene === 2) {
      // Scene 2: The Developer interacts with ArchitectureView and api.js
      return {
        architectureView: {
          transform: 'translate3d(-280px, -30px, 20px) rotateY(-4deg)',
          width: '520px',
          opacity: 1,
        },
        apiClient: {
          transform: 'translate3d(260px, -60px, -80px) rotateY(6deg)',
          width: '490px',
          opacity: 1,
        },
        analysisEngine: {
          transform: 'translate3d(-480px, 180px, -400px)',
          width: '460px',
          opacity: 0.8,
        },
        knowledgeGraph: {
          transform: 'translate3d(380px, 200px, -450px)',
          width: '460px',
          opacity: 0.8,
        },
        blastRadius: {
          transform: 'translate3d(-60px, 240px, -650px)',
          width: '440px',
          opacity: 0.6,
        }
      };
    }

    if (scene === 3) {
      // Scene 3: Chaos Peaks
      // Overlapping tilted panels at chaotic angles
      return {
        architectureView: {
          transform: 'translate3d(-340px, -110px, 40px) rotateZ(-6deg) rotateY(-12deg)',
          width: '500px',
          opacity: 0.95,
        },
        apiClient: {
          transform: 'translate3d(240px, -140px, -40px) rotateZ(5deg) rotateY(15deg)',
          width: '480px',
          opacity: 0.95,
        },
        analysisEngine: {
          transform: 'translate3d(-460px, 160px, -120px) rotateZ(8deg)',
          width: '480px',
          opacity: 0.9,
        },
        knowledgeGraph: {
          transform: 'translate3d(340px, 140px, -180px) rotateZ(-7deg)',
          width: '480px',
          opacity: 0.9,
        },
        blastRadius: {
          transform: 'translate3d(-40px, 190px, -220px) rotateZ(3deg)',
          width: '460px',
          opacity: 0.85,
        }
      };
    }

    if (scene === 4 || scene >= 5) {
      // Scene 4: The Transformation!
      // Panels align gracefully into 3 distinct Architectural Tiers (Presentation, Business, Data)
      const p = scene === 4 ? progress : 1;
      return {
        architectureView: {
          transform: `translate3d(${-260 + p * 30}px, ${-180 + p * 10}px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`,
          width: '450px',
          opacity: 1,
        },
        blastRadius: {
          transform: `translate3d(${220 - p * 10}px, ${-180 + p * 10}px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`,
          width: '440px',
          opacity: 1,
        },
        apiClient: {
          transform: `translate3d(${-120 + p * 10}px, ${-10 + p * 10}px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`,
          width: '480px',
          opacity: 1,
        },
        knowledgeGraph: {
          transform: `translate3d(${240 - p * 20}px, ${160 - p * 10}px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`,
          width: '440px',
          opacity: 1,
        },
        analysisEngine: {
          transform: `translate3d(${-280 + p * 20}px, ${160 - p * 10}px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`,
          width: '450px',
          opacity: 1,
        }
      };
    }

    return {};
  };

  const panels = getPanelTransforms();

  return (
    <div
      className="cinematic-camera"
      style={{
        transform: `translate3d(${camera.x}px, ${camera.y}px, ${camera.z}px) rotateX(${camera.rotX}deg) rotateY(${camera.rotY}deg)`,
      }}
    >
      {/* Scene 4 Architectural Tier Outlines */}
      {scene >= 4 && (
        <>
          <div
            className="blueprint-tier"
            style={{
              top: '80px',
              left: '12%',
              right: '12%',
              height: '190px',
              opacity: scene === 4 ? progress : 0.8,
            }}
          >
            <span className="blueprint-tier-label">Tier 1: Presentation Layer (UI Components)</span>
          </div>

          <div
            className="blueprint-tier"
            style={{
              top: '290px',
              left: '18%',
              right: '18%',
              height: '170px',
              opacity: scene === 4 ? progress : 0.8,
            }}
          >
            <span className="blueprint-tier-label">Tier 2: Orchestration & API Gateway</span>
          </div>

          <div
            className="blueprint-tier"
            style={{
              top: '480px',
              left: '12%',
              right: '12%',
              height: '190px',
              opacity: scene === 4 ? progress : 0.8,
            }}
          >
            <span className="blueprint-tier-label">Tier 3: Core Domain, AST & Analysis Engine</span>
          </div>
        </>
      )}

      {/* Code Windows */}
      <CodeWindow
        id="panel-architecture-view"
        snippet={CODE_SNIPPETS.architectureView}
        style={panels.architectureView}
        highlighted={scene === 2 || scene === 4}
      />
      <CodeWindow
        id="panel-api-client"
        snippet={CODE_SNIPPETS.apiClient}
        style={panels.apiClient}
        highlighted={scene === 2 || scene === 4}
      />
      <CodeWindow
        id="panel-analysis-engine"
        snippet={CODE_SNIPPETS.analysisEngine}
        style={panels.analysisEngine}
        highlighted={scene === 3 || scene === 4}
      />
      <CodeWindow
        id="panel-knowledge-graph"
        snippet={CODE_SNIPPETS.knowledgeGraph}
        style={panels.knowledgeGraph}
        highlighted={scene === 4}
      />
      <CodeWindow
        id="panel-blast-radius"
        snippet={CODE_SNIPPETS.blastRadius}
        style={panels.blastRadius}
        highlighted={scene === 4}
      />
    </div>
  );
}
