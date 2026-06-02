import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
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
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
  ready = true;

  // entrance: scale-pop as the boot dissolves
  gsap.from(pivot.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 1.5, ease: 'expo.out', delay: 0.2 });
  spin.y = -1.4; // start turned, idle-eases to front
}, undefined, (err) => console.error('astronaut load failed', err));

// ---- post-processing: filmic finish (pmndrs) ----
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new BloomEffect({ intensity: 0.5, luminanceThreshold: 0.9, luminanceSmoothing: 0.3, mipmapBlur: true });
const vignette = new VignetteEffect({ offset: 0.32, darkness: 0.46 });
const grain = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY }); grain.blendMode.opacity.value = 0.045;
const smaa = new SMAAEffect({ preset: SMAAPreset.HIGH });
composer.addPass(new EffectPass(camera, smaa, bloom, vignette, grain));

function size() {
  renderer.setSize(innerWidth, innerHeight, false);
  composer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
}
size(); addEventListener('resize', size);

// ---------- Scroll drives where the astronaut drifts ----------
const st = { p: 0 };
ScrollTrigger.create({ trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: 1, onUpdate: (self) => { st.p = self.progress; } });

// pointer parallax (camera breathes with the mouse)
const mouse = { x: 0, y: 0 };
addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = -(e.clientY / innerHeight - 0.5); });

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
let elapsed = 0;
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt; const t = elapsed;
  if (mixer) mixer.update(dt);

  // when the wave finishes, fall back to floating
  if (current && current.getClip && current.getClip().name === 'wave' && !current.isRunning()) play('floating');

  // ---- the astronaut FLOATS — a continuous wavy zero-g drift; the cursor nudges it ----
  if (!dragging) {
    const wx = Math.sin(t * 0.5) * 1.2 + Math.cos(t * 0.33) * 0.6;   // figure-8 wander
    const wy = Math.sin(t * 0.43) * 0.6 + Math.cos(t * 0.27) * 0.3;
    const baseX = Math.sin(st.p * Math.PI * 2.0) * 0.5;
    const baseY = 0.4 + Math.cos(st.p * Math.PI * 1.3) * 0.25;
    const tx = baseX + wx + mouse.x * 2.8;   // cursor nudges where he wanders
    const ty = baseY + wy + mouse.y * 1.6;
    drift.position.x += (tx - drift.position.x) * 0.05;
    drift.position.y += (ty - drift.position.y) * 0.05;
    // wavy roll/lean — banks into the drift and toward the cursor
    drift.rotation.z += ((-mouse.x * 0.22 + Math.sin(t * 0.4) * 0.14) - drift.rotation.z) * 0.05;
    drift.rotation.x += (( mouse.y * 0.16 + Math.cos(t * 0.5) * 0.09) - drift.rotation.x) * 0.05;
  }

  // continuous slow 360 turn (always alive) + coast from your flicks
  if (!dragging) {
    spin.y += velY; velY *= 0.94;
    spin.x += velX; velX *= 0.94;
    spin.y += 0.0045;   // perpetual full-circle turn
  }
  pivot.rotation.y += (spin.y - pivot.rotation.y) * (dragging ? 0.45 : 0.14);
  pivot.rotation.x += (spin.x - pivot.rotation.x) * (dragging ? 0.45 : 0.14);

  // camera breathes very slightly opposite (depth) — the astronaut does the moving now
  camera.position.x += (-mouse.x * 0.5 - camera.position.x) * 0.04;
  camera.position.y += (-mouse.y * 0.35 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);

  composer.render(dt);
  requestAnimationFrame(tick);
}
tick();
