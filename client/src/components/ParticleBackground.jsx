import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const PARTICLE_COUNT = 4500;

/**
 * Full-viewport WebGL particle background — fixed behind page content.
 * Renders ~4500 softly glowing particles in a flowing, breathing motion.
 * Zero pointer-event interference. Disposes on unmount.
 */
export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* ── Renderer ─────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.z = 80;

    /* ── Geometry ─────────────────────────────────────── */
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors    = new Float32Array(PARTICLE_COUNT * 3);
    const speeds    = new Float32Array(PARTICLE_COUNT);   // drift speed per particle
    const offsets   = new Float32Array(PARTICLE_COUNT);   // phase offset

    const c0 = new THREE.Color();
    const c1 = new THREE.Color(0xff4db8); // brand pink
    const c2 = new THREE.Color(0x8b5cf6); // brand violet
    const c3 = new THREE.Color(0x3b82f6); // accent blue

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spread over a wide slab in front of camera
      positions[i * 3]     = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

      speeds[i]  = 0.015 + Math.random() * 0.035;
      offsets[i] = Math.random() * Math.PI * 2;

      // Interpolate between brand colors by position
      const t = Math.random();
      if (t < 0.5) {
        c0.lerpColors(c1, c2, t * 2);
      } else {
        c0.lerpColors(c2, c3, (t - 0.5) * 2);
      }
      colors[i * 3]     = c0.r;
      colors[i * 3 + 1] = c0.g;
      colors[i * 3 + 2] = c0.b;
    }

    const geo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', posAttr);
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    /* ── Sprite texture (soft circle) ─────────────────── */
    const spriteSize = 64;
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = spriteCanvas.height = spriteSize;
    const ctx = spriteCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0,    'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1,    'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, spriteSize, spriteSize);
    const spriteTex = new THREE.CanvasTexture(spriteCanvas);

    const mat = new THREE.PointsMaterial({
      size: 1.4,
      sizeAttenuation: true,
      vertexColors: true,
      map: spriteTex,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    /* ── Resize handling ──────────────────────────────── */
    const onResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);
    onResize();

    /* ── Animation loop ───────────────────────────────── */
    let rafId;
    let startTime = performance.now();

    const halfW = 100;
    const halfH = 60;

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      const elapsed = (performance.now() - startTime) / 1000;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ph = offsets[i];
        const sp = speeds[i];

        // Gentle upward drift + horizontal sine sway
        positions[i * 3 + 1] += sp * 0.25;
        positions[i * 3]     += Math.sin(elapsed * 0.4 + ph) * 0.012;
        positions[i * 3 + 2] += Math.cos(elapsed * 0.3 + ph * 1.3) * 0.008;

        // Slow global rotation effect
        const x = positions[i * 3];
        const z = positions[i * 3 + 2];
        const angle = elapsed * 0.04;
        positions[i * 3]     = x * Math.cos(angle * 0.01) - z * Math.sin(angle * 0.01);
        positions[i * 3 + 2] = x * Math.sin(angle * 0.01) + z * Math.cos(angle * 0.01);

        // Wrap Y — particles reaching top teleport to bottom
        if (positions[i * 3 + 1] > halfH) {
          positions[i * 3 + 1] = -halfH;
          positions[i * 3]     = (Math.random() - 0.5) * 200;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
        }
      }

      posAttr.needsUpdate = true;

      // Very slow camera drift
      camera.position.x = Math.sin(elapsed * 0.07) * 6;
      camera.position.y = Math.cos(elapsed * 0.05) * 3;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    tick();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      spriteTex.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
