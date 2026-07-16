import * as THREE from 'three';

const PARTICLE_COUNT = 22000;

/**
 * Core Three.js particle simulation engine.
 * Uses BufferGeometry + Points for maximum GPU throughput.
 */
export class ParticleEngine {
  constructor(canvas) {
    this.canvas   = canvas;
    this.count    = PARTICLE_COUNT;
    this._running = false;
    this._rafId   = null;
    this._time    = 0;
    this._lastTs  = null;

    // Per-frame control registry — re-evaluated each frame
    this._controls    = new Map();   // id -> { el, value }
    this._annotations = new Map();   // id -> { mesh }
    this._infoTitle   = '';
    this._infoDesc    = '';
    this._onInfoChange = null;

    // Scratch objects — allocated ONCE, reused every particle update
    this._scratchTarget = new THREE.Vector3();
    this._scratchColor  = new THREE.Color();

    this._compiledFn = null;
    this._compileError = null;

    this._initThree();
    this._initParticles();
    this._initAnnotationLayer();
  }

  /* ── Three.js setup ─────────────────────────────────── */
  _initThree() {
    const { width, height } = this.canvas.getBoundingClientRect();

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width || 800, height || 600, false);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, (width || 800) / (height || 600), 0.1, 2000);
    this.camera.position.set(0, 30, 120);
    this.camera.lookAt(0, 0, 0);

    // Ambient star-field background
    this.scene.background = new THREE.Color(0x050508);

    // Auto-orbit
    this._theta   = 0;
    this._phi     = 0.3;
    this._orbitR  = 120;
    this._autoOrbit = true;
  }

  _initParticles() {
    const n = this.count;

    this._positions = new Float32Array(n * 3);
    this._colors    = new Float32Array(n * 3);

    const geo = new THREE.BufferGeometry();
    this._posAttr = new THREE.BufferAttribute(this._positions, 3);
    this._colAttr = new THREE.BufferAttribute(this._colors,    3);
    this._posAttr.setUsage(THREE.DynamicDrawUsage);
    this._colAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this._posAttr);
    geo.setAttribute('color',    this._colAttr);

    const mat = new THREE.PointsMaterial({
      size: 0.55,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this._points = new THREE.Points(geo, mat);
    this.scene.add(this._points);
  }

  _initAnnotationLayer() {
    // Annotations are handled by the React layer via callbacks
    this._annotationData = [];
  }

  /* ── Public API ─────────────────────────────────────── */
  setCode(code) {
    this._compileError = null;
    this._compiledFn   = null;
    this._controls.clear();

    try {
      // Security: block forbidden patterns
      const forbidden = [
        'document','window','fetch','XMLHttpRequest','WebSocket',
        'eval','Function(','import(','require(','process',
        '__proto__','globalThis','self','location','navigator',
        'localStorage','sessionStorage','indexedDB','crypto',
        'setTimeout','setInterval','alert(','confirm(','prompt(',
      ];
      for (const pat of forbidden) {
        if (code.includes(pat)) {
          this._compileError = `Forbidden pattern: "${pat}"`;
          return this._compileError;
        }
      }

      // Wrap into a function
      // eslint-disable-next-line no-new-func
      this._compiledFn = new Function(
        'i', 'count', 'target', 'color', 'time', 'THREE',
        'addControl', 'setInfo', 'annotate',
        code
      );

      // Dry-run with particle 0
      const dryControls = new Map();
      const addCtrl = (id, label, min, max, init) => {
        dryControls.set(id, init);
        return init;
      };
      this._compiledFn(
        0, this.count,
        this._scratchTarget, this._scratchColor,
        0, THREE,
        addCtrl,
        () => {},
        () => {}
      );

      this._compileError = null;
      return null;
    } catch (e) {
      this._compiledFn   = null;
      this._compileError = e.message;
      return e.message;
    }
  }

  setOnInfoChange(cb)        { this._onInfoChange = cb; }
  setOnAnnotationsChange(cb) { this._onAnnotationsChange = cb; }
  setOnControlsChange(cb)    { this._onControlsChange = cb; }
  setOnError(cb)             { this._onError = cb; }

  setControlValue(id, value) {
    if (this._controls.has(id)) {
      this._controls.get(id).value = value;
    }
  }

  getCompileError() { return this._compileError; }

  resize(width, height) {
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  orbit(dTheta, dPhi) {
    this._autoOrbit = false;
    this._theta    += dTheta;
    this._phi       = Math.max(-1.4, Math.min(1.4, this._phi + dPhi));
  }

  zoom(delta) {
    this._orbitR = Math.max(10, Math.min(500, this._orbitR + delta));
  }

  resetOrbit() { this._autoOrbit = true; }

  start() {
    if (this._running) return;
    this._running = true;
    this._lastTs  = null;
    this._loop(0);
  }

  stop() {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  dispose() {
    this.stop();
    this.renderer.dispose();
    this._points.geometry.dispose();
    this._points.material.dispose();
  }

  /* ── Frame loop ─────────────────────────────────────── */
  _loop(ts) {
    if (!this._running) return;
    this._rafId = requestAnimationFrame(this._loop.bind(this));

    if (this._lastTs !== null) {
      const dt = Math.min((ts - this._lastTs) / 1000, 0.05);
      this._time += dt;
    }
    this._lastTs = ts;

    this._updateOrbit();
    this._updateParticles();
    this.renderer.render(this.scene, this.camera);
  }

  _updateOrbit() {
    if (this._autoOrbit) this._theta += 0.003;

    const r = this._orbitR;
    this.camera.position.set(
      r * Math.cos(this._phi) * Math.sin(this._theta),
      r * Math.sin(this._phi),
      r * Math.cos(this._phi) * Math.cos(this._theta)
    );
    this.camera.lookAt(0, 0, 0);
  }

  _updateParticles() {
    if (!this._compiledFn) return;

    // Reset per-frame state
    const newControls    = new Map();
    const newAnnotations = [];
    let   newInfo        = null;
    let   hadError       = false;

    const addControl = (id, label, min, max, init) => {
      const existing = this._controls.get(id);
      const value    = existing ? existing.value : init;
      newControls.set(id, { label, min, max, init, value });
      return value;
    };

    const setInfo = (title, desc) => {
      newInfo = { title, desc };
    };

    const annotate = (id, pos, text) => {
      newAnnotations.push({ id, pos, text });
    };

    const t      = this._scratchTarget;
    const c      = this._scratchColor;
    const pos    = this._positions;
    const col    = this._colors;
    const count  = this.count;
    const time   = this._time;
    const fn     = this._compiledFn;

    for (let i = 0; i < count; i++) {
      try {
        fn(i, count, t, c, time, THREE, addControl, setInfo, annotate);
      } catch (e) {
        if (!hadError) {
          hadError = true;
          this._onError?.(e.message);
        }
        // Set to origin on error
        pos[i * 3]     = 0;
        pos[i * 3 + 1] = 0;
        pos[i * 3 + 2] = 0;
        col[i * 3]     = 0.5;
        col[i * 3 + 1] = 0.5;
        col[i * 3 + 2] = 0.5;
        continue;
      }

      // Guard against NaN/Infinity
      pos[i * 3]     = isFinite(t.x) ? t.x : 0;
      pos[i * 3 + 1] = isFinite(t.y) ? t.y : 0;
      pos[i * 3 + 2] = isFinite(t.z) ? t.z : 0;
      col[i * 3]     = isFinite(c.r) ? c.r : 0.5;
      col[i * 3 + 1] = isFinite(c.g) ? c.g : 0.5;
      col[i * 3 + 2] = isFinite(c.b) ? c.b : 0.5;
    }

    this._posAttr.needsUpdate = true;
    this._colAttr.needsUpdate = true;

    // Propagate state to React layer
    if (newControls.size > 0) {
      // Sync existing values into new map
      for (const [id, ctrl] of newControls) {
        if (this._controls.has(id)) {
          ctrl.value = this._controls.get(id).value;
        }
      }
      this._controls = newControls;
      this._onControlsChange?.(newControls);
    }

    if (newInfo) {
      this._onInfoChange?.(newInfo);
    }

    if (newAnnotations.length > 0) {
      this._onAnnotationsChange?.(newAnnotations);
    }
  }
}
