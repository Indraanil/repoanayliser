import React from 'react';

/**
 * Stickman Developer Character
 * Minimalist, expressive SVG character representing a software developer.
 * Uses clean technical linework (2.5px stroke, rounded joints) adhering to editorial style.
 * 
 * Supports dynamic states:
 * - 'walk': walking across code panels
 * - 'inspect': leaning in to inspect an import / file
 * - 'trace': tracing a dependency path across the screen
 * - 'tangled': wrapped / dodging crossing dependency lines
 * - 'frustrated': hands in air, scratching head, slumping in exhaustion with floating '?' marks
 * - 'awe': standing in wonder looking up at the organized ARCHITECH system
 */
export default function Stickman({
  x = 0,
  y = 0,
  scale = 1,
  state = 'walk', // 'walk' | 'inspect' | 'trace' | 'tangled' | 'frustrated' | 'awe' | 'idle'
  phase = 0, // 0 to 1 continuous time phase for walk cycles
  facing = 'right', // 'right' | 'left'
}) {
  const isLeft = facing === 'left';
  const flip = isLeft ? -1 : 1;

  // Render pose based on state and phase
  const renderPose = () => {
    switch (state) {
      case 'walk': {
        // Natural 2-segment bipedal walk cycle
        const walkAngle = Math.sin(phase * Math.PI * 2);
        const leg1Angle = walkAngle * 30;
        const leg2Angle = -walkAngle * 30;
        const arm1Angle = -walkAngle * 35;
        const arm2Angle = walkAngle * 35;
        const bob = Math.abs(Math.sin(phase * Math.PI * 2)) * 4;

        return (
          <g transform={`translate(0, ${-bob})`}>
            {/* Head */}
            <circle cx="0" cy="-68" r="9" fill="#090a0c" stroke="#f4f4f5" strokeWidth="2.5" />
            {/* Eyes looking forward */}
            <circle cx={flip * 3} cy="-69" r="1.2" fill="#f4f4f5" />
            {/* Body */}
            <line x1="0" y1="-59" x2="0" y2="-28" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            {/* Back Leg */}
            <g transform={`rotate(${leg2Angle}, 0, -28)`}>
              <line x1="0" y1="-28" x2="-4" y2="-12" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="-4" y1="-12" x2="2" y2="0" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" />
            </g>
            {/* Front Leg */}
            <g transform={`rotate(${leg1Angle}, 0, -28)`}>
              <line x1="0" y1="-28" x2="6" y2="-12" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="6" y1="-12" x2="8" y2="0" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            </g>
            {/* Back Arm */}
            <g transform={`rotate(${arm2Angle}, 0, -52)`}>
              <line x1="0" y1="-52" x2="-10" y2="-38" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="-10" y1="-38" x2="-6" y2="-25" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" />
            </g>
            {/* Front Arm */}
            <g transform={`rotate(${arm1Angle}, 0, -52)`}>
              <line x1="0" y1="-52" x2="10" y2="-38" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="10" y1="-38" x2="16" y2="-28" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </g>
        );
      }

      case 'inspect': {
        // Leaning in, inspecting code file with hand raised toward panel
        return (
          <g>
            {/* Head tilted forward */}
            <circle cx="8" cy="-66" r="9" fill="#090a0c" stroke="#f4f4f5" strokeWidth="2.5" />
            {/* Eye focused on code */}
            <circle cx="12" cy="-66" r="1.2" fill="#f4f4f5" />
            {/* Leaning Torso */}
            <line x1="0" y1="-28" x2="6" y2="-57" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            {/* Back leg planted */}
            <line x1="0" y1="-28" x2="-8" y2="-12" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-8" y1="-12" x2="-6" y2="0" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            {/* Front leg */}
            <line x1="0" y1="-28" x2="8" y2="-12" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="8" y1="-12" x2="10" y2="0" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            {/* Left arm on chin / pondering */}
            <line x1="4" y1="-52" x2="12" y2="-44" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="12" y1="-44" x2="9" y2="-58" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            {/* Right arm pointing forward at code */}
            <line x1="4" y1="-52" x2="18" y2="-48" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="18" y1="-48" x2="28" y2="-46" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
            {/* Subtle magnifying glass / pointer ray */}
            <circle cx="29" cy="-46" r="3" fill="none" stroke="#f97316" strokeWidth="1.5" />
          </g>
        );
      }

      case 'trace': {
        // Reaching out and walking, holding / pulling a dependency thread
        const pull = Math.sin(phase * Math.PI * 4) * 3;
        return (
          <g>
            {/* Head */}
            <circle cx="4" cy="-67" r="9" fill="#090a0c" stroke="#f4f4f5" strokeWidth="2.5" />
            <circle cx="8" cy="-68" r="1.2" fill="#f4f4f5" />
            {/* Torso */}
            <line x1="-2" y1="-28" x2="3" y2="-58" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            {/* Legs walking forward */}
            <line x1="-2" y1="-28" x2="-10" y2="-14" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-10" y1="-14" x2="-12" y2="0" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-2" y1="-28" x2="12" y2="-12" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="12" y1="-12" x2="14" y2="0" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            {/* Both arms reaching forward to hold the dependency wire */}
            <line x1="2" y1="-52" x2="16" y2={-50 + pull} stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="16" y1={-50 + pull} x2="30" y2={-45 + pull} stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="2" y1="-52" x2="14" y2={-44 + pull} stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="14" y1={-44 + pull} x2="26" y2={-42 + pull} stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        );
      }

      case 'tangled': {
        // Tangled in dependency lines, dodging and off-balance
        const jitter = Math.sin(phase * Math.PI * 6) * 2;
        return (
          <g transform={`translate(${jitter}, 0)`}>
            {/* Head looking around dizzy */}
            <circle cx="0" cy="-65" r="9" fill="#090a0c" stroke="#f4f4f5" strokeWidth="2.5" />
            {/* Swirl eyes */}
            <circle cx="-3" cy="-66" r="1.2" fill="#f97316" />
            <circle cx="3" cy="-64" r="1.2" fill="#f97316" />
            {/* Torso twisting */}
            <line x1="2" y1="-28" x2="-2" y2="-56" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            {/* Crossed legs */}
            <line x1="2" y1="-28" x2="8" y2="-14" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="8" y1="-14" x2="-4" y2="0" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="2" y1="-28" x2="-8" y2="-12" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-8" y1="-12" x2="6" y2="0" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            {/* Arms flailing in tangled threads */}
            <line x1="-2" y1="-50" x2="-18" y2="-62" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-18" y1="-62" x2="-12" y2="-75" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-2" y1="-50" x2="18" y2="-42" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="18" y1="-42" x2="24" y2="-58" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            {/* Tangled wires wrapping character */}
            <path d="M -22 -60 Q 0 -45 22 -55 T -15 -35 Q 10 -25 -20 -15" fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
          </g>
        );
      }

      case 'frustrated': {
        // Hands thrown in air, head scratching, slumping
        const animStep = (Math.sin(phase * Math.PI * 2) + 1) / 2;
        return (
          <g>
            {/* Head slumping or looking up in despair */}
            <circle cx="0" cy="-62" r="9" fill="#090a0c" stroke="#f4f4f5" strokeWidth="2.5" />
            {/* Slumping spine */}
            <path d="M 0 -53 Q -5 -40 0 -24" fill="none" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            {/* Feet planted wide, knees slightly bent */}
            <line x1="0" y1="-24" x2="-12" y2="-12" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-12" y1="-12" x2="-15" y2="0" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="0" y1="-24" x2="12" y2="-12" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="12" y1="-12" x2="15" y2="0" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />

            {/* Alternating frustration gestures: Hand to head + hand thrown up */}
            {animStep > 0.5 ? (
              <>
                {/* Hand on head scratching */}
                <line x1="-2" y1="-48" x2="10" y2="-56" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="10" y1="-56" x2="2" y2="-68" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
                {/* Hand on hip in exasperation */}
                <line x1="-2" y1="-48" x2="-14" y2="-40" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="-14" y1="-40" x2="-5" y2="-30" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                {/* Both hands thrown up into the air: "WHY?" */}
                <line x1="-2" y1="-48" x2="-18" y2="-65" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="-18" y1="-65" x2="-22" y2="-82" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="-2" y1="-48" x2="18" y2="-65" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="18" y1="-65" x2="22" y2="-82" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
              </>
            )}

            {/* Floating question mark / sweat drop */}
            <g transform="translate(14, -80)">
              <text x="0" y="0" fill="#f97316" fontSize="16" fontFamily="var(--font-mono)" fontWeight="bold">?</text>
            </g>
            <g transform="translate(-20, -74)">
              <text x="0" y="0" fill="#a1a1aa" fontSize="13" fontFamily="var(--font-mono)">?!</text>
            </g>
          </g>
        );
      }

      case 'awe': {
        // Standing tall, hands relaxed at sides, looking upward in admiration at organized architecture
        return (
          <g>
            {/* Head tilted upward */}
            <circle cx="2" cy="-70" r="9" fill="#090a0c" stroke="#f4f4f5" strokeWidth="2.5" />
            {/* Eye looking up */}
            <circle cx="5" cy="-73" r="1.3" fill="#f97316" />
            {/* Confident, upright posture */}
            <line x1="0" y1="-28" x2="1" y2="-61" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            {/* Straight legs, firm stance */}
            <line x1="0" y1="-28" x2="-7" y2="-14" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-7" y1="-14" x2="-8" y2="0" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="0" y1="-28" x2="7" y2="-14" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="7" y1="-14" x2="8" y2="0" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            {/* Relaxed arms at sides */}
            <line x1="1" y1="-54" x2="-9" y2="-40" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-9" y1="-40" x2="-8" y2="-26" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="1" y1="-54" x2="11" y2="-40" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="11" y1="-40" x2="10" y2="-26" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        );
      }

      default: {
        // Idle
        return (
          <g>
            <circle cx="0" cy="-68" r="9" fill="#090a0c" stroke="#f4f4f5" strokeWidth="2.5" />
            <line x1="0" y1="-59" x2="0" y2="-28" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="0" y1="-28" x2="-6" y2="0" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="0" y1="-28" x2="6" y2="0" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="0" y1="-52" x2="-8" y2="-32" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="0" y1="-52" x2="8" y2="-32" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        );
      }
    }
  };

  return (
    <g
      className="stickman-group"
      transform={`translate(${x}, ${y}) scale(${scale * flip}, ${scale})`}
      style={{ transformOrigin: '0 0' }}
    >
      {/* Subtle floor contact shadow */}
      <ellipse cx="0" cy="1" rx="14" ry="3" fill="rgba(0, 0, 0, 0.45)" />
      {renderPose()}
    </g>
  );
}
