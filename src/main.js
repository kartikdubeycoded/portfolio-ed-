import './style.css';
import './smash.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { initCursor } from './cursor.js';

// Initialize custom wavy canvas cursor trail
initCursor();
import {
  EffectComposer, RenderPass, EffectPass,
  BloomEffect, VignetteEffect, NoiseEffect, SMAAEffect, SMAAPreset, BlendFunction,
} from 'postprocessing';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { details } from './data.js';

gsap.registerPlugin(ScrollTrigger);

/* =============================================================
   Kartik Dubey — "navigating the system."
   A single astronaut (you) floats through a clean cream space.
   Scroll drifts him between waypoints; grab him to spin 360°.
   Vanilla three.js · IBL-lit PBR · pmndrs filmic post.
   ============================================================= */

// ---------- Smooth scroll (heavy, buttery glide — expo decel) ----------
const lenis = new Lenis({
  duration: 1.3,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 0.95,
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

// ---------- Section snap: scrolling settles on each section ----------
let snapT, snapping = false;
function snapToNearest() {
  if (snapping || document.getElementById('window').classList.contains('is-open')) return;
  const panels = [...document.querySelectorAll('.panel')];
  const y = lenis.scroll ?? window.scrollY, vh = window.innerHeight;
  let best = null, bd = 1e9;
  for (const p of panels) { const target = p.offsetTop + p.offsetHeight / 2 - vh / 2; const d = Math.abs(target - y); if (d < bd) { bd = d; best = target; } }
  if (best != null && bd > 8) {
    snapping = true;
    lenis.scrollTo(best, { duration: 0.7, easing: (t) => 1 - Math.pow(1 - t, 3) });
    setTimeout(() => { snapping = false; }, 780);
  }
}
lenis.on('scroll', () => { clearTimeout(snapT); snapT = setTimeout(snapToNearest, 170); });

// ---------- Dossier window (pops out from the clicked element) ----------
const win = document.getElementById('window');
const winId = document.getElementById('window-id');
const winTitle = document.getElementById('window-title');
const winBody = document.getElementById('window-body');
const winPanel = win.querySelector('.window-panel');
function openDoc(key, originEl) {
  const d = details[key]; if (!d) return;
  winId.textContent = 'DOC · ' + key;
  winTitle.textContent = d.title;
  winBody.innerHTML = `<div class="win-doc"><span class="doc-tag">${d.tag}</span>${d.body}</div>`;
  winBody.scrollTop = 0;
  win.classList.add('is-open'); win.setAttribute('aria-hidden', 'false'); lenis.stop();

  // pop the panel out FROM the thing you clicked → grow to center
  const o = originEl ? originEl.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  const cx = o.left + o.width / 2 - innerWidth / 2;
  const cy = o.top + o.height / 2 - innerHeight / 2;
  gsap.fromTo(winPanel,
    { x: cx * 0.6, y: cy * 0.6, scale: 0.5, opacity: 0, filter: 'blur(14px)' },
    { x: 0, y: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.62, ease: 'expo.out' });
}
function closeWindow() {
  win.setAttribute('aria-hidden', 'true'); lenis.start();
  gsap.to(winPanel, { scale: 0.7, opacity: 0, filter: 'blur(10px)', duration: 0.3, ease: 'power2.in',
    onComplete: () => { win.classList.remove('is-open'); gsap.set(winPanel, { clearProps: 'all' }); } });
}
document.querySelectorAll('[data-doc]').forEach((el) => el.addEventListener('click', () => openDoc(el.dataset.doc, el)));
win.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeWindow));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeWindow(); });

