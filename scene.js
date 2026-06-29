import * as THREE from 'three';

const canvas = document.getElementById('hero-canvas');
if (!canvas) throw new Error('No hero canvas');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
camera.position.set(0, 0, 5);

// ── Particle system ──────────────────────
const COUNT = 280;
const positions = new Float32Array(COUNT * 3);
const speeds    = new Float32Array(COUNT);
const offsets   = new Float32Array(COUNT);
const sizes     = new Float32Array(COUNT);

for (let i = 0; i < COUNT; i++) {
  positions[i * 3]     = (Math.random() - 0.5) * 14;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 8 - 4;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
  speeds[i]   = 0.003 + Math.random() * 0.005;
  offsets[i]  = Math.random() * Math.PI * 2;
  sizes[i]    = 2.5 + Math.random() * 4;
}

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const mat = new THREE.ShaderMaterial({
  uniforms: {
    uTime:  { value: 0 },
    uColor: { value: new THREE.Color(0xC68642) },
  },
  vertexShader: /* glsl */ `
    attribute float size;
    uniform float uTime;
    varying float vAlpha;

    void main() {
      vec3 pos = position;
      pos.y += uTime * 0.4;
      pos.y = mod(pos.y + 4.0, 8.0) - 4.0;
      pos.x += sin(uTime * 0.7 + pos.y * 0.8) * 0.18;

      vAlpha = 0.15 + 0.45 * (0.5 + 0.5 * sin(uTime * 1.2 + pos.z * 3.0));

      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = size * (280.0 / -mvPos.z);
      gl_Position  = projectionMatrix * mvPos;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    varying float vAlpha;

    void main() {
      float d = length(gl_PointCoord - 0.5) * 2.0;
      if (d > 1.0) discard;
      float alpha = vAlpha * smoothstep(1.0, 0.0, d);
      gl_FragColor = vec4(uColor, alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
});

const points = new THREE.Points(geo, mat);
scene.add(points);

// ── Ambient glow ─────────────────────────
const glowGeo = new THREE.PlaneGeometry(6, 6);
const glowMat = new THREE.MeshBasicMaterial({
  color: 0x3D1C02,
  transparent: true,
  opacity: 0.25,
  side: THREE.DoubleSide,
});
const glow = new THREE.Mesh(glowGeo, glowMat);
glow.position.z = -0.5;
scene.add(glow);

// ── Resize ───────────────────────────────
function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resize();
const ro = new ResizeObserver(resize);
ro.observe(canvas);

// ── Mouse parallax ───────────────────────
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

window.addEventListener('mousemove', e => {
  mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

// ── Animate ──────────────────────────────
let raf;
function animate(t) {
  raf = requestAnimationFrame(animate);
  const elapsed = t * 0.001;

  mat.uniforms.uTime.value = elapsed;

  targetX += (mouseX * 0.3 - targetX) * 0.04;
  targetY += (-mouseY * 0.2 - targetY) * 0.04;
  points.rotation.x = targetY;
  points.rotation.y = targetX;

  glow.rotation.z = elapsed * 0.06;

  renderer.render(scene, camera);
}
animate(0);

// ── Pause when hidden ────────────────────
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelAnimationFrame(raf);
  else animate(performance.now());
});
