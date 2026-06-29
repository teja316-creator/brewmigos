import * as THREE from 'three';

const canvas = document.getElementById('gallery-canvas');
if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  initGallery(canvas);
}

function initGallery(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x160C08, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x160C08);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 50);
  camera.position.set(0, 0, 0);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  scene.add(new THREE.AmbientLight(0xFFEECC, 0.9));
  const spot = new THREE.DirectionalLight(0xFFFFFF, 0.6);
  spot.position.set(0, 5, -4);
  scene.add(spot);

  // 9 photos to display in the 3D gallery
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
  ];

  const loader = new THREE.TextureLoader();
  const galleryGroup = new THREE.Group();
  scene.add(galleryGroup);

  const RADIUS = 4.5;
  const COL_ANGLES = [-0.42, 0, 0.42];   // horizontal spread (radians)
  const ROW_ANGLES = [-0.28, 0, 0.28];   // vertical spread
  const planes = [];

  // Gold border frame texture
  function makeFrameTex(photoTex, hasBorder) {
    const mat = new THREE.MeshStandardMaterial({
      map: photoTex,
      roughness: 0.6,
      metalness: 0.05,
      envMapIntensity: 0.3,
    });
    return mat;
  }

  PHOTOS.forEach((src, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const theta = COL_ANGLES[col]; // left-right angle
    const phi = ROW_ANGLES[row];   // up-down angle

    // Position on inner sphere surface (photos face camera/center)
    const x = RADIUS * Math.sin(theta) * Math.cos(phi);
    const y = RADIUS * Math.sin(phi);
    const z = -RADIUS * Math.cos(theta) * Math.cos(phi);

    // Plane with slight aspect ratio taller
    const planeGeo = new THREE.PlaneGeometry(1.35, 1.5);
    const mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 });
    const plane = new THREE.Mesh(planeGeo, mat);

    plane.position.set(x, y, z);
    plane.lookAt(0, 0, 0);
    plane.userData.src = src;
    plane.userData.idx = idx;

    galleryGroup.add(plane);
    planes.push(plane);

    // Load texture and replace material
    loader.load(src, tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      plane.material = makeFrameTex(tex);
      plane.material.needsUpdate = true;
    });

    // Gold border mesh (slightly larger, behind plane)
    const borderGeo = new THREE.PlaneGeometry(1.42, 1.57);
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0xC98A3C,
      roughness: 0.3,
      metalness: 0.6,
    });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.set(x, y, z - 0.008);
    border.lookAt(0, 0, 0);
    border.translateZ(-0.01);
    galleryGroup.add(border);
  });

  // === DRAG / INERTIA ===
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
    groupRotY += dx * 0.005;
    velY = dx * 0.005;
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

  // === HOVER DETECTION ===
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

  // === CLICK → LIGHTBOX ===
  canvas.addEventListener('click', e => {
    if (dragDeltaX > 8 || !hoveredPlane) return;
    document.dispatchEvent(new CustomEvent('gallery-3d-click', {
      detail: { src: hoveredPlane.userData.src, idx: hoveredPlane.userData.idx },
    }));
  });

  // === ANIMATION LOOP ===
  let raf;
  const clock = new THREE.Clock();

  function animate() {
    raf = requestAnimationFrame(animate);
    clock.getDelta();

    // Inertia
    if (!isDragging) {
      groupRotY += velY;
      velY *= 0.92;
    }
    galleryGroup.rotation.y = groupRotY;

    // Hover scale
    planes.forEach(p => {
      const target = p === hoveredPlane ? 1.08 : 1.0;
      p.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
    });

    renderer.render(scene, camera);
  }

  animate();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else animate();
  });
}