// ---------- Boot (the katti·os cold-start) ----------
const boot = document.getElementById('boot');
const bootLog = document.getElementById('boot-log');
const bootBar = boot.querySelector('.boot-bar span');
const bootPct = document.getElementById('boot-pct');
const bootSeq = ['booting katti·os', 'mounting memory core', 'waking agent council', 'linking data bus', 'loading kartik.dubey', 'system online'];
let bi = 0;
function pushBootLine() {
  if (bi >= bootSeq.length) return;
  const final = bi === bootSeq.length - 1;
  const row = document.createElement('div');
  row.className = 'boot-row' + (final ? ' boot-row--final' : '');
  row.innerHTML = `<span class="bt">${bootSeq[bi]}</span><span class="bk">${final ? '●' : 'ok'}</span>`;
  bootLog.appendChild(row);
  bi++;
  if (bi < bootSeq.length) setTimeout(pushBootLine, 380);
}
pushBootLine();
const bootProg = { v: 0 };
gsap.to(bootProg, {
  v: 100, duration: 2.4, ease: 'power2.inOut',
  onUpdate: () => { const p = Math.round(bootProg.v); bootBar.style.width = p + '%'; bootPct.textContent = String(p).padStart(2, '0'); },
  onComplete: () => { setTimeout(() => boot.classList.add('is-done'), 380); },
});

// ===========================================================
// THE WORLD — a cream void with one floating astronaut.
// ===========================================================
const canvas = document.getElementById('ball');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));  // crisp / retina-4K
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const CREAM = 0xF4F1EA;
const scene = new THREE.Scene();
scene.background = new THREE.Color(CREAM);
scene.fog = new THREE.Fog(CREAM, 8, 26);

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(0, 0, 7.2);

// image-based lighting → makes the PBR materials read "rendered"
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// shaping light + soft fill (gives the suit form and a soft shadow side)
const key = new THREE.DirectionalLight(0xffffff, 3.1); key.position.set(4, 6, 5); scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 1.3); rim.position.set(-5, 2, -4); scene.add(rim);
scene.add(new THREE.AmbientLight(0xffffff, 0.22));   // lower fill → clearer lit/shadow form

// ===========================================================
// THE SOLAR SYSTEM — realistic textured worlds, one per section.
// As you scroll, the system turns: the active planet sits big-center;
// the previous slides left + shrinks, the next enters from the right.
// Textures: solarsystemscope.com, CC BY 4.0 (see CREDITS.md).
// ===========================================================
const SPACING = 6.4;                          // horizontal gap between planets
const planetSpecs = [
  { name: 'hero',       tex: '/textures/earth.jpg',   r: 1.9, spin: 0.0,  tilt: 0.41, earth: true },
  { name: 'about',      tex: '/textures/mars.jpg',    r: 1.4, spin: 0.12, tilt: 0.44 },
  { name: 'experience', tex: '/textures/jupiter.jpg', r: 2.2, spin: 0.08, tilt: 0.05 },
  { name: 'projects',   tex: '/textures/saturn.jpg',  r: 1.7, spin: 0.09, tilt: 0.47, ring: '/textures/saturn_ring.png' },
  { name: 'contact',    tex: '/textures/neptune.jpg', r: 1.6, spin: 0.11, tilt: 0.5 },
];

const texLoader = new THREE.TextureLoader();
const maxAniso = renderer.capabilities.getMaxAnisotropy();
const loadTex = (f) => { const t = texLoader.load(f); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t; };

// lat/lon → a point on a sphere of the given radius (three.js default UV convention)
function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta),
  );
}
const EARTH_ROT = 3.05;                         // spins Earth so INDIA faces the camera (tuned)

const cosmos = new THREE.Group();
scene.add(cosmos);

