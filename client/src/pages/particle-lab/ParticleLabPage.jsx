import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParticleEngine } from './ParticleEngine';
import { PRESETS } from './presets';
import Navbar from '../../components/Navbar';

/* ── Simple syntax-highlighted textarea (no heavy deps) ── */
function CodeEditor({ value, onChange, error }) {
  const taRef = useRef(null);

  const handleKey = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta  = taRef.current;
      const s   = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = value.substring(0, s) + '  ' + value.substring(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = s + 2;
      });
    }
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        spellCheck={false}
        className="flex-1 min-h-0 w-full bg-[#0d0d1a] text-[#e2e8f0] font-mono text-[13px]
                   leading-[1.65] resize-none border-none outline-none p-4
                   selection:bg-accent-700/40"
        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace" }}
      />
      {error && (
        <div className="bg-red-950/80 border-t border-red-500/40 px-4 py-2 flex items-start gap-2">
          <span className="text-red-400 text-xs mt-0.5 flex-shrink-0">✕</span>
          <span className="text-red-300 text-xs font-mono leading-relaxed">{error}</span>
        </div>
      )}
    </div>
  );
}

/* ── Slider control ────────────────────────────────────── */
function ControlSlider({ id, label, min, max, value, onChange }) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-text-secondary font-medium tracking-wide">{label}</span>
        <span className="text-[11px] text-brand-400 font-mono w-10 text-right">
          {typeof value === 'number' ? value.toFixed(2) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={(max - min) / 200}
        value={value}
        onChange={(e) => onChange(id, parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                   bg-surface-500 accent-brand-500"
      />
    </div>
  );
}

/* ── Annotation dot ────────────────────────────────────── */
function AnnotationOverlay({ annotations, camera, renderer }) {
  // We just show a legend instead of true 3D projection for simplicity
  if (!annotations || annotations.length === 0) return null;
  return (
    <div className="absolute bottom-24 left-4 flex flex-col gap-1 pointer-events-none">
      {annotations.map((a) => (
        <div key={a.id} className="flex items-center gap-1.5 glass px-2 py-1 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full gradient-brand" />
          <span className="text-[10px] text-text-secondary font-mono">{a.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────── */
export default function ParticleLabPage() {
  const navigate    = useNavigate();
  const canvasRef   = useRef(null);
  const engineRef   = useRef(null);
  const dragRef     = useRef(null);

  const [activePreset, setActivePreset]   = useState(PRESETS[0]);
  const [code, setCode]                   = useState(PRESETS[0].code);
  const [compileError, setCompileError]   = useState(null);
  const [runtimeError, setRuntimeError]   = useState(null);
  const [info, setInfo]                   = useState({ title: '', desc: '' });
  const [controls, setControls]           = useState(new Map());
  const [annotations, setAnnotations]     = useState([]);
  const [editorOpen, setEditorOpen]       = useState(true);
  const [presetsOpen, setPresetsOpen]     = useState(false);
  const [fps, setFps]                     = useState(0);

  // FPS counter
  useEffect(() => {
    let frames = 0;
    let last   = performance.now();
    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(frames);
        frames = 0;
        last   = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    let rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Init engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new ParticleEngine(canvas);
    engineRef.current = engine;

    engine.setOnInfoChange((inf) => setInfo({ title: inf.title, desc: inf.desc }));
    engine.setOnAnnotationsChange((ann) => setAnnotations(ann));
    engine.setOnControlsChange((ctrls) => setControls(new Map(ctrls)));
    engine.setOnError((msg) => setRuntimeError(msg));

    // Run initial preset
    const err = engine.setCode(PRESETS[0].code);
    setCompileError(err);
    engine.start();

    // Resize handler
    const onResize = () => {
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;
      engine.resize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas.parentElement);
    onResize();

    return () => {
      ro.disconnect();
      engine.dispose();
    };
  }, []);

  // Run code
  const runCode = useCallback(() => {
    setRuntimeError(null);
    const err = engineRef.current?.setCode(code);
    setCompileError(err || null);
  }, [code]);

  // Keyboard shortcut — Ctrl+Enter to run
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runCode();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [runCode]);

  // Mouse orbit drag
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    dragRef.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.x) * 0.008;
    const dy = (e.clientY - dragRef.current.y) * 0.008;
    engineRef.current?.orbit(dx, dy);
    dragRef.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseUp = () => { dragRef.current = null; };
  const onWheel   = (e) => { engineRef.current?.zoom(e.deltaY * 0.15); };

  const selectPreset = (preset) => {
    setActivePreset(preset);
    setCode(preset.code);
    setCompileError(null);
    setRuntimeError(null);
    setAnnotations([]);
    const err = engineRef.current?.setCode(preset.code);
    setCompileError(err || null);
    setPresetsOpen(false);
  };

  const onControlChange = (id, value) => {
    engineRef.current?.setControlValue(id, value);
    setControls((prev) => {
      const next = new Map(prev);
      const ctrl = next.get(id);
      if (ctrl) next.set(id, { ...ctrl, value });
      return next;
    });
  };

  return (
    <div className="h-screen flex flex-col bg-surface-900 overflow-hidden">
      <Navbar />

      <div className="flex-1 flex overflow-hidden pt-16">

        {/* ── Canvas area ──────────────────────────── */}
        <div
          className="relative flex-1 min-w-0 cursor-grab active:cursor-grabbing"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ touchAction: 'none' }}
          />

          {/* HUD — top left */}
          <div className="absolute top-4 left-4 max-w-xs pointer-events-none">
            {info.title && (
              <div className="glass rounded-xl px-4 py-3 animate-fade-in">
                <h3 className="text-sm font-bold gradient-brand-text mb-0.5">{info.title}</h3>
                <p className="text-[11px] text-text-muted leading-relaxed">{info.desc}</p>
              </div>
            )}
          </div>

          {/* FPS + particle count — top right */}
          <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 pointer-events-none">
            <div className="glass rounded-lg px-3 py-1.5 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${fps > 45 ? 'bg-success' : fps > 25 ? 'bg-warning' : 'bg-error'} animate-pulse-soft`} />
              <span className="text-[11px] font-mono text-text-secondary">{fps} FPS</span>
            </div>
            <div className="glass rounded-lg px-3 py-1.5">
              <span className="text-[11px] font-mono text-text-muted">22,000 particles</span>
            </div>
          </div>

          {/* Controls hint — bottom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="glass rounded-full px-4 py-1.5 text-[10px] text-text-muted flex items-center gap-3">
              <span>🖱 Drag to orbit</span>
              <span>•</span>
              <span>⚙ Scroll to zoom</span>
              <span>•</span>
              <span>⌨ Ctrl+Enter to run</span>
            </div>
          </div>

          {/* Annotation overlay */}
          <AnnotationOverlay annotations={annotations} />

          {/* Presets panel toggle */}
          <button
            onClick={() => setPresetsOpen((o) => !o)}
            className="absolute bottom-4 right-4 px-4 py-2 rounded-xl glass text-xs font-semibold
                       text-text-secondary hover:text-text-primary transition-colors cursor-pointer border-none"
          >
            🎨 Presets
          </button>

          {/* Presets dropdown */}
          {presetsOpen && (
            <div className="absolute bottom-14 right-4 w-72 glass rounded-2xl overflow-hidden
                            shadow-2xl animate-scale-in z-10">
              <div className="px-4 py-3 border-b border-surface-400/10">
                <h3 className="text-sm font-bold text-text-primary">Choose a Preset</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectPreset(p)}
                    className={`w-full text-left px-4 py-3 cursor-pointer border-none
                               hover:bg-surface-600/50 transition-colors
                               ${activePreset.id === p.id ? 'bg-surface-600/40 border-l-2 border-brand-500' : ''}`}
                  >
                    <div className="text-sm font-medium text-text-primary">{p.name}</div>
                    <div className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{p.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right sidebar ─────────────────────────── */}
        <div className={`flex flex-col border-l border-surface-400/10 bg-surface-800/60
                         transition-all duration-300 ${editorOpen ? 'w-[440px]' : 'w-10'}`}>

          {/* Sidebar toggle */}
          <button
            onClick={() => setEditorOpen((o) => !o)}
            className="flex-shrink-0 h-10 flex items-center justify-center
                       border-b border-surface-400/10 hover:bg-surface-700/50
                       transition-colors cursor-pointer bg-transparent border-none text-text-muted
                       hover:text-text-primary text-sm"
            title={editorOpen ? 'Hide editor' : 'Show editor'}
          >
            {editorOpen ? '›' : '‹'}
          </button>

          {editorOpen && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

              {/* Slider controls */}
              {controls.size > 0 && (
                <div className="flex-shrink-0 border-b border-surface-400/10 pb-2 pt-2">
                  <div className="px-3 pb-1">
                    <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Controls</span>
                  </div>
                  {Array.from(controls.entries()).map(([id, ctrl]) => (
                    <ControlSlider
                      key={id}
                      id={id}
                      label={ctrl.label}
                      min={ctrl.min}
                      max={ctrl.max}
                      value={ctrl.value}
                      onChange={onControlChange}
                    />
                  ))}
                </div>
              )}

              {/* Code editor header */}
              <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-surface-400/10">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Particle Code</span>
                  <span className="text-[10px] text-text-muted">— per-particle function body</span>
                </div>
                <button
                  onClick={runCode}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg gradient-brand text-white
                             text-[11px] font-bold cursor-pointer border-none hover:opacity-90 transition-opacity"
                >
                  ▶ Run
                </button>
              </div>

              {/* Code editor */}
              <CodeEditor
                value={code}
                onChange={setCode}
                error={compileError || runtimeError}
              />

              {/* Active preset name */}
              <div className="flex-shrink-0 border-t border-surface-400/10 px-3 py-2 flex items-center gap-2">
                <span className="text-[10px] text-brand-400">{activePreset.name}</span>
                <span className="text-text-muted text-[10px]">— {activePreset.description}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
