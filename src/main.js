import './style.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { details } from './data.js';

gsap.registerPlugin(ScrollTrigger);

/* =============================================================
   katti — scroll narrative with a 3D "system ball" centerpiece
   that moves with the story and fires data packets up to katti.
   ============================================================= */

// ---------- Smooth scroll (heavy, buttery glide — expo decel) ----------
const lenis = new Lenis({
  duration: 1.25,
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

// ---------- Dossier window ----------
const win = document.getElementById('window');
const winId = document.getElementById('window-id');
const winTitle = document.getElementById('window-title');
const winBody = document.getElementById('window-body');
function openDoc(key) {
  const d = details[key]; if (!d) return;
  winId.textContent = 'DOC · ' + key;
  winTitle.textContent = d.title;
  winBody.innerHTML = `<div class="win-doc"><span class="doc-tag">${d.tag}</span>${d.body}</div>`;
  winBody.scrollTop = 0;
  win.classList.add('is-open'); win.setAttribute('aria-hidden', 'false'); lenis.stop();
}
function closeWindow() { win.classList.remove('is-open'); win.setAttribute('aria-hidden', 'true'); lenis.start(); }
document.querySelectorAll('[data-doc]').forEach((el) => el.addEventListener('click', () => openDoc(el.dataset.doc)));
win.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeWindow));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeWindow(); });

// ---------- Boot (the katti·os cold-start) ----------
const boot = document.getElementById('boot');
const bootLog = document.getElementById('boot-log');
const bootBar = boot.querySelector('.boot-bar span');
const bootPct = document.getElementById('boot-pct');

// streaming system log — lines type themselves in, last one is the "online" line
const bootSeq = [
  'booting katti·os',
  'mounting memory core',
  'waking agent council',
  'linking data bus',
  'loading kartik.dubey',
  'system online',
];
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

// progress bar + percentage, perfectly synced off one tween
const bootProg = { v: 0 };
gsap.to(bootProg, {
  v: 100, duration: 2.4, ease: 'power2.inOut',
  onUpdate: () => {
    const p = Math.round(bootProg.v);
    bootBar.style.width = p + '%';
    bootPct.textContent = String(p).padStart(2, '0');
  },
  onComplete: () => { setTimeout(() => boot.classList.add('is-done'), 380); },
});

// ===========================================================
// THE WORLD — a flight THROUGH katti·os. The camera travels down
// a corridor of glowing agent-nodes wired into a graph; fog hides
// the depth so each cluster emerges from the dark as you scroll.
// Procedural (no 3D assets) · bloom for the glow · heavy-eased dolly.
// ===========================================================
const canvas = document.getElementById('ball');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x05060A, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060A, 0.0125);
const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 400);
camera.position.set(0, 0, 14);

scene.add(new THREE.AmbientLight(0x35506a, 0.8));
const key = new THREE.PointLight(0x6FE7CE, 2.2, 120); key.position.set(0, 0, 10); scene.add(key);

// ---- build the graph corridor: five hubs = the five sections ----
const HUBZ = [0, -50, -100, -150, -205];
const hubs = HUBZ.map((z, i) => new THREE.Vector3(
  i === 0 ? 0 : Math.sin(i * 1.7) * 9,
  i === 0 ? 0 : Math.cos(i * 2.3) * 5,
  z,
));

const nodeXYZ = [];
const edgeXYZ = [];
hubs.forEach((h, ci) => {
  nodeXYZ.push(h.x, h.y, h.z);                       // the hub itself
  for (let i = 0; i < 16; i++) {                     // its satellite agents
    const a = Math.random() * Math.PI * 2;
    const r = 4 + Math.random() * 11;
    const v = new THREE.Vector3(
      h.x + Math.cos(a) * r,
      h.y + Math.sin(a) * r,
      h.z + (Math.random() * 2 - 1) * 16,
    );
    nodeXYZ.push(v.x, v.y, v.z);
    edgeXYZ.push(h.x, h.y, h.z, v.x, v.y, v.z);       // hub → satellite
    if (i % 4 === 0 && ci < hubs.length - 1) {        // a few long forward links
      const n = hubs[ci + 1];
      edgeXYZ.push(v.x, v.y, v.z, n.x, n.y, n.z);
    }
  }
  if (ci < hubs.length - 1) {                         // spine: hub → next hub
    const n = hubs[ci + 1];
    edgeXYZ.push(h.x, h.y, h.z, n.x, n.y, n.z);
  }
});

const nodeGeo = new THREE.BufferGeometry();
nodeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nodeXYZ), 3));
const nodes = new THREE.Points(nodeGeo, new THREE.PointsMaterial({ color: 0x9FF4E2, size: 0.5, sizeAttenuation: true, transparent: true, opacity: 0.95 }));
scene.add(nodes);

const edgeGeo = new THREE.BufferGeometry();
edgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edgeXYZ), 3));
const edges = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0x2f7d6e, transparent: true, opacity: 0.5 }));
scene.add(edges);

// faint far starfield for depth
const STAR = 600, sxyz = new Float32Array(STAR * 3);
for (let i = 0; i < STAR; i++) { sxyz[i*3] = (Math.random()*2-1)*60; sxyz[i*3+1] = (Math.random()*2-1)*40; sxyz[i*3+2] = -Math.random()*240; }
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(sxyz, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x49606e, size: 0.18, sizeAttenuation: true, transparent: true, opacity: 0.6 }));
scene.add(stars);

