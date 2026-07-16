/**
 * Particle simulation presets — self-contained function body strings.
 * Each is a creative visualization using the particle API.
 */

export const PRESETS = [
  {
    id: 'lorenz',
    name: '🌀 Lorenz Attractor',
    description: 'Chaotic butterfly — the classic strange attractor with turbulent drift.',
    code: `const speed   = addControl("speed",  "Flow Speed",  0.1, 5.0, 1.2);
const spread  = addControl("spread", "Spread",      5,   80,  30);
const chaos   = addControl("chaos",  "Chaos",       0.1, 3.0, 1.0);

const sigma = 10.0, rho = 28.0 * chaos, beta = 2.667;
const t = (i / count) * 60.0 + time * speed * 0.3;
const dt = 0.01;

let lx = Math.sin(t * 1.3) * 10.0;
let ly = Math.cos(t * 0.9) * 10.0;
let lz = 25.0 + Math.sin(t * 0.7) * 5.0;

for (let s = 0; s < 40; s++) {
  const dx = sigma * (ly - lx);
  const dy = lx * (rho - lz) - ly;
  const dz = lx * ly - beta * lz;
  lx += dx * dt; ly += dy * dt; lz += dz * dt;
}

target.set(lx * spread * 0.08, (lz - 25.0) * spread * 0.08, ly * spread * 0.08);

const hue = (i / count + time * 0.05) % 1.0;
color.setHSL(hue, 1.0, 0.55);

if (i === 0) {
  setInfo("Lorenz Attractor", "A chaotic strange attractor — two basins of attraction creating the iconic butterfly shape.");
  annotate("wing1", new THREE.Vector3(-8, 0, -4), "Wing A");
  annotate("wing2", new THREE.Vector3( 8, 0, -4), "Wing B");
}`,
  },

  {
    id: 'galaxy',
    name: '🌌 Galaxy Spiral',
    description: 'Milky Way-style barred spiral galaxy with dust lanes and star clusters.',
    code: `const arms    = addControl("arms",   "Spiral Arms",  2, 8,   3);
const radius  = addControl("radius", "Galaxy Size",  10, 120, 60);
const twist   = addControl("twist",  "Arm Twist",    0,  10,  3.5);
const drift   = addControl("drift",  "Time Drift",   0,  3,   0.4);

const norm    = i / count;
const armIdx  = Math.floor(norm * arms);
const armPos  = (norm * arms) % 1.0;
const baseAng = (armIdx / arms) * Math.PI * 2.0;
const r       = armPos * radius;
const theta   = baseAng + armPos * twist + time * drift * (1.0 - armPos * 0.7);

const scatter = (1.0 - armPos * 0.6) * 4.0;
const hashX   = Math.sin(i * 127.1) * scatter;
const hashY   = Math.sin(i * 311.7) * scatter * 0.3;
const hashZ   = Math.sin(i * 74.3)  * scatter;

target.set(
  Math.cos(theta) * r + hashX,
  hashY,
  Math.sin(theta) * r + hashZ
);

const coreGlow = Math.max(0, 1.0 - armPos * 1.2);
const hue = 0.55 + armPos * 0.25 + coreGlow * 0.1;
const sat = 0.5 + armPos * 0.5;
const lit = 0.3 + coreGlow * 0.4 + Math.sin(i * 43.7) * 0.05;
color.setHSL(hue, sat, Math.min(0.9, lit));

if (i === 0) {
  setInfo("Spiral Galaxy", "A procedural barred spiral galaxy — adjust arms and twist to reshape its structure.");
  annotate("core", new THREE.Vector3(0, 0, 0), "Galactic Core");
}`,
  },

  {
    id: 'dna',
    name: '🧬 DNA Double Helix',
    description: 'Living double helix with animated base pairs and phosphate backbone.',
    code: `const height  = addControl("height",  "Height",       20, 120, 70);
const radius  = addControl("radius",  "Helix Radius", 2,  20,  8);
const turns   = addControl("turns",   "Turns",        1,  15,  6);
const pulse   = addControl("pulse",   "Pulse Speed",  0,  5,   1.5);

const half    = count / 2;
const isB     = i >= half;
const j       = isB ? i - half : i;
const norm    = j / half;

const y       = (norm - 0.5) * height;
const angle   = norm * turns * Math.PI * 2.0 + time * pulse * 0.3;
const offset  = isB ? Math.PI : 0.0;
const ang     = angle + offset;

const wobble  = 1.0 + Math.sin(norm * 20.0 + time * 2.0) * 0.05;
const r       = radius * wobble;

target.set(Math.cos(ang) * r, y, Math.sin(ang) * r);

const hue = isB
  ? 0.58 + norm * 0.15
  : 0.95 + norm * 0.1;
const lit = 0.45 + Math.sin(norm * turns * Math.PI * 2.0 + time) * 0.15;
color.setHSL(hue % 1.0, 1.0, lit);

if (i === 0) {
  setInfo("DNA Double Helix", "Two intertwined phosphate backbones — the molecule of life, animated.");
  annotate("top", new THREE.Vector3(0, height * 0.5, 0), "5' End");
  annotate("bot", new THREE.Vector3(0, -height * 0.5, 0), "3' End");
}`,
  },

  {
    id: 'blackhole',
    name: '⚫ Black Hole Accretion',
    description: 'Relativistic accretion disk with jets and gravitational lensing effect.',
    code: `const scale   = addControl("scale",   "Disk Size",    10, 100, 50);
const speed   = addControl("speed",   "Orbital Speed",0.1, 5, 1.5);
const jet     = addControl("jet",     "Jet Length",   0,  80, 35);
const heat    = addControl("heat",    "Temperature",  0,  1,  0.7);

const norm    = i / count;
const isJet   = norm > 0.85;
const diskN   = isJet ? 0.0 : norm / 0.85;

const r       = (0.05 + diskN * 0.95) * scale;
const angSpd  = speed * (1.0 / (r * 0.03 + 0.5));
const angle   = diskN * Math.PI * 40.0 + time * angSpd;
const tilt    = Math.sin(diskN * Math.PI) * scale * 0.08;
const hashZ   = Math.sin(i * 53.7 + time) * r * 0.04;

const jFrac   = (norm - 0.85) / 0.15;
const jY      = jFrac * jet * (i % 2 === 0 ? 1.0 : -1.0);
const jR      = (1.0 - jFrac) * 2.5;
const jAng    = jFrac * 15.0 + time * 3.0;

const x       = isJet ? Math.cos(jAng) * jR : Math.cos(angle) * r;
const y       = isJet ? jY : tilt + hashZ;
const z       = isJet ? Math.sin(jAng) * jR : Math.sin(angle) * r;

target.set(x, y, z);

const innerHeat = isJet ? 0.6 : heat * (1.0 - diskN * 0.8);
const hue = isJet ? 0.55 + jFrac * 0.1 : 0.05 + innerHeat * 0.12;
color.setHSL(hue, 1.0, 0.3 + innerHeat * 0.5);

if (i === 0) {
  setInfo("Black Hole Accretion", "A relativistic accretion disk with polar jets. Inner disk glows white-hot; jets shoot plasma along the rotation axis.");
  annotate("bh", new THREE.Vector3(0, 0, 0), "Singularity");
}`,
  },

  {
    id: 'torus',
    name: '🍩 Quantum Torus Field',
    description: 'A torus knot threaded with interference wave patterns and quantum jitter.',
    code: `const size    = addControl("size",    "Torus Size",   5,  80, 35);
const p       = Math.round(addControl("p", "Knot P",    1, 7, 3));
const q       = Math.round(addControl("q", "Knot Q",    1, 7, 2));
const freq    = addControl("freq",    "Wave Freq",    1,  20, 8);
const jitter  = addControl("jitter",  "Quantum Noise",0,  5,  1.2);

const norm    = i / count;
const phi     = norm * Math.PI * 2.0;
const tp      = p * phi + time * 0.4;
const tq      = q * phi;

const R       = size;
const r       = size * 0.38;
const cx      = (R + r * Math.cos(tq)) * Math.cos(tp);
const cy      = r * Math.sin(tq);
const cz      = (R + r * Math.cos(tq)) * Math.sin(tp);

const wave    = Math.sin(norm * freq * Math.PI * 2.0 + time * 2.5) * jitter;
const nx      = Math.sin(norm * 137.5) * jitter;
const ny      = Math.cos(norm * 97.3)  * jitter;
const nz      = Math.sin(norm * 213.1) * jitter;

target.set(cx + nx + wave, cy + ny, cz + nz + wave * 0.5);

const hue = (norm + time * 0.08 + Math.abs(wave) * 0.1) % 1.0;
const lit = 0.45 + Math.abs(wave) * 0.08;
color.setHSL(hue, 1.0, Math.min(0.85, lit));

if (i === 0) {
  setInfo("Quantum Torus Knot", "A (" + p + "," + q + ")-torus knot with interference wave patterns. Adjust P and Q to change the knot topology.");
  annotate("center", new THREE.Vector3(0, 0, 0), "Topological Core");
}`,
  },

  {
    id: 'mandelbulb',
    name: '🔮 Mandelbulb Cloud',
    description: '3D fractal Mandelbulb approximation — particles orbit the fractal boundary.',
    code: `const scale   = addControl("scale",   "Size",         10, 80,  40);
const power   = addControl("power",   "Fractal Power",2,  12,  8);
const speed   = addControl("speed",   "Orbit Speed",  0,  3,   0.6);
const density = addControl("density", "Shell Width",  0.5, 5,  1.5);

const norm    = i / count;
const phi     = Math.acos(1.0 - 2.0 * ((norm * 7919.0) % 1.0));
const theta   = norm * Math.PI * (3.0 + Math.sqrt(5.0));

const sn      = Math.sin(phi);
const probe   = scale * (0.95 + Math.sin(i * 0.017 + time * speed) * 0.05);

const bx      = probe * sn * Math.cos(theta);
const by      = probe * Math.cos(phi);
const bz      = probe * sn * Math.sin(theta);

let mx = bx / scale, my = by / scale, mz = bz / scale;
let iter = 0;
for (let s = 0; s < 6; s++) {
  const mr = Math.sqrt(mx*mx + my*my + mz*mz) + 0.0001;
  const mphi = Math.acos(Math.min(1, Math.max(-1, my / mr)));
  const mtheta = Math.atan2(mz, mx);
  const zr = Math.pow(mr, power);
  mx = zr * Math.sin(mphi * power) * Math.cos(mtheta * power) + bx / scale;
  my = zr * Math.cos(mphi * power) + by / scale;
  mz = zr * Math.sin(mphi * power) * Math.sin(mtheta * power) + bz / scale;
  const mr2 = mx*mx + my*my + mz*mz;
  iter += mr2 < 4.0 ? 1.0 : 0.0;
}

const escape  = iter / 6.0;
const scatter = density * (1.0 - escape);
const nx      = Math.sin(i * 43.3) * scatter;
const ny      = Math.sin(i * 71.9) * scatter;
const nz      = Math.sin(i * 19.7) * scatter;

target.set(bx + nx, by + ny, bz + nz);

const hue = (0.62 + escape * 0.38 + time * 0.03) % 1.0;
color.setHSL(hue, 1.0, 0.2 + escape * 0.5);

if (i === 0) {
  setInfo("Mandelbulb Cloud", "20k particles probe the 3D Mandelbulb fractal boundary. Particles that escape glow brighter.");
}`,
  },

  {
    id: 'ocean',
    name: '🌊 Plasma Ocean',
    description: 'A turbulent fluid field with interference waves and foam crests.',
    code: `const size   = addControl("size",   "Ocean Size",  20, 150, 80);
const amp    = addControl("amp",    "Wave Height",  2,  30,  12);
const freq   = addControl("freq",   "Frequency",    0.5, 5, 1.8);
const chaos  = addControl("chaos",  "Turbulence",   0,  5,  1.5);

const cols   = Math.ceil(Math.sqrt(count * 2));
const row    = Math.floor(i / cols);
const col    = i % cols;
const nx     = (col / cols - 0.5) * size;
const nz     = (row / cols - 0.5) * size;

const t      = time * 0.8;
const wave1  = Math.sin(nx * freq * 0.12 + t * 1.1) * amp;
const wave2  = Math.sin(nz * freq * 0.14 + t * 0.9) * amp * 0.7;
const wave3  = Math.sin((nx + nz) * freq * 0.08 + t * 1.4) * amp * 0.5;
const turb   = Math.sin(nx * 0.3 + t * 2.1) * Math.cos(nz * 0.27 + t * 1.8) * chaos;

const y      = wave1 + wave2 + wave3 + turb;
const crest  = Math.max(0.0, y / (amp * 2.5));

target.set(nx, y, nz);

const hue = 0.52 + crest * 0.08 + Math.sin(t + nx * 0.05) * 0.03;
const lit  = 0.25 + crest * 0.45;
color.setHSL(Math.min(0.7, hue), 0.9, Math.min(0.85, lit));

if (i === 0) {
  setInfo("Plasma Ocean", "Superposed wave interference on a 2D particle grid — crests glow white, troughs deep blue.");
}`,
  },

  {
    id: 'nebula',
    name: '✨ Cosmic Nebula',
    description: 'A stellar nursery with pillar structures, ionized gas, and star formation.',
    code: `const scale  = addControl("scale",  "Nebula Size",  20, 120, 65);
const pillars = Math.round(addControl("pillars", "Pillars",  2, 8, 4));
const glow   = addControl("glow",   "Ionization",   0,  3,   1.2);
const drift  = addControl("drift",  "Gas Drift",    0,  2,   0.5);

const norm   = i / count;
const pillar = Math.floor(norm * pillars);
const pFrac  = (norm * pillars) % 1.0;
const pAng   = (pillar / pillars) * Math.PI * 2.0 + time * drift * 0.1;

const base   = scale * 0.35;
const px     = Math.cos(pAng) * base;
const pz     = Math.sin(pAng) * base;

const height = pFrac * scale * 1.1;
const taper  = (1.0 - pFrac * 0.7) * scale * 0.18;
const gasAng = pFrac * 8.0 + time * drift + pillar * 1.3;
const rand   = Math.sin(i * 53.7) * taper;
const rand2  = Math.cos(i * 97.1) * taper * 0.5;
const rand3  = Math.sin(i * 31.4) * taper;

target.set(
  px + Math.cos(gasAng) * rand,
  height - scale * 0.5 + rand2,
  pz + Math.sin(gasAng) * rand3
);

const ionized = Math.max(0, Math.sin(pFrac * Math.PI)) * glow;
const hue = 0.65 + pillar * 0.05 + ionized * 0.15 + time * 0.01;
const lit = 0.15 + ionized * 0.45 + pFrac * 0.1;
color.setHSL(hue % 1.0, 1.0, Math.min(0.9, lit));

if (i === 0) {
  setInfo("Cosmic Nebula", "Stellar nursery pillars — dense gas columns where new stars are born, lit by ultraviolet radiation.");
}`,
  },
];

export const DEFAULT_PRESET = PRESETS[0];
