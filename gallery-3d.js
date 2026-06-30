import * as THREE from 'three';

const canvas = document.getElementById('gallery-canvas');
if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  initCarousel(canvas);
}

// Photos arranged evenly around the carousel ring
const PHOTOS = [
  'assets/PHOTO-2026-06-29-11-44-33.jpg',
  'assets/PHOTO-2026-06-29-11-44-33%202.jpg',
  'assets/PHOTO-2026-06-29-11-44-33%203.jpg',
  'assets/PHOTO-2026-06-29-11-44-33%204.jpg',
  'assets/PHOTO-2026-06-29-11-44-33%205.jpg',
  'assets/PHOTO-2026-06-29-11-44-33%206.jpg',
  'assets/PHOTO-2026-06-29-11-44-35.jpg',
  'assets/PHOTO-2026-06-29-11-44-35%202.jpg',
  'assets/PHOTO-2026-06-29-11-44-35%203.jpg',
  'assets/PHOTO-2026-06-29-11-44-35%204.jpg',
  'assets/PHOTO-2026-06-29-11-44-35%205.jpg',
  'assets/PHOTO-2026-06-29-11-44-35%206.jpg',
];

// Exposed so ui.js's lightbox handler can match the same photo set/order
window.__brewmigosGalleryPhotos = PHOTOS;

function initCarousel(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x160C08, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x160C08);

  const RADIUS = 5;
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
  camera.position.set(0, 0, RADIUS + 3.4);
  camera.lookAt(0, 0, 0);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  scene.add(new THREE.AmbientLight(0xFFEECC, 0.95));
  const key = new THREE.DirectionalLight(0xFFFFFF, 0.5);
  key.position.set(0, 4, 8);
  scene.add(key);

  // ── Carousel ring ──────────────────────────────────────────────────────
  const ringGroup = new THREE.Group();
  scene.add(ringGroup);

  const N = PHOTOS.length;
  const PLANE_W = 1.7, PLANE_H = 1.9;
  const loader = new THREE.TextureLoader();
  const planes = [];

  PHOTOS.forEach((src, i) => {
    const theta = (i / N) * Math.PI * 2;
    const x = Math.sin(theta) * RADIUS;
    const z = Math.cos(theta) * RADIUS;

    const geo = new THREE.PlaneGeometry(PLANE_W, PLANE_H);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4E2718, roughness: 0.6 });
    const plane = new THREE.Mesh(geo, mat);

    plane.position.set(x, 0, z);
    plane.rotation.y = theta; // face outward, away from the ring axis
    plane.userData.src = src;
    plane.userData.idx = i;
    plane.userData.theta = theta;

    ringGroup.add(plane);
    planes.push(plane);

    loader.load(src, tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      plane.material = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.04 });
      plane.material.needsUpdate = true;
    });

    // Thin gold frame behind each photo
    const frameGeo = new THREE.PlaneGeometry(PLANE_W + 0.09, PLANE_H + 0.09);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xC98A3C, roughness: 0.35, metalness: 0.5 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(x, 0, z);
    frame.rotation.y = theta;
    frame.translateZ(-0.012);
    ringGroup.add(frame);
  });

  // ── Drag / inertia ───────────────────────────────────────────────────────
  const AUTO_SPEED = 0.0022;
  let isDragging = false;
  let lastX = 0;
  let velY = 0;
  let dragDeltaX = 0;
  let hoveredPlane = null;
  let groupRotY = 0;

  function pointerDown(x) {
    isDragging = true;
    lastX = x;
    velY = 0;
    dragDeltaX = 0;
    canvas.style.cursor = 'grabbing';
  }
  function pointerMove(x) {
    if (!isDragging) return;
    const dx = x - lastX;
    dragDeltaX += Math.abs(dx);
    groupRotY += dx * 0.006;
    velY = dx * 0.006;
    lastX = x;
  }
  function pointerUp() {
    isDragging = false;
    canvas.style.cursor = 'grab';
  }

  canvas.addEventListener('mousedown',  e => pointerDown(e.clientX));
  canvas.addEventListener('mousemove',  e => { pointerMove(e.clientX); updateHover(e); });
  canvas.addEventListener('mouseup',    pointerUp);
  canvas.addEventListener('mouseleave', pointerUp);
  canvas.addEventListener('touchstart', e => pointerDown(e.touches[0].clientX), { passive: true });
  canvas.addEventListener('touchmove',  e => pointerMove(e.touches[0].clientX), { passive: true });
  canvas.addEventListener('touchend',   pointerUp);

  // ── Hover detection ──────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ptr = new THREE.Vector2();

  function updateHover(e) {
    if (isDragging) { hoveredPlane = null; return; }
    const rect = canvas.getBoundingClientRect();
    ptr.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ptr.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ptr, camera);
    const hits = raycaster.intersectObjects(planes);
    hoveredPlane = hits.length ? hits[0].object : null;
    canvas.style.cursor = hoveredPlane ? 'pointer' : (isDragging ? 'grabbing' : 'grab');
  }

  // ── Click → lightbox ─────────────────────────────────────────────────────
  canvas.addEventListener('click', e => {
    if (dragDeltaX > 8 || !hoveredPlane) return;
    document.dispatchEvent(new CustomEvent('gallery-3d-click', {
      detail: { src: hoveredPlane.userData.src, idx: hoveredPlane.userData.idx },
    }));
  });

  // ── Animation loop ───────────────────────────────────────────────────────
  let raf;

  function animate() {
    raf = requestAnimationFrame(animate);

    if (!isDragging) {
      groupRotY += AUTO_SPEED + velY;
      velY *= 0.92;
    }
    ringGroup.rotation.y = groupRotY;

    // Highlight whichever plane currently faces the camera
    let frontPlane = null, bestDot = -Infinity;
    const camDir = new THREE.Vector3();
    planes.forEach(p => {
      p.getWorldDirection(camDir);
      const dot = camDir.z; // world-space outward normal vs. camera axis (+Z)
      if (dot > bestDot) { bestDot = dot; frontPlane = p; }
    });

    planes.forEach(p => {
      const target = (p === hoveredPlane || p === frontPlane) ? 1.12 : 1.0;
      p.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
    });

    renderer.render(scene, camera);
  }

  animate();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else animate();
  });
}