// data pulses racing the spine — the system thinking as you fly through it
const PULSES = 22;
const pulseXYZ = new Float32Array(PULSES * 3);
const pulseState = Array.from({ length: PULSES }, () => ({ seg: Math.floor(Math.random() * (hubs.length - 1)), t: Math.random(), spd: 0.18 + Math.random() * 0.22 }));
const pulseGeo = new THREE.BufferGeometry();
pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulseXYZ, 3));
const pulses = new THREE.Points(pulseGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, sizeAttenuation: true, transparent: true, opacity: 1 }));
scene.add(pulses);

// ---- post-processing: bloom (the Lusion-grade glow) ----
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.85, 0.7, 0.18);
composer.addPass(bloom);

function size() {
  renderer.setSize(innerWidth, innerHeight, false);
  composer.setSize(innerWidth, innerHeight);
  bloom.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
}
size(); addEventListener('resize', size);

// ---------- Scroll drives the camera dolly down the corridor ----------
const st = { p: 0 };
ScrollTrigger.create({ trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: 1, onUpdate: (self) => { st.p = self.progress; } });

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

// ---------- packets: the nearest hub feeds the katti identity ----------
const packets = document.getElementById('packets');
const brandPort = document.getElementById('brand-port');
function nearestHubScreen() {
  let best = hubs[0], bd = 1e9;
  for (const h of hubs) { const d = Math.abs(h.z - camera.position.z); if (d < bd) { bd = d; best = h; } }
  const v = best.clone().project(camera);
  return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
}
function flashPort() { brandPort.classList.add('hit'); setTimeout(() => brandPort.classList.remove('hit'), 160); }
function spawnPacket() {
  const r = brandPort.getBoundingClientRect();
  const port = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  const b = nearestHubScreen();
  const el = document.createElement('div'); el.className = 'packet'; packets.appendChild(el);
  gsap.set(el, { x: b.x, y: b.y, opacity: 0 });
  gsap.timeline({ onComplete: () => { el.remove(); flashPort(); } })
    .to(el, { opacity: 1, duration: 0.14 })
    .to(el, { x: port.x, y: port.y, duration: 1.0, ease: 'power1.inOut' }, 0)
    .to(el, { opacity: 0, duration: 0.22 }, '-=0.22');
}
let packetTimer = null;
boot.addEventListener('transitionend', () => { if (!packetTimer) packetTimer = setInterval(spawnPacket, 1100); });
setTimeout(() => { if (!packetTimer) packetTimer = setInterval(spawnPacket, 1100); }, 3200); // fallback

// burst into each section's content as you arrive at its cluster
function spawnBurst(targetEl) {
  if (!targetEl) return;
  const r = targetEl.getBoundingClientRect();
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const b = nearestHubScreen();
      const tx = r.left + r.width * (0.15 + Math.random() * 0.7);
      const ty = r.top + r.height * (0.12 + Math.random() * 0.76);
      const el = document.createElement('div'); el.className = 'packet packet--throw'; packets.appendChild(el);
      gsap.set(el, { x: b.x, y: b.y, opacity: 0 });
      gsap.timeline({ onComplete: () => el.remove() })
        .to(el, { opacity: 1, duration: 0.12 })
        .to(el, { x: tx, y: ty, duration: 0.72, ease: 'power2.out' }, 0)
        .to(el, { opacity: 0, duration: 0.28 }, '-=0.22');
    }, i * 55);
  }
}
gsap.utils.toArray('.panel').forEach((panel) => {
  ScrollTrigger.create({
    trigger: panel, start: 'top 58%',
    onEnter: () => spawnBurst(panel.querySelector('.content, .hero-id')),
    onEnterBack: () => spawnBurst(panel.querySelector('.content, .hero-id')),
  });
});

// ---------- Render ----------
const clock = new THREE.Clock();
let elapsed = 0, camZ = 14;
const ZSTART = 12, ZEND = HUBZ[HUBZ.length - 1] + 16; // fly from front to past the last hub
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt; const t = elapsed;

  // smooth camera dolly down the corridor (heavy ease = Lusion glide)
  const targetZ = ZSTART + (ZEND - ZSTART) * st.p;
  camZ += (targetZ - camZ) * 0.06;
  camera.position.z = camZ;
  camera.position.x += (mouse.x * 4 - camera.position.x) * 0.04;
  camera.position.y += (mouse.y * 2.5 - camera.position.y) * 0.04;
  camera.lookAt(mouse.x * 2, mouse.y * 1.5, camZ - 40);

  // twinkle the node field
  nodes.material.opacity = 0.8 + Math.sin(t * 1.5) * 0.15;

  // race the pulses along the spine
  for (let i = 0; i < PULSES; i++) {
    const ps = pulseState[i];
    ps.t += ps.spd * dt;
    if (ps.t > 1) { ps.t = 0; ps.seg = (ps.seg + 1) % (hubs.length - 1); }
    const a = hubs[ps.seg], b = hubs[ps.seg + 1];
    pulseXYZ[i*3] = a.x + (b.x - a.x) * ps.t;
    pulseXYZ[i*3+1] = a.y + (b.y - a.y) * ps.t;
    pulseXYZ[i*3+2] = a.z + (b.z - a.z) * ps.t;
  }
  pulseGeo.attributes.position.needsUpdate = true;

  composer.render();
  requestAnimationFrame(tick);
}
tick();