const planets = planetSpecs.map((s) => {
  const g = new THREE.Group();
  g.rotation.z = s.tilt;                        // axial tilt

  const spinner = new THREE.Group(); g.add(spinner);   // the planet body self-rotates
  const surfaceMat = new THREE.MeshStandardMaterial({ map: loadTex(s.tex), roughness: 1.0, metalness: 0.0 });
  if (s.earth) {
    // city lights on the dark side: emissive map reads bright only where the surface
    // is unlit (the lit day side washes it out) — night glow without a custom shader.
    surfaceMat.emissiveMap = loadTex('/textures/earth_night.jpg');
    surfaceMat.emissive = new THREE.Color(0xffe7b0);
    surfaceMat.emissiveIntensity = 0.55;
  }
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(s.r, 128, 96), surfaceMat);
  spinner.add(mesh);

  let clouds = null, marker = null;
  if (s.earth) {
    spinner.rotation.y = EARTH_ROT;             // India to the front

    // drifting cloud shell
    const cloudTex = loadTex('/textures/earth_clouds.jpg');
    clouds = new THREE.Mesh(
      new THREE.SphereGeometry(s.r * 1.012, 96, 64),
      new THREE.MeshStandardMaterial({ map: cloudTex, alphaMap: cloudTex, transparent: true, depthWrite: false, opacity: 0.9, roughness: 1 }),
    );
    spinner.add(clouds);

    // soft blue atmosphere halo (back-side additive rim)
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(s.r * 1.06, 64, 48),
      new THREE.MeshBasicMaterial({ color: 0x6aa8ff, transparent: true, opacity: 0.12, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    g.add(atmo);

    // Mumbai marker (rides with the surface) — origin of the data line to "Kartik"
    marker = new THREE.Object3D();
    marker.position.copy(latLonToVec3(19.076, 72.877, s.r * 1.02));
    spinner.add(marker);
    // (the visible beacon is the CSS .ping element, tracked to this marker on screen)
  }

  if (s.ring) {
    const inner = s.r * 1.35, outer = s.r * 2.25;
    const ringGeo = new THREE.RingGeometry(inner, outer, 128);
    // remap UVs so the ring strip texture runs radially (default ring UVs don't)
    const pos = ringGeo.attributes.position, uv = ringGeo.attributes.uv, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); const r = v.length(); uv.setXY(i, (r - inner) / (outer - inner), 0.5); }
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ map: loadTex(s.ring), side: THREE.DoubleSide, transparent: true, roughness: 1.0 }));
    ring.rotation.x = Math.PI * 0.5 - 0.16;
    g.add(ring);
  }

  cosmos.add(g);
  return { g, spinner, clouds, marker, spin: s.spin };
});
let cosmosPos = 0;                              // smoothed scroll position through the system
const pingEl = document.getElementById('ping');
const _pv = new THREE.Vector3();               // scratch for the Mumbai ping projection

// ---- the astronaut ----
// SHELVED for now (Katti's call): the whole astronaut — model, swim/float motion,
// grab-to-spin, tap-to-wave — stays in this file behind this flag so it can be
// switched back on for a future animation pass. Set to true to bring him back.
const USE_ASTRONAUT = false;

const pivot = new THREE.Group();            // we spin THIS on drag
const drift = new THREE.Group();            // scroll moves THIS across the space
drift.add(pivot); scene.add(drift);

let mixer = null, actions = {}, current = null, astronaut = null, ready = false;
function play(name, { loop = true, fade = 0.4 } = {}) {
  const next = actions[name]; if (!next || next === current) return;
  next.reset();
  next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
  next.clampWhenFinished = !loop;
  next.fadeIn(fade).play();
  if (current) current.fadeOut(fade);
  current = next;
}

