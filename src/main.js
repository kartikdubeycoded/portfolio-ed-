import './style.css';
import './smash.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { initCursor, getCursorTailTarget, setAstronautHand } from './cursor.js';

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
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
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
const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(4, 6, 5); scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 1.1); rim.position.set(-5, 2, -4); scene.add(rim);
scene.add(new THREE.AmbientLight(0xffffff, 0.35));

// ---- the astronaut ----
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
gltf.load('/astronaut.glb', (g) => {
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

  ready = true;

  // entrance: scale-pop as the boot dissolves
  gsap.from(pivot.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 1.5, ease: 'expo.out', delay: 0.2 });
  spin.y = -1.4; // start turned, idle-eases to front
}, undefined, (err) => console.error('astronaut load failed', err));

// ---- post-processing: filmic finish (pmndrs) ----
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new BloomEffect({ intensity: 0.45, luminanceThreshold: 0.9, luminanceSmoothing: 0.3, mipmapBlur: true });
const vignette = new VignetteEffect({ offset: 0.32, darkness: 0.42 });
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

// content reveals
gsap.utils.toArray('.panel').forEach((panel) => {
  const items = panel.querySelectorAll('.content > *, .hero-id > *');
  gsap.from(items, { scrollTrigger: { trigger: panel, start: 'top 68%', toggleActions: 'play none none reverse' }, y: 30, opacity: 0, filter: 'blur(8px)', duration: 0.8, stagger: 0.08, ease: 'power3.out' });
});

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
const handWorld = new THREE.Vector3();
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

  if (dragging) {
    // reset velocity on drag
    drift.userData.vx = 0;
    drift.userData.vy = 0;
    // you're spinning him — your input owns the rotation
    pivot.rotation.y += (spin.y - pivot.rotation.y) * 0.45;
    pivot.rotation.x += (spin.x - pivot.rotation.x) * 0.45;
  } else {
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
    const stringLen = 150;                       // ~4cm of string
    const targetX = mouse.px + (dx / dist) * stringLen;
    const targetY = mouse.py + (dy / dist) * stringLen;
    const tx = (targetX / window.innerWidth - 0.5) * 5.0;
    const ty = 0.15 + (-(targetY / window.innerHeight - 0.5)) * 3.0;

    if (drift.userData.vx === undefined) { drift.userData.vx = 0; drift.userData.vy = 0; }
    // Guard: first-frame projection is NaN before the camera matrix exists; skipping
    // keeps that NaN from poisoning his position forever (which made him vanish).
    if (Number.isFinite(tx) && Number.isFinite(ty)) {
      const stiffness = 0.06, damping = 0.17;    // active but smooth tow
      drift.userData.vx += (tx - drift.position.x) * stiffness - drift.userData.vx * damping;
      drift.userData.vy += (ty - drift.position.y) * stiffness - drift.userData.vy * damping;
      drift.position.x += drift.userData.vx;
      drift.position.y += drift.userData.vy;
    }

    // HEAD-FIRST: his head points where he's swimming — turns the SHORT way, slowly,
    // like a swimmer aiming forward. No torso spin, no helicopter.
    const sp = Math.hypot(drift.userData.vx, drift.userData.vy);
    if (sp > 0.0015) {
      const desired = Math.atan2(drift.userData.vy, drift.userData.vx) - Math.PI / 2;
      const d = Math.atan2(Math.sin(desired - pivot.rotation.z), Math.cos(desired - pivot.rotation.z));
      pivot.rotation.z += d * 0.06;
    }
    pivot.rotation.x += (0.4 - pivot.rotation.x) * 0.04;   // gentle dive into the page
    pivot.rotation.y += (0 - pivot.rotation.y) * 0.04;

    // soft breathing only (subtle life) — no hard jelly
    if (elapsed > 2.2) { const sq = Math.sin(t * 2.0) * 0.02; pivot.scale.set(1 + sq, 1 - sq, 1); }

    // ---- SWIM: every limb strokes like swimming through the page ----
    // Smooth, slow, organic. Additive on top of the baked float; scales with speed.
    if (ready && astronaut && astronaut.userData.bones) {
      const B = astronaut.userData.bones;
      const speed = Math.hypot(drift.userData.vx, drift.userData.vy);
      const drive = 0.65 + Math.min(speed * 26.0, 0.9);   // swim harder while moving
      const w = t * 2.6;                                   // stroke tempo (slow = graceful)
      const add = (name, ax, v) => { const bn = B[name]; if (bn) bn.rotation[ax] += v; };

      // legs: alternating flutter kick (thighs opposite phase, knees trailing)
      add('L_Thigh82', 'x', Math.sin(w) * 0.24 * drive);
      add('R_Thigh88', 'x', Math.sin(w + Math.PI) * 0.24 * drive);
      add('L_Knee83', 'x', Math.sin(w - 0.7) * 0.18 * drive);
      add('R_Knee89', 'x', Math.sin(w + Math.PI - 0.7) * 0.18 * drive);

      // arms: left pulls a stroke; right just gently flexes (it's holding the string)
      add('L_Arm10', 'x', Math.sin(w * 0.5) * 0.3 * drive);
      add('L_Elbow11', 'x', Math.sin(w * 0.5 - 0.8) * 0.22 * drive);
      add('R_Arm44', 'x', Math.sin(w * 0.5 + Math.PI) * 0.1 * drive);
    }
  }

  // camera breathes very slightly opposite (depth) — the astronaut does the moving now
  camera.position.x += (-mouse.x * 0.5 - camera.position.x) * 0.04;
  camera.position.y += (-mouse.y * 0.35 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);

  composer.render(dt);

  // feed his right hand's screen position to the cursor → the string ends in his grip
  if (ready && astronaut && astronaut.userData.bones) {
    const hand = astronaut.userData.bones['R_Wrist46'];
    if (hand) {
      hand.getWorldPosition(handWorld);
      handWorld.project(camera);
      const hx = (handWorld.x * 0.5 + 0.5) * innerWidth;
      const hy = (-(handWorld.y * 0.5) + 0.5) * innerHeight;
      if (Number.isFinite(hx) && Number.isFinite(hy)) setAstronautHand(hx, hy);
    }
  }

  requestAnimationFrame(tick);
}
tick();
