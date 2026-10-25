import React, { useState, useEffect, useRef, useCallback } from 'react';
import './cinematic.css';
import Stickman from './Stickman';
import CodeLabyrinth from './CodeLabyrinth';
import DependencyOverlay from './DependencyOverlay';
import ProductShowcase from './ProductShowcase';
import { IconPlay, IconPause, IconArrowRight } from '../Icons';

/**
 * Chapter definitions for the cinematic narrative
 */
const CHAPTERS = [
  { id: 1, title: 'Lost in Code', subtitle: 'The Labyrinth of Interconnected Files', duration: 7000 },
  { id: 2, title: 'The Developer', subtitle: 'Tracing References & Hidden Dependencies', duration: 9000 },
  { id: 3, title: 'Chaos Peaks', subtitle: 'The Cognitive Collapse of Mental Models', duration: 7500 },
  { id: 4, title: 'Transformation', subtitle: 'From Spaghetti Chaos to Architectural Clarity', duration: 8000 },
  { id: 5, title: 'Bridge to Reality', subtitle: 'Connecting Conceptual Model to Working System', duration: 4000 },
  { id: 6, title: 'Live Product', subtitle: 'Interactive Graph & Blast Radius Simulator', duration: 0 } // Interactive / infinite
];

export default function CinematicStory({
  repoId = 'eac55829cf3ea1d6',
  onSelectTab,
  onExitToApp
}) {
  const [currentScene, setCurrentScene] = useState(1);
  const [sceneProgress, setSceneProgress] = useState(0); // 0 to 1 inside active scene
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [camera, setCamera] = useState({ x: 0, y: 0, z: 0, rotX: 0, rotY: 0 });

  // Stickman animation state
  const [stickmanPos, setStickmanPos] = useState({ x: 120, y: 520 });
  const [stickmanState, setStickmanState] = useState('walk');
  const [stickmanFacing, setStickmanFacing] = useState('right');
  const [walkPhase, setWalkPhase] = useState(0);

  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(null);
  const sceneStartTimeRef = useRef(Date.now());

  // Jump to specific scene
  const goToScene = useCallback((sceneNum) => {
    setCurrentScene(sceneNum);
    setSceneProgress(0);
    sceneStartTimeRef.current = Date.now();
    lastTimeRef.current = null;
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setCurrentScene(curr => Math.min(6, curr + 1));
        setSceneProgress(0);
        sceneStartTimeRef.current = Date.now();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setCurrentScene(curr => Math.max(1, curr - 1));
        setSceneProgress(0);
        sceneStartTimeRef.current = Date.now();
      } else if (e.code === 'Escape') {
        if (onExitToApp) onExitToApp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExitToApp]);

  // Main Animation Loop
  useEffect(() => {
    const animate = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) * playbackSpeed;
      lastTimeRef.current = timestamp;

      if (isPlaying && currentScene < 6) {
        const chapter = CHAPTERS[currentScene - 1];
        const sceneDuration = chapter.duration;

        setSceneProgress(prev => {
          const next = prev + delta / sceneDuration;
          if (next >= 1) {
            // Advance to next scene
            if (currentScene < 6) {
              setCurrentScene(c => c + 1);
              sceneStartTimeRef.current = Date.now();
              return 0;
            }
            return 1;
          }
          return next;
        });
      }

      // Choreograph Camera & Stickman according to Scene & Progress
      setWalkPhase(p => (p + (delta / 1000) * 1.8) % 1);

      if (currentScene === 1) {
        // Scene 1: Camera moves close-up across code lines, then tracks backward into layered 3D depth
        const p = sceneProgress;
        setCamera({
          x: p < 0.4 ? (p / 0.4) * 120 - 60 : 60 - (p - 0.4) * 60,
          y: p < 0.4 ? -20 : -20 + (p - 0.4) * 15,
          z: p < 0.4 ? 280 - p * 300 : 160 - (p - 0.4) * 750,
          rotX: p * 4,
          rotY: Math.sin(p * Math.PI) * -8
        });
        setStickmanState('idle');
      } else if (currentScene === 2) {
        // Scene 2: The Developer Stickman enters, inspects file, follows line, gets tangled & frustrated
        const p = sceneProgress;
        setCamera({
          x: -40 + p * 30,
          y: 0,
          z: -80 - p * 40,
          rotX: 3,
          rotY: -4 + p * 6
        });

        if (p < 0.28) {
          // Walking to file
          setStickmanState('walk');
          setStickmanFacing('right');
          setStickmanPos({ x: 180 + p * 600, y: 530 });
        } else if (p < 0.52) {
          // Inspecting code and import
          setStickmanState('inspect');
          setStickmanFacing('right');
          setStickmanPos({ x: 348, y: 530 });
        } else if (p < 0.76) {
          // Following line, branching tangle begins
          setStickmanState('trace');
          setStickmanFacing('right');
          setStickmanPos({ x: 348 + (p - 0.52) * 450, y: 530 });
        } else if (p < 0.88) {
          // Tangled in multiplying dependencies
          setStickmanState('tangled');
          setStickmanPos({ x: 456, y: 530 });
        } else {
          // Frustrated: throwing hands in air, scratching head, slumping
          setStickmanState('frustrated');
          setStickmanPos({ x: 456, y: 530 });
        }
      } else if (currentScene === 3) {
        // Scene 3: Chaos Peaks
        // Camera moves dynamically, brief loss of orientation, then sudden freeze at p > 0.55
        const p = sceneProgress;
        if (p < 0.55) {
          setCamera({
            x: Math.sin(p * 14) * 45,
            y: Math.cos(p * 12) * 35,
            z: -120 + Math.sin(p * 8) * 80,
            rotX: 12 + Math.sin(p * 10) * 8,
            rotY: -10 + Math.cos(p * 10) * 12
          });
        } else {
          // Sudden Freeze! Movement halts completely
          setCamera({ x: 0, y: 0, z: -100, rotX: 8, rotY: -4 });
        }
        setStickmanState('frustrated');
        setStickmanPos({ x: 550, y: 530 });
      } else if (currentScene === 4) {
        // Scene 4: The Transformation!
        // Chaos straightens into clean architectural tiers. Stickman looks up in awe.
        const p = sceneProgress;
        setCamera({
          x: 0,
          y: -10 + (1 - p) * 10,
          z: -60 + (1 - p) * -80,
          rotX: 0,
          rotY: 0
        });
        setStickmanState('awe');
        setStickmanFacing('right');
        setStickmanPos({ x: 550, y: 580 });
      } else if (currentScene === 5) {
        // Scene 5: Transition into real product
        // Camera swoops forward into the api.js dependency route
        const p = sceneProgress;
        setCamera({
          x: p * 40,
          y: p * -20,
          z: p * 380,
          rotX: 0,
          rotY: 0
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, currentScene, sceneProgress, playbackSpeed]);

  const activeChapter = CHAPTERS[currentScene - 1] || CHAPTERS[0];

  return (
    <div className="cinematic-container">
      {/* Background Grid & Editorial Vignette */}
      <div className="cinematic-grid-bg" />
      <div className="cinematic-vignette" />

      {/* Telemetry Header (Scenes 1 to 5) */}
      {currentScene <= 5 && (
        <div className="telemetry-bar">
          <div className="telemetry-left">
            <span className="telemetry-badge">
              <span className="telemetry-accent">ACT {currentScene}</span> / 6
            </span>
            <span style={{ color: '#d4d4d8', fontWeight: 500 }}>{activeChapter.title}</span>
            <span style={{ color: '#52525b' }}>— {activeChapter.subtitle}</span>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#71717a' }}>
              REPO: <span style={{ color: '#f97316' }}>repoanayliser</span> (60 files, 86 deps)
            </span>
          </div>
        </div>
      )}

      {/* Scenes 1 to 5: 3D Stage with Code Panels, SVG Links, Stickman */}
      {currentScene <= 5 && (
        <div className="cinematic-stage">
          {/* 3D Code Environment */}
          <CodeLabyrinth scene={currentScene} progress={sceneProgress} camera={camera} />

          {/* Dynamic SVG Connections */}
          <DependencyOverlay
            scene={currentScene}
            progress={sceneProgress}
            stickmanPos={stickmanPos}
            width={1200}
            height={780}
          />

          {/* SVG Stickman Developer Character */}
          {currentScene >= 2 && currentScene <= 4 && (
            <svg
              className="cinematic-svg-layer"
              viewBox="0 0 1200 780"
              style={{ pointerEvents: 'none', zIndex: 20 }}
            >
              <Stickman
                x={stickmanPos.x}
                y={stickmanPos.y}
                scale={1.25}
                state={stickmanState}
                facing={stickmanFacing}
                phase={walkPhase}
              />
            </svg>
          )}

          {/* Scene 3 Kinetic Typography Pause Overlay */}
          {currentScene === 3 && sceneProgress > 0.45 && (
            <div className="kinetic-overlay fade-in">
              <span className="kinetic-tag">SYSTEM OVERLOAD // 60 FILES // 86 DEPENDENCIES</span>
              <h2 className="kinetic-statement">
                Understanding a complex codebase shouldn’t require holding the entire system in your head.
              </h2>
              <p className="kinetic-sub">
                Spaghetti imports and hidden ripple effects turn minor refactors into systemic fragility.
              </p>
            </div>
          )}

          {/* Scene 4 Typography Reveal */}
          {currentScene === 4 && sceneProgress > 0.4 && (
            <div className="kinetic-overlay fade-in">
              <span className="kinetic-tag">ARCHITECTURAL RECOVERY & SEMANTIC SYNTHESIS</span>
              <h1 className="kinetic-statement" style={{ letterSpacing: '4px', fontSize: '48px', color: '#ffffff' }}>
                ARCHITECH
              </h1>
              <p className="kinetic-sub">
                From scattered lines of code to an executable structural topology.
              </p>
            </div>
          )}

          {/* Scene 5 Transition Prompt */}
          {currentScene === 5 && (
            <div className="kinetic-overlay fade-in">
              <span className="kinetic-tag" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: '#52525b' }}>
                CROSSING THE BRIDGE
              </span>
              <h2 className="kinetic-statement" style={{ fontSize: '32px' }}>
                Transitioning to the Live Working Application...
              </h2>
            </div>
          )}
        </div>
      )}

      {/* Scene 6: Interactive Live Product Demonstration */}
      {currentScene === 6 && (
        <ProductShowcase
          repoId={repoId}
          onSelectTab={onSelectTab}
          onExitToApp={onExitToApp}
        />
      )}

      {/* Bottom Director Control Bar */}
      <div className="director-bar">
        {/* Timeline Progress Bar */}
        <div
          className="director-progress-container"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickFrac = (e.clientX - rect.left) / rect.width;
            const targetScene = Math.min(6, Math.max(1, Math.floor(clickFrac * 6) + 1));
            goToScene(targetScene);
          }}
        >
          <div
            className="director-progress-bar"
            style={{
              width: `${((currentScene - 1 + sceneProgress) / 6) * 100}%`
            }}
          />
        </div>

        {/* Chapter Selection Buttons */}
        <div className="director-chapters">
          {CHAPTERS.map(ch => (
            <button
              key={ch.id}
              className={`director-chapter-btn ${currentScene === ch.id ? 'active' : ''}`}
              onClick={() => goToScene(ch.id)}
            >
              <span className="director-chapter-num">0{ch.id}</span>
              <span>{ch.title}</span>
            </button>
          ))}
        </div>

        {/* Play / Pause / Step Controls */}
        <div className="director-controls-center">
          <button
            className="control-btn"
            title="Previous Scene (Left Arrow)"
            onClick={() => goToScene(Math.max(1, currentScene - 1))}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <IconPlay size={11} style={{ transform: 'rotate(180deg)' }} />
          </button>

          <button
            className={`control-btn play-btn`}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            onClick={() => setIsPlaying(p => !p)}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isPlaying ? <IconPause size={12} /> : <IconPlay size={12} />}
          </button>

          <button
            className="control-btn"
            title="Next Scene (Right Arrow)"
            onClick={() => goToScene(Math.min(6, currentScene + 1))}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <IconPlay size={11} />
          </button>

          <button
            className="control-btn"
            title="Playback Speed"
            style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}
            onClick={() => setPlaybackSpeed(s => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1))}
          >
            {playbackSpeed}x
          </button>
        </div>

        {/* Right Actions: Jump to Full Workspace */}
        <div className="director-right-actions">
          <button
            className="enter-app-btn"
            onClick={onExitToApp}
            title="Open standard workspace tabs"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            Open Live Workspace <IconArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