// Astronaut: "Animated Floating Astronaut in Space Suit Loop" by LasquetiSpice,
// CC BY 4.0 — https://sketchfab.com/3d-models/animated-floating-astronaut-in-space-suit-loop-e2c4b146e58141e4b87917456a9970b1
// (compressed via @gltf-transform). See CREDITS.md.
const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
const gltf = new GLTFLoader();
gltf.setDRACOLoader(draco);
if (USE_ASTRONAUT) gltf.load('/astronaut.glb', (g) => {
  astronaut = g.scene;
  // scale to a friendly height first
  const box = new THREE.Box3().setFromObject(astronaut);
  const size = new THREE.Vector3(); box.getSize(size);
  const s = 2.2 / size.y; astronaut.scale.setScalar(s);
  pivot.add(astronaut);

  mixer = new THREE.AnimationMixer(astronaut);
  g.animations.forEach((clip) => { actions[clip.name] = mixer.clipAction(clip); });
  play('floating');
  // recenter using the ANIMATED pose (the float clip has root motion that
  // would otherwise lift him out of frame) → put his visual center at origin
  mixer.update(0);
  const b2 = new THREE.Box3().setFromObject(astronaut);
  const c2 = new THREE.Vector3(); b2.getCenter(c2);
  astronaut.position.x -= c2.x; astronaut.position.y -= c2.y; astronaut.position.z -= c2.z;

  // Store bone references for bone-wiggling fluid motion
  const bones = {};
  astronaut.traverse((o) => {
    if (o.isBone) {
      bones[o.name] = o;
    }
  });
  astronaut.userData.bones = bones;

  // Capture each driven bone's REST rotation (its pose at this clip frame) so the
  // water-drift motion sets rotation ABSOLUTELY (rest + offset) every frame.
  // Absolute (not +=) means a non-keyframed bone can never accumulate into an
  // infinite spin — the exact failure that made earlier motion read "machine".
  const driveBones = [
    'Hip81', 'Spine_16', 'Spine_27', 'Spine_38', 'neck41', 'head42',
    'L_Clevicle9', 'L_Arm10', 'L_Elbow11', 'L_Wrist12',
    'R_Clevicle43', 'R_Arm44', 'R_Elbow45', 'R_Wrist46',
    'L_Thigh82', 'L_Knee83', 'L_Ankle84',
    'R_Thigh88', 'R_Knee89', 'R_Ankle90',
  ];
  const rest = {};
  driveBones.forEach((n) => { const b = bones[n]; if (b) rest[n] = { x: b.rotation.x, y: b.rotation.y, z: b.rotation.z }; });
  astronaut.userData.rest = rest;

  ready = true;

  // entrance: scale-pop as the boot dissolves
  gsap.from(pivot.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 1.5, ease: 'expo.out', delay: 0.2 });
  spin.y = -1.4; // start turned, idle-eases to front
}, undefined, (err) => console.error('astronaut load failed', err));

// ---- post-processing: filmic finish (pmndrs) ----
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
// threshold ABOVE cream's luminance (~0.94) so the background never blooms (kills the
// haze) — only the bright glowing cores cross it and bloom.
const bloom = new BloomEffect({ intensity: 0.65, luminanceThreshold: 0.96, luminanceSmoothing: 0.08, mipmapBlur: true });
const vignette = new VignetteEffect({ offset: 0.3, darkness: 0.3 });
// SMAA + film-grain dropped for performance — renderer MSAA handles anti-aliasing now.
composer.addPass(new EffectPass(camera, bloom, vignette));

function size() {
  renderer.setSize(innerWidth, innerHeight, false);
  composer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
}
size(); addEventListener('resize', size);

// ---------- Scroll drives where the astronaut drifts ----------
const st = { p: 0 };
ScrollTrigger.create({ trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: 1, onUpdate: (self) => { st.p = self.progress; } });

// pointer tracking — normalized position + raw px speed (for the jiggle)
const mouse = { x: 0, y: 0, px: window.innerWidth / 2, py: window.innerHeight / 2, speed: 0, lastT: performance.now() };
addEventListener('pointermove', (e) => {
  mouse.x = e.clientX / innerWidth - 0.5;
  mouse.y = -(e.clientY / innerHeight - 0.5);
  const now = performance.now(), dtm = now - mouse.lastT;
  if (dtm > 0) { const dx = e.clientX - mouse.px, dy = e.clientY - mouse.py; mouse.speed = Math.hypot(dx, dy) / dtm; }
  mouse.px = e.clientX; mouse.py = e.clientY; mouse.lastT = now;
});

