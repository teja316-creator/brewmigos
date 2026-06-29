import * as THREE from 'three';

const canvas = document.getElementById('hero-canvas');
if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  initCookieScene(canvas);
}

function initCookieScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 2, 8);
  camera.lookAt(0, 0, 0);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  // Lights
  scene.add(new THREE.AmbientLight(0xFFDDB0, 0.55));
  const sun = new THREE.DirectionalLight(0xFFF5D8, 1.5);
  sun.position.set(4, 8, 6);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xC98A3C, 0.6);
  rim.position.set(-5, 1, -3);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xFFE8CC, 0.25);
  fill.position.set(0, -4, 5);
  scene.add(fill);

  // Cookie group — offset right so it sits beside hero text
  const cookieGroup = new THREE.Group();
  cookieGroup.position.set(1.8, 0, 0);
  scene.add(cookieGroup);

  // Cookie surface texture (procedural)
  function makeCookieTex() {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#B8743A';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2500; i++) {
      const x = Math.random() * 512, y = Math.random() * 512;
      const r = Math.random() * 2.5 + 0.5;
      const v = (Math.random() - 0.5) * 40;
      ctx.fillStyle = `rgba(${Math.max(0, 184 + v)},${Math.max(0, 116 + v)},${Math.max(0, 58 + v)},0.35)`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE.CanvasTexture(c);
  }

  const cookieTex = makeCookieTex();
  const cookieMat = new THREE.MeshStandardMaterial({
    color: 0xCC8E4E,
    map: cookieTex,
    roughness: 0.87,
    metalness: 0.0,
  });

  // Cookie body
  const bodyGeo = new THREE.CylinderGeometry(2.2, 2.1, 0.32, 64);
  const cookieBody = new THREE.Mesh(bodyGeo, cookieMat);
  cookieGroup.add(cookieBody);

  // Subtle top-edge torus for rim definition
  const rimGeo = new THREE.TorusGeometry(2.14, 0.035, 8, 64);
  const rimMesh = new THREE.Mesh(rimGeo, new THREE.MeshStandardMaterial({ color: 0x9A5C28, roughness: 0.9 }));
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = 0.15;
  cookieGroup.add(rimMesh);

  // Chocolate chips
  const chipMats = [
    new THREE.MeshStandardMaterial({ color: 0x261008, roughness: 0.45, metalness: 0.12 }),
    new THREE.MeshStandardMaterial({ color: 0xD8AE56, roughness: 0.55, metalness: 0.06 }),
    new THREE.MeshStandardMaterial({ color: 0x1A0A06, roughness: 0.4, metalness: 0.18 }),
  ];
  for (let i = 0; i < 17; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.sqrt(Math.random()) * 1.78;
    const r = 0.08 + Math.random() * 0.065;
    const chip = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), chipMats[i % 3]);
    chip.position.set(Math.cos(a) * d, 0.16 + r * 0.45, Math.sin(a) * d);
    chip.scale.y = 0.52;
    cookieGroup.add(chip);
  }

  // === FRACTURE PIECES ===
  const fractureGroup = new THREE.Group();
  fractureGroup.position.copy(cookieGroup.position);
  fractureGroup.visible = false;
  scene.add(fractureGroup);

  const N_PIECES = 10;
  const fracturePieces = [];

  // Random-width sectors that sum to 2π
  const widths = Array.from({ length: N_PIECES }, () => 0.65 + Math.random() * 0.7);
  const totalW = widths.reduce((a, b) => a + b, 0);
  const sectorAngles = [0];
  widths.forEach(w => sectorAngles.push(sectorAngles[sectorAngles.length - 1] + (w / totalW) * Math.PI * 2));

  for (let i = 0; i < N_PIECES; i++) {
    const a0 = sectorAngles[i], a1 = sectorAngles[i + 1];
    const segs = Math.max(3, Math.ceil(((a1 - a0) / (Math.PI * 2)) * 32));
    const geo = new THREE.CylinderGeometry(2.2, 2.1, 0.32, segs, 1, false, a0, a1 - a0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xCC8E4E,
      roughness: 0.87,
      transparent: true,
      opacity: 1,
    });
    const piece = new THREE.Mesh(geo, mat);
    piece.userData.midAngle = (a0 + a1) / 2;
    fracturePieces.push(piece);
    fractureGroup.add(piece);
  }

  // === ACTION CARDS ===
  const cardGroup = new THREE.Group();
  cardGroup.position.copy(cookieGroup.position);
  cardGroup.visible = false;
  scene.add(cardGroup);

  function makeCardTex(label, bg, fg) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 200;
    const ctx = c.getContext('2d');
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 16;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(6, 6, 500, 188, 20);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = fg;
    ctx.font = 'bold 44px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 256, 100);
    return new THREE.CanvasTexture(c);
  }

  const cardGeo = new THREE.PlaneGeometry(2.7, 1.05);

  const preCard = new THREE.Mesh(cardGeo, new THREE.MeshBasicMaterial({
    map: makeCardTex('Pre-order 12 Jul', '#C98A3C', '#160C08'),
    transparent: true, opacity: 0, side: THREE.DoubleSide,
  }));
  preCard.position.set(-1.55, 0.25, 0.3);
  preCard.rotation.y = 0.18;
  preCard.userData.action = 'preorder';
  cardGroup.add(preCard);

  const igCard = new THREE.Mesh(cardGeo, new THREE.MeshBasicMaterial({
    map: makeCardTex('@brewmigos4u', '#F3E3C3', '#2A1410'),
    transparent: true, opacity: 0, side: THREE.DoubleSide,
  }));
  igCard.position.set(1.55, 0.25, 0.3);
  igCard.rotation.y = -0.18;
  igCard.userData.action = 'instagram';
  cardGroup.add(igCard);

  // Raycaster for card click
  const raycaster = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  canvas.addEventListener('click', e => {
    if (!cardGroup.visible) return;
    const rect = canvas.getBoundingClientRect();
    ptr.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ptr.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ptr, camera);
    const hits = raycaster.intersectObjects([preCard, igCard]);
    if (!hits.length) return;
    const action = hits[0].object.userData.action;
    if (action === 'preorder') document.querySelector('[data-preorder-open]')?.click();
    if (action === 'instagram') window.open('https://www.instagram.com/brewmigos4u', '_blank', 'noopener');
  });

  // === MOUSE PARALLAX ===
  let mxN = 0, myN = 0, tiltX = 0, tiltY = 0;
  window.addEventListener('mousemove', e => {
    mxN = (e.clientX / window.innerWidth - 0.5) * 2;
    myN = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // === BREAK ANIMATION ===
  let breaking = false;

  function triggerBreak() {
    if (breaking || !window.gsap) return;
    breaking = true;
    const gsap = window.gsap;

    fractureGroup.rotation.copy(cookieGroup.rotation);
    fractureGroup.visible = true;
    cookieGroup.visible = false;

    fracturePieces.forEach(piece => {
      const ang = piece.userData.midAngle;
      const dist = 3.2 + Math.random() * 1.6;
      gsap.to(piece.position, {
        x: Math.cos(ang) * dist,
        y: 1.0 + Math.random() * 2.2,
        z: Math.sin(ang) * 1.6 + (Math.random() - 0.5),
        duration: 0.85 + Math.random() * 0.1,
        ease: 'power2.in',
        delay: Math.random() * 0.04,
      });
      gsap.to(piece.rotation, {
        x: (Math.random() - 0.5) * Math.PI * 2.5,
        y: (Math.random() - 0.5) * Math.PI * 2.5,
        z: (Math.random() - 0.5) * Math.PI,
        duration: 0.85,
        ease: 'power2.in',
      });
      gsap.to(piece.material, {
        opacity: 0,
        duration: 0.55,
        delay: 0.28 + Math.random() * 0.08,
        ease: 'power1.in',
      });
    });

    setTimeout(() => {
      cardGroup.visible = true;
      canvas.style.pointerEvents = 'auto'; // enable canvas clicks for 3D cards
      gsap.to(preCard.material, { opacity: 1, duration: 0.5, ease: 'power2.out' });
      gsap.to(igCard.material, { opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.1 });
      gsap.from(preCard.position, { x: 0, y: 0, duration: 0.65, ease: 'back.out(1.6)' });
      gsap.from(igCard.position, { x: 0, y: 0, duration: 0.65, ease: 'back.out(1.6)', delay: 0.08 });
      setTimeout(resetScene, 3000);
    }, 700);
  }

  function resetScene() {
    const gsap = window.gsap;
    if (gsap) {
      gsap.to([preCard.material, igCard.material], { opacity: 0, duration: 0.3, onComplete: doReset });
    } else {
      doReset();
    }
    function doReset() {
      canvas.style.pointerEvents = 'none'; // restore pass-through
      cardGroup.visible = false;
      fractureGroup.visible = false;
      fracturePieces.forEach(p => {
        p.position.set(0, 0, 0);
        p.rotation.set(0, 0, 0);
        p.material.opacity = 1;
      });
      cookieGroup.visible = true;
      breaking = false;
    }
  }

  // Pre-order buttons trigger the break (capture phase so modal doesn't block us)
  document.addEventListener('click', e => {
    if (e.target.closest('[data-preorder-open]') && !breaking) {
      triggerBreak();
    }
  }, { capture: false });

  // === ANIMATION LOOP ===
  let raf;
  const clock = new THREE.Clock();

  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (!breaking && cookieGroup.visible) {
      cookieGroup.rotation.y += 0.003;
      cookieGroup.position.y = Math.sin(t * (Math.PI * 2 / 3.5)) * 0.1;
      tiltX += (-myN * 0.2 - tiltX) * 0.05;
      tiltY += (mxN * 0.15 - tiltY) * 0.05;
      cookieGroup.rotation.x = tiltX;
    }

    if (cardGroup.visible) {
      preCard.position.y = 0.25 + Math.sin(t * 1.4) * 0.1;
      igCard.position.y = 0.25 + Math.sin(t * 1.4 + Math.PI) * 0.1;
    }

    renderer.render(scene, camera);
  }

  animate();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else animate();
  });
}
