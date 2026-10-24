import React from 'react';

/**
 * DependencyOverlay
 * Renders animated SVG dependency lines, tangled wires, and orthogonal architectural connectors.
 * In Scene 1: Faint background dependency web.
 * In Scene 2: Line extends from ArchitectureView import to api.js, branching into a tangle.
 * In Scene 3: Chaotic tangled spiderweb with tension.
 * In Scene 4: Tangled lines straighten into clean architectural blueprint routes with directed arrows.
 */
export default function DependencyOverlay({
  scene = 1,
  progress = 0,
  stickmanPos = { x: 450, y: 460 },
  width = 1200,
  height = 800
}) {
  const cx = width / 2;
  const cy = height / 2;

  // Scene 1: Subtle latent dependency graph in background
  if (scene === 1) {
    return (
      <svg className="cinematic-svg-layer" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="latentLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3f3f46" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#52525b" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <g opacity={progress * 0.7}>
          <line x1={cx - 150} y1={cy - 100} x2={cx + 250} y2={cy - 140} stroke="url(#latentLine)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={cx + 250} y1={cy - 140} x2={cx - 280} y2={cy + 120} stroke="url(#latentLine)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={cx - 150} y1={cy - 100} x2={cx + 100} y2={cy + 180} stroke="url(#latentLine)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={cx - 280} y1={cy + 120} x2={cx + 100} y2={cy + 180} stroke="url(#latentLine)" strokeWidth="1" strokeDasharray="4 4" />
        </g>
      </svg>
    );
  }

  // Scene 2: Stickman opens ArchitectureView, traces line to api.js, and lines multiply!
  if (scene === 2) {
    // Stage A: import line draws from panel to panel
    const line1Length = 500;
    const line1Offset = Math.max(0, (1 - Math.min(1, progress * 2)) * line1Length);
    // Stage B: multiple lines shoot across, wrapping around stickman
    const chaosProgress = Math.max(0, (progress - 0.4) * 1.66);

    return (
      <svg className="cinematic-svg-layer" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <marker id="dotOrange" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6">
            <circle cx="5" cy="5" r="3" fill="#f97316" />
          </marker>
        </defs>

        {/* Primary dependency line being traced */}
        <path
          d={`M ${cx - 120} ${cy - 120} C ${cx} ${cy - 80}, ${cx + 100} ${cy - 160}, ${cx + 310} ${cy - 120}`}
          fill="none"
          stroke="#f97316"
          strokeWidth="2.5"
          strokeDasharray={line1Length}
          strokeDashoffset={line1Offset}
          markerEnd="url(#dotOrange)"
        />

        {/* Branching lines bursting out from api.js */}
        {chaosProgress > 0 && (
          <g opacity={chaosProgress}>
            {/* Tangled line 1 through stickman */}
            <path
              d={`M ${cx + 310} ${cy - 120} Q ${stickmanPos.x + 30} ${stickmanPos.y - 80} ${stickmanPos.x - 20} ${stickmanPos.y - 40} T ${cx - 260} ${cy + 120}`}
              fill="none"
              stroke="#f97316"
              strokeWidth="2"
              strokeDasharray="5 3"
            />
            {/* Tangled line 2 */}
            <path
              d={`M ${cx + 310} ${cy - 120} C ${cx + 150} ${cy + 40}, ${stickmanPos.x - 40} ${stickmanPos.y - 90}, ${cx + 220} ${cy + 160}`}
              fill="none"
              stroke="#e4e4e7"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Tangled line 3 */}
            <path
              d={`M ${cx - 260} ${cy + 120} Q ${stickmanPos.x} ${stickmanPos.y - 20} ${cx + 220} ${cy + 160}`}
              fill="none"
              stroke="#71717a"
              strokeWidth="1.5"
            />
          </g>
        )}
      </svg>
    );
  }

  // Scene 3: Chaos Peaks — tangled labyrinth of dependencies crossing the viewport
  if (scene === 3) {
    return (
      <svg className="cinematic-svg-layer" viewBox={`0 0 ${width} ${height}`}>
        <g opacity="0.85">
          {/* Tangled wire 1 */}
          <path
            d={`M ${cx - 280} ${cy - 160} C ${cx - 50} ${cy + 120}, ${cx + 350} ${cy - 180}, ${cx - 220} ${cy + 180}`}
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            strokeDasharray="6 3"
          />
          {/* Tangled wire 2 */}
          <path
            d={`M ${cx + 320} ${cy - 150} C ${cx - 180} ${cy - 30}, ${cx + 80} ${cy + 220}, ${cx - 320} ${cy + 100}`}
            fill="none"
            stroke="#e4e4e7"
            strokeWidth="1.8"
          />
          {/* Tangled wire 3 */}
          <path
            d={`M ${cx - 340} ${cy - 50} C ${cx + 120} ${cy - 160}, ${cx - 80} ${cy + 240}, ${cx + 280} ${cy + 140}`}
            fill="none"
            stroke="#a1a1aa"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          {/* Tangled wire 4 */}
          <path
            d={`M ${cx + 180} ${cy - 190} Q ${cx - 100} ${cy + 50} ${cx + 220} ${cy + 180}`}
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
          />
          {/* Tangled wire 5 */}
          <path
            d={`M ${cx - 140} ${cy - 200} C ${cx + 250} ${cy - 40}, ${cx - 250} ${cy + 40}, ${cx + 140} ${cy + 200}`}
            fill="none"
            stroke="#71717a"
            strokeWidth="1.2"
          />
          {/* Central tangle knot around developer */}
          <ellipse cx={stickmanPos.x} cy={stickmanPos.y - 50} rx="70" ry="40" fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        </g>
      </svg>
    );
  }

  // Scene 4 & 5: The Transformation — tangled lines straighten into clean orthogonal architectural routes!
  if (scene >= 4) {
    const straighten = scene === 4 ? progress : 1;

    // Start coordinates (Presentation tier)
    const p1 = { x: cx - 180, y: cy - 140 }; // ArchitectureView
    const p2 = { x: cx + 180, y: cy - 140 }; // BlastRadius
    // Mid coordinates (Orchestration tier)
    const mid = { x: cx, y: cy }; // api.js
    // Bottom coordinates (Domain & Analysis tier)
    const b1 = { x: cx - 180, y: cy + 140 }; // analysis_engine
    const b2 = { x: cx + 180, y: cy + 140 }; // KnowledgeGraphBuilder

    return (
      <svg className="cinematic-svg-layer" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <marker id="arrowClean" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f97316" />
          </marker>
          <marker id="arrowMuted" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#71717a" />
          </marker>
        </defs>

        <g opacity={Math.min(1, 0.4 + straighten * 0.6)}>
          {/* Route 1: ArchitectureView -> api.js */}
          <path
            d={
              straighten < 0.8
                ? `M ${p1.x} ${p1.y} C ${p1.x + 80} ${p1.y + 60 * (1 - straighten)}, ${mid.x - 80} ${mid.y - 40}, ${mid.x - 60} ${mid.y}`
                : `M ${p1.x} ${p1.y} L ${p1.x} ${cy - 40} L ${mid.x - 60} ${cy - 40} L ${mid.x - 60} ${mid.y}`
            }
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            markerEnd="url(#arrowClean)"
          />

          {/* Route 2: BlastRadius -> api.js */}
          <path
            d={
              straighten < 0.8
                ? `M ${p2.x} ${p2.y} C ${p2.x - 60} ${p2.y + 40}, ${mid.x + 80} ${mid.y - 40}, ${mid.x + 60} ${mid.y}`
                : `M ${p2.x} ${p2.y} L ${p2.x} ${cy - 40} L ${mid.x + 60} ${cy - 40} L ${mid.x + 60} ${mid.y}`
            }
            fill="none"
            stroke="#a1a1aa"
            strokeWidth="1.8"
            markerEnd="url(#arrowMuted)"
          />

          {/* Route 3: api.js -> analysis_engine.py */}
          <path
            d={
              straighten < 0.8
                ? `M ${mid.x - 40} ${mid.y + 30} C ${mid.x - 80} ${mid.y + 80}, ${b1.x + 40} ${b1.y - 40}, ${b1.x} ${b1.y}`
                : `M ${mid.x - 40} ${mid.y + 20} L ${mid.x - 40} ${cy + 40} L ${b1.x} ${cy + 40} L ${b1.x} ${b1.y}`
            }
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            markerEnd="url(#arrowClean)"
          />

          {/* Route 4: api.js -> KnowledgeGraphBuilder.ts */}
          <path
            d={
              straighten < 0.8
                ? `M ${mid.x + 40} ${mid.y + 30} C ${mid.x + 80} ${mid.y + 80}, ${b2.x - 40} ${b2.y - 40}, ${b2.x} ${b2.y}`
                : `M ${mid.x + 40} ${mid.y + 20} L ${mid.x + 40} ${cy + 40} L ${b2.x} ${cy + 40} L ${b2.x} ${b2.y}`
            }
            fill="none"
            stroke="#a1a1aa"
            strokeWidth="1.8"
            markerEnd="url(#arrowMuted)"
          />

          {/* Architectural Node Badges at connection junctions */}
          <g transform={`translate(${mid.x}, ${mid.y})`}>
            <circle cx="0" cy="0" r="14" fill="#18181b" stroke="#f97316" strokeWidth="2" />
            <text x="0" y="3" textAnchor="middle" fill="#f97316" fontSize="9" fontFamily="var(--font-mono)" fontWeight="600">API</text>
          </g>
        </g>
      </svg>
    );
  }

  return null;
}