// content reveals — staggered rise + de-blur as each section enters
gsap.utils.toArray('.panel').forEach((panel) => {
  const items = panel.querySelectorAll('.content > *, .hero-id > *');
  gsap.from(items, { scrollTrigger: { trigger: panel, start: 'top 68%', toggleActions: 'play none none reverse' }, y: 30, opacity: 0, filter: 'blur(8px)', duration: 0.8, stagger: 0.08, ease: 'power3.out' });
});

// rows: each cascades in from the side as the section enters (tactile list feel)
gsap.utils.toArray('.rows').forEach((list) => {
  gsap.from(list.querySelectorAll('.row'), {
    scrollTrigger: { trigger: list, start: 'top 78%', toggleActions: 'play none none reverse' },
    x: -24, opacity: 0, duration: 0.6, stagger: 0.09, ease: 'power3.out',
  });
});

// giant section numerals drift up + fade as their panel enters
gsap.utils.toArray('.panel-num').forEach((num) => {
  gsap.from(num, {
    scrollTrigger: { trigger: num.closest('.panel'), start: 'top 85%', end: 'bottom top', scrub: 1 },
    yPercent: 18, opacity: 0,
  });
});

// ---------- Section rail: active-state tracking + click-to-jump ----------
const railItems = [...document.querySelectorAll('.rail-item')];
const railFor = (step) => railItems.find((r) => r.dataset.rail === step);
gsap.utils.toArray('.panel').forEach((panel, k) => {
  const item = railFor(panel.dataset.step);
  ScrollTrigger.create({
    trigger: panel, start: 'top center', end: 'bottom center',
    onToggle: (self) => {
      if (!self.isActive) return;
      railItems.forEach((r) => r.classList.remove('is-active'));
      if (item) item.classList.add('is-active');
    },
  });
});
railItems.forEach((item) => item.addEventListener('click', (e) => {
  const id = item.getAttribute('href');
  const target = id === '#top' ? 0 : document.querySelector(id);
  if (target === 0 || target) { e.preventDefault(); lenis.scrollTo(target, { duration: 1.0 }); }
}));

// scroll cue fade
const cue = document.getElementById('scroll-cue');
ScrollTrigger.create({ trigger: 'main', start: 'top top', end: '6% top', scrub: 0.4, onUpdate: (s) => { cue.style.opacity = (1 - s.progress).toFixed(2); } });

// ---------- Grab the astronaut → spin him 360° (with a wave hello) ----------
const ray = new THREE.Raycaster();
const ptr = new THREE.Vector2();
let dragging = false, lastX = 0, lastY = 0, velY = 0, velX = 0, waved = false, moved = 0;
const spin = { y: 0, x: 0 };

function hitAstronaut(clientX, clientY) {
  if (!astronaut) return false;
  ptr.x = (clientX / innerWidth) * 2 - 1;
  ptr.y = -(clientY / innerHeight) * 2 + 1;
  ray.setFromCamera(ptr, camera);
  return ray.intersectObject(astronaut, true).length > 0;
}
canvas.addEventListener('pointerdown', (e) => {
  if (!ready || !hitAstronaut(e.clientX, e.clientY)) return;
  dragging = true; lastX = e.clientX; lastY = e.clientY; velY = velX = 0; moved = 0;
  waved = true;                       // stop the pre-touch showcase turn
  if (mixer) mixer.timeScale = 0;     // freeze the bob → spin cleanly in place about his center
  canvas.classList.add('grabbing');
});
addEventListener('pointermove', (e) => {
  if (!dragging) {
    canvas.classList.toggle('grab', ready && hitAstronaut(e.clientX, e.clientY));
    return;
  }
  velY = (e.clientX - lastX) * 0.01; velX = (e.clientY - lastY) * 0.01;
  spin.y += velY; spin.x += velX;     // FULL 360° on both axes — no clamp
  moved += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
  lastX = e.clientX; lastY = e.clientY;
});
addEventListener('pointerup', () => {
  if (!dragging) return;
  dragging = false; canvas.classList.remove('grabbing');
  if (mixer) mixer.timeScale = 1;     // resume life
  if (moved < 6) play('wave', { loop: false, fade: 0.2 });  // a tap (no drag) = he waves hello
  else play('floating');              // a drag = keep the orientation, resume floating
});

