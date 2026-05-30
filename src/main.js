import './style.css';
import * as THREE from 'three';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { details } from './data.js';

gsap.registerPlugin(ScrollTrigger);

/* =============================================================
   katti — scroll narrative with a 3D "system ball" centerpiece
   that moves with the story and fires data packets up to katti.
   ============================================================= */

// ---------- Smooth scroll ----------
const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
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

// ---------- Boot ----------
const boot = document.getElementById('boot');
const bootLine = document.getElementById('boot-line');
const bootBar = boot.querySelector('.boot-bar span');
const msgs = ['initialising…', 'mounting memory…', 'waking agents…', 'online'];
let bi = 0;
const bt = setInterval(() => { bi++; if (bootLine && bi < msgs.length) bootLine.textContent = msgs[bi]; }, 340);
gsap.to(bootBar, { width: '100%', duration: 1.4, ease: 'power2.inOut', onComplete: () => {
  clearInterval(bt); setTimeout(() => boot.classList.add('is-done'), 320);
}});

// ===========================================================
// THE BALL — a faceted "data core"
// ===========================================================
const canvas = document.getElementById('ball');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 0, 6.2);
function size() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
size(); addEventListener('resize', size);

scene.add(new THREE.AmbientLight(0x404a55, 0.7));
const key = new THREE.DirectionalLight(0xffffff, 1.15); key.position.set(3, 4, 5); scene.add(key);
const mint = new THREE.PointLight(0x6FE7CE, 1.5, 24); mint.position.set(-4, -1, 3); scene.add(mint);
const cool = new THREE.PointLight(0x3a6ea5, 1.0, 24); cool.position.set(4, 2, -3); scene.add(cool);

const ball = new THREE.Group();
const ico = new THREE.IcosahedronGeometry(1.6, 2);
const body = new THREE.Mesh(ico, new THREE.MeshStandardMaterial({ color: 0x0f141a, metalness: 0.65, roughness: 0.24, flatShading: true }));
ball.add(body);
const edges = new THREE.LineSegments(new THREE.EdgesGeometry(ico, 14), new THREE.LineBasicMaterial({ color: 0x6FE7CE, transparent: true, opacity: 0.32 }));
ball.add(edges);
const innerWire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 1), new THREE.MeshBasicMaterial({ color: 0x163b33, wireframe: true, transparent: true, opacity: 0.45 }));
ball.add(innerWire);
// particle shell (the "data")
const N = 150, ppos = new Float32Array(N * 3);
for (let i = 0; i < N; i++) {
  const u = Math.random(), v = Math.random(), th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1), r = 2.0 + Math.random() * 0.35;
  ppos[i * 3] = r * Math.sin(ph) * Math.cos(th); ppos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th); ppos[i * 3 + 2] = r * Math.cos(ph);
}
const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
const shell = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x6FE7CE, size: 0.028, transparent: true, opacity: 0.7 }));
ball.add(shell);
scene.add(ball);

// ---------- Scroll choreography ----------
// content side: hero/contact centre; about/exp = content right → ball LEFT;
// katti/projects = content left → ball RIGHT. ball rotates through the story.
const steps = [
  { p: 0.00, x:  0.0, y:  0.0, s: 1.00, ry: 0.0 }, // hero
  { p: 0.20, x: -2.3, y: -0.1, s: 1.12, ry: 1.1 }, // about  (ball left)
  { p: 0.40, x:  2.3, y:  0.1, s: 1.10, ry: 2.3 }, // katti  (ball right)
  { p: 0.60, x: -2.3, y:  0.0, s: 1.10, ry: 3.5 }, // exp    (ball left)
  { p: 0.80, x:  2.3, y:  0.0, s: 1.10, ry: 4.7 }, // proj   (ball right)
  { p: 1.00, x:  0.0, y: -0.1, s: 1.28, ry: 5.9 }, // contact(centre, forward)
];
const sm = (t) => t * t * (3 - 2 * t);
function sample(p) {
  for (let i = 0; i < steps.length - 1; i++) {
    const a = steps[i], b = steps[i + 1];
    if (p >= a.p && p <= b.p) { const t = sm((p - a.p) / (b.p - a.p)); const k = (q) => a[q] + (b[q] - a[q]) * t; return { x: k('x'), y: k('y'), s: k('s'), ry: k('ry') }; }
  }
  return { ...steps[steps.length - 1] };
}
const st = { p: 0 };
ScrollTrigger.create({ trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: 1, onUpdate: (self) => { st.p = self.progress; } });

// content reveals
gsap.utils.toArray('.panel').forEach((panel) => {
  const items = panel.querySelectorAll('.content > *, .hero-id > *');
  gsap.from(items, { scrollTrigger: { trigger: panel, start: 'top 68%', toggleActions: 'play none none reverse' }, y: 30, opacity: 0, filter: 'blur(8px)', duration: 0.8, stagger: 0.08, ease: 'power3.out' });
});

// scroll cue fade
const cue = document.getElementById('scroll-cue');
ScrollTrigger.create({ trigger: 'main', start: 'top top', end: '6% top', scrub: 0.4, onUpdate: (s) => { cue.style.opacity = (1 - s.progress).toFixed(2); } });

// ---------- Data packets: ball → katti ----------
const packets = document.getElementById('packets');
const brandPort = document.getElementById('brand-port');
const cur = { x: 0, y: 0, s: 1, ry: 0 };
function ballScreen() { const v = ball.position.clone(); v.project(camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight }; }
function flashPort() { brandPort.classList.add('hit'); setTimeout(() => brandPort.classList.remove('hit'), 160); }
function spawnPacket() {
  const r = brandPort.getBoundingClientRect();
  const port = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  const b = ballScreen();
  const reverse = Math.random() < 0.25;
  const from = reverse ? port : b, to = reverse ? b : port;
  const el = document.createElement('div'); el.className = 'packet'; packets.appendChild(el);
  gsap.set(el, { x: from.x, y: from.y, opacity: 0 });
  gsap.timeline({ onComplete: () => { el.remove(); if (!reverse) flashPort(); } })
    .to(el, { opacity: 1, duration: 0.14 })
    .to(el, { x: to.x, y: to.y, duration: 1.0, ease: 'power1.inOut' }, 0)
    .to(el, { opacity: 0, duration: 0.22 }, '-=0.22');
}
let packetTimer = null;
boot.addEventListener('transitionend', () => { if (!packetTimer) packetTimer = setInterval(spawnPacket, 900); });
setTimeout(() => { if (!packetTimer) packetTimer = setInterval(spawnPacket, 900); }, 2600); // fallback

// The ball "throws" each section's content — a packet-burst from the ball
// toward the content as you arrive at each section (the knowledge base projecting).
function spawnBurst(targetEl) {
  if (!targetEl) return;
  const r = targetEl.getBoundingClientRect();
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const b = ballScreen();
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
function tick() {
  const t = clock.getElapsedTime();
  const s = sample(st.p);
  cur.x += (s.x - cur.x) * 0.08;
  cur.y += (s.y - cur.y) * 0.08;
  cur.s += (s.s - cur.s) * 0.08;
  cur.ry += (s.ry - cur.ry) * 0.08;
  ball.position.x = cur.x;
  ball.position.y = cur.y + Math.sin(t * 0.6) * 0.06;
  ball.scale.setScalar(cur.s);
  ball.rotation.y = cur.ry + t * 0.05;
  ball.rotation.x = Math.sin(t * 0.2) * 0.12;
  shell.rotation.y = -t * 0.08;
  innerWire.rotation.x = t * 0.1;
  edges.material.opacity = 0.28 + Math.sin(t * 1.5) * 0.1;
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