// ---------- Render ----------
const clock = new THREE.Clock();
let elapsed = 0;
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt; const t = elapsed;
  if (mixer) mixer.update(dt);

  // when the wave finishes, fall back to floating
  if (current && current.getClip && current.getClip().name === 'wave' && !current.isRunning()) play('floating');

  // jiggle intensity — spikes when the cursor jitters fast, decays smoothly
  mouse.speed *= 0.9;
  const shake = Math.min(mouse.speed * 0.5, 2.4);

  if (astronaut && dragging) {
    // reset velocity on drag
    drift.userData.vx = 0;
    drift.userData.vy = 0;
    // you're spinning him — your input owns the rotation
    pivot.rotation.y += (spin.y - pivot.rotation.y) * 0.45;
    pivot.rotation.x += (spin.x - pivot.rotation.x) * 0.45;
  } else if (astronaut) {
    // ---- He's TOWED by the cursor's string, like a balloon a kid walks with ----
    const tempV = new THREE.Vector3();
    drift.getWorldPosition(tempV);
    tempV.project(camera);
    const astroScreenX = (tempV.x * 0.5 + 0.5) * window.innerWidth;
    const astroScreenY = (-(tempV.y * 0.5) + 0.5) * window.innerHeight;

    // keep a calm string-length of slack behind the cursor (the tether)
    const dx = astroScreenX - mouse.px;
    const dy = astroScreenY - mouse.py;
    const dist = Math.hypot(dx, dy) || 0.1;
    const stringLen = 95;                         // tighter tether → less lag
    const targetX = mouse.px + (dx / dist) * stringLen;
    const targetY = mouse.py + (dy / dist) * stringLen;
    const tx = (targetX / window.innerWidth - 0.5) * 5.0;
    const ty = 0.15 + (-(targetY / window.innerHeight - 0.5)) * 3.0;

    if (drift.userData.vx === undefined) { drift.userData.vx = 0; drift.userData.vy = 0; }
    // Guard: first-frame projection is NaN before the camera matrix exists; skipping
    // keeps that NaN from poisoning his position forever (which made him vanish).
    if (Number.isFinite(tx) && Number.isFinite(ty)) {
      const stiffness = 0.10, damping = 0.16;    // tighter, snappier tow
      drift.userData.vx += (tx - drift.position.x) * stiffness - drift.userData.vx * damping;
      drift.userData.vy += (ty - drift.position.y) * stiffness - drift.userData.vy * damping;
      drift.position.x += drift.userData.vx;
      drift.position.y += drift.userData.vy;
    }

    // ---- ORIENTATION: body stays naturally upright. It does NOT rotate as a
    // rigid whole. Only a few degrees of buoyant idle sway + a LEAN (bank) toward
    // travel — like a diver's body angling into a drift, never a head-first spin.
    const w = t * 0.95;                            // slow, graceful master tempo
    const vx = drift.userData.vx || 0, vy = drift.userData.vy || 0;
    const eA = (cur, target, k) => cur + Math.atan2(Math.sin(target - cur), Math.cos(target - cur)) * k;
    const bankZ = THREE.MathUtils.clamp(-vx * 1.6, -0.16, 0.16) + Math.sin(w * 0.4) * 0.03;
    const bankX = THREE.MathUtils.clamp(vy * 1.3, -0.13, 0.13) + Math.sin(w * 0.33) * 0.025;
    const swayY = Math.sin(w * 0.5) * 0.03;
    pivot.rotation.z = eA(pivot.rotation.z, bankZ, 0.06);
    pivot.rotation.x = eA(pivot.rotation.x, bankX, 0.06);
    pivot.rotation.y = eA(pivot.rotation.y, swayY, 0.05);
    pivot.scale.set(1, 1, 1);                      // no squash — the spine carries the life now

    // ---- DRIFT IN WATER: all life comes from the PARTS, not the body. A slow
    // wave travels up the spine; arms drift out and sway; legs scissor lazily.
    // Each bone is set ABSOLUTELY from its rest pose (rest + sine) so phases stay
    // independent and nothing accumulates. Amplitude lifts a little while moving.
    const waving = current && current.getClip && current.getClip().name === 'wave' && current.isRunning();
    if (ready && astronaut && astronaut.userData.rest && !waving) {
      const B = astronaut.userData.bones, R = astronaut.userData.rest;
      const sp = Math.hypot(vx, vy);
      const drive = 1 + Math.min(sp * 22, 0.8);
      const set = (name, x, y, z) => {
        const bn = B[name], r = R[name]; if (!bn || !r) return;
        bn.rotation.x = r.x + x; bn.rotation.y = r.y + y; bn.rotation.z = r.z + z;
      };
      // spine wave (the core undulation, traveling phase up the chain)
      set('Hip81',    Math.sin(w * 0.6) * 0.03 * drive, 0, Math.sin(w * 0.5) * 0.04 * drive);
      set('Spine_16', Math.sin(w * 0.6 - 0.3) * 0.04 * drive, Math.sin(w * 0.4) * 0.03, Math.sin(w * 0.5 - 0.3) * 0.05 * drive);
      set('Spine_27', Math.sin(w * 0.6 - 0.7) * 0.045 * drive, Math.sin(w * 0.4 - 0.4) * 0.03, Math.sin(w * 0.5 - 0.7) * 0.055 * drive);
      set('Spine_38', Math.sin(w * 0.6 - 1.1) * 0.04 * drive, 0, Math.sin(w * 0.5 - 1.1) * 0.05 * drive);
      set('neck41',   Math.sin(w * 0.6 - 1.5) * 0.05, Math.sin(w * 0.4 - 1.0) * 0.05, Math.sin(w * 0.5 - 1.5) * 0.05);
      set('head42',   Math.sin(w * 0.6 - 1.9) * 0.04, Math.sin(w * 0.4 - 1.4) * 0.06, 0);
      // arms brought DOWN from the model's T-pose to a relaxed float: a touch
      // forward (x), dropped to the sides (z, same sign both arms — these shoulders
      // aren't z-mirrored), with a soft elbow bend. Then a slow independent sway.
      const ARM_FWD = 0.15, ARM_DOWN = -0.95, ELBOW = 0.55;
      const swayL = Math.sin(w * 0.55) * 0.08 * drive, swayR = Math.sin(w * 0.55 + Math.PI) * 0.08 * drive;
      set('L_Clevicle9', 0, 0, Math.sin(w * 0.5) * 0.03);
      set('L_Arm10',  ARM_FWD + swayL, 0, ARM_DOWN);
      set('L_Elbow11', ELBOW + Math.sin(w * 0.55 - 0.6) * 0.10 * drive, 0, 0);
      set('L_Wrist12', 0, 0, Math.sin(w * 0.6) * 0.12);
      set('R_Clevicle43', 0, 0, Math.sin(w * 0.5 + Math.PI) * 0.03);
      set('R_Arm44',  -ARM_FWD + swayR, 0, ARM_DOWN);   // x mirrored, z same sign
      set('R_Elbow45', ELBOW + Math.sin(w * 0.55 + Math.PI - 0.6) * 0.10 * drive, 0, 0);
      set('R_Wrist46', 0, 0, Math.sin(w * 0.6 + 1.0) * 0.12);
      // legs scissor slowly (water, not running)
      set('L_Thigh82', Math.sin(w * 0.5) * 0.12 * drive, 0, 0.02);
      set('L_Knee83',  0.12 + Math.sin(w * 0.5 - 0.6) * 0.10 * drive, 0, 0);
      set('L_Ankle84', Math.sin(w * 0.5 - 1.0) * 0.08, 0, 0);
      set('R_Thigh88', Math.sin(w * 0.5 + Math.PI) * 0.12 * drive, 0, -0.02);
      set('R_Knee89',  0.12 + Math.sin(w * 0.5 + Math.PI - 0.6) * 0.10 * drive, 0, 0);
      set('R_Ankle90', Math.sin(w * 0.5 + Math.PI - 1.0) * 0.08, 0, 0);
    }
  }

  // ---- the solar system turns as you scroll: active planet big-center,
  //      neighbours slide off to the sides, shrinking + receding into depth ----
  cosmosPos += (st.p * (planets.length - 1) - cosmosPos) * 0.12;        // smoothed scroll index
  planets.forEach((pl, i) => {
    const dx = i - cosmosPos;                                           // signed distance from center slot
    const ad = Math.abs(dx);
    pl.g.position.x = dx * SPACING;
    pl.g.position.y = -ad * 0.5;                                        // gentle downward arc at the sides
    pl.g.position.z = -ad * 2.4;                                        // recede into depth (fog fades far ones)
    pl.g.scale.setScalar(1 / (1 + ad * 0.85));                         // big at center → small at sides
    pl.spinner.rotation.y += pl.spin * dt;                             // self-rotation
    if (pl.clouds) pl.clouds.rotation.y += 0.02 * dt;                  // clouds drift over the surface
  });

  // Mumbai galactic ping tracks the marker on screen (only on the hero, front-facing)
  if (planets[0].marker) {
    planets[0].marker.getWorldPosition(_pv); _pv.project(camera);
    const onHero = cosmosPos < 0.55 && _pv.z < 1;
    pingEl.classList.toggle('on', onHero);
    if (onHero) {
      pingEl.style.left = ((_pv.x * 0.5 + 0.5) * innerWidth) + 'px';
      pingEl.style.top = ((-(_pv.y * 0.5) + 0.5) * innerHeight) + 'px';
    }
  }

  // camera parallax — a soft drift toward the cursor for depth
  camera.position.x += (mouse.x * 0.45 - camera.position.x) * 0.04;
  camera.position.y += (mouse.y * 0.32 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);

  composer.render(dt);

  // (Astronaut no longer holds the cursor string — the trail runs free of him.)

  requestAnimationFrame(tick);
}
tick();

// ---------- Data line: dots stream from Mumbai (on Earth) → the "Kartik" wordmark ----------
// Only while the Earth (hero) planet is the one on screen, and only when Mumbai is on
// the near, camera-facing side of the globe.
const packetsLayer = document.getElementById('packets');
const brandPort = document.getElementById('brand-port');
const mumbaiV = new THREE.Vector3();
function spawnMumbaiDot() {
  const earth = planets[0];
  if (!earth.marker || cosmosPos > 0.55) return;        // hero only
  earth.marker.getWorldPosition(mumbaiV); mumbaiV.project(camera);
  if (mumbaiV.z > 1) return;                            // Mumbai is round the back
  const sx = (mumbaiV.x * 0.5 + 0.5) * innerWidth;
  const sy = (-(mumbaiV.y * 0.5) + 0.5) * innerHeight;
  const pr = brandPort.getBoundingClientRect();
  const ex = pr.left + pr.width / 2, ey = pr.top + pr.height / 2;
  const d = document.createElement('div'); d.className = 'packet'; packetsLayer.appendChild(d);
  gsap.set(d, { x: sx, y: sy, opacity: 0 });
  gsap.timeline({ onComplete: () => d.remove() })
    .to(d, { opacity: 1, duration: 0.18 }, 0)
    .to(d, { x: ex, y: ey, duration: 1.05, ease: 'power1.inOut' }, 0)
    .to(d, { opacity: 0, duration: 0.25 }, 0.85)
    .add(() => { brandPort.classList.add('hit'); setTimeout(() => brandPort.classList.remove('hit'), 520); }, 0.96);
}
setInterval(spawnMumbaiDot, 420);              // steady stream so it reads as a line
