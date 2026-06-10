import './style.css';
import './smash.js';
import * as THREE from 'three';
import { initCursor } from './cursor.js';

// Touch / small / low-power devices: skip the desktop-only mouse FX + post-processing.
const LITE = matchMedia('(max-width: 820px), (pointer: coarse)').matches;
if (!LITE) initCursor();   // wavy cursor trail is a desktop flourish

import { EffectComposer, RenderPass, EffectPass, VignetteEffect } from 'postprocessing';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { details } from './data.js';

gsap.registerPlugin(ScrollTrigger);

/* =============================================================
   Kartik Dubey — "The Living Blueprint."
   The centerpiece is the thing he actually builds: a multi-agent
   SYSTEM. 5 hubs (one per section) anchor clusters of agent-nodes,
   wired by hairline edges, with data-pulses running the wires.
   It breathes, reacts to the cursor, you can grab + turn it, and
   scrolling brings each subsystem to the front and lights it up.
   Vanilla three.js · ink-on-cream blueprint · pmndrs vignette.
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
// THE WORLD — a cream void holding one living system.
// ===========================================================
const canvas = document.getElementById('ball');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, LITE ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const CREAM = 0xF4F1EA;
const scene = new THREE.Scene();
scene.background = new THREE.Color(CREAM);
scene.fog = new THREE.Fog(CREAM, 7, 20);   // far nodes dissolve into the paper

const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
camera.position.set(0, 0, 8);

// ===========================================================
// THE SYSTEM — a multi-agent network drawn as a blueprint.
//   • 5 hubs = the 5 sections (the agent council / subsystems)
//   • each hub anchors a cluster of agent-nodes
//   • hairline edges wire nodes→hub, sibling→sibling, hub→hub spine
//   • data-pulses run the wires (the life + the curiosity hook)
// ===========================================================
const INK = new THREE.Color(0x0A0A0A);
const PAPER = new THREE.Color(CREAM);
const SIGNAL = new THREE.Color(0x2742C8);   // the ONE accent: live data, blueprint-blue

const SECTIONS = 5;
const graph = new THREE.Group();
scene.add(graph);

// hub anchors — a gentle 3D spine the scroll travels along
const hubPos = [];
for (let i = 0; i < SECTIONS; i++) {
  const a = (i / (SECTIONS - 1)) - 0.5;          // -0.5..0.5
  hubPos.push(new THREE.Vector3(a * 10, Math.sin(i * 1.7) * 1.0, Math.cos(i * 1.3) * 1.5 - 0.4));
}

// build nodes: each hub + a cluster of satellites around it
const nodes = [];                                 // {pos, hub, section}
hubPos.forEach((hp, s) => {
  nodes.push({ pos: hp.clone(), hub: true, section: s });
  const count = 12 + (s % 2 ? 3 : 0);
  for (let k = 0; k < count; k++) {
    const r = 0.6 + Math.random() * 1.7;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    nodes.push({ pos: new THREE.Vector3(
      hp.x + r * Math.sin(ph) * Math.cos(th),
      hp.y + r * Math.sin(ph) * Math.sin(th) * 0.85,
      hp.z + r * Math.cos(ph)), hub: false, section: s });
  }
});
const N = nodes.length;
const nodeBase = nodes.map((n) => n.pos.clone());

// edges: satellite→hub, nearest sibling, + the hub spine (system backbone)
const hubIndex = [];
nodes.forEach((n, i) => { if (n.hub) hubIndex[n.section] = i; });
const edges = [];                                  // [aIdx, bIdx, isSpine]
nodes.forEach((n, i) => { if (!n.hub) edges.push([i, hubIndex[n.section], false]); });
for (let s = 0; s < SECTIONS; s++) {
  const idxs = nodes.map((n, i) => (n.section === s && !n.hub ? i : -1)).filter((i) => i >= 0);
  idxs.forEach((a) => {
    let best = -1, bd = 1e9;
    idxs.forEach((b) => { if (a === b) return; const d = nodeBase[a].distanceTo(nodeBase[b]); if (d < bd) { bd = d; best = b; } });
    if (best >= 0 && Math.random() < 0.55) edges.push([a, best, false]);
  });
}
for (let s = 0; s < SECTIONS - 1; s++) edges.push([hubIndex[s], hubIndex[s + 1], true]);
const E = edges.length;

// ---- nodes: crisp circular Points, per-vertex size + alpha, fog-faded ----
const nodeGeo = new THREE.BufferGeometry();
const npos = new Float32Array(N * 3), nsize = new Float32Array(N), nalpha = new Float32Array(N);
nodes.forEach((n, i) => { npos[i * 3] = n.pos.x; npos[i * 3 + 1] = n.pos.y; npos[i * 3 + 2] = n.pos.z; nsize[i] = n.hub ? 15 : 6; nalpha[i] = n.hub ? 1 : 0.78; });
nodeGeo.setAttribute('position', new THREE.BufferAttribute(npos, 3));
nodeGeo.setAttribute('aSize', new THREE.BufferAttribute(nsize, 1));
nodeGeo.setAttribute('aAlpha', new THREE.BufferAttribute(nalpha, 1));

function nodeMaterial(color) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uColor: { value: color }, uDpr: { value: renderer.getPixelRatio() }, uPaper: { value: PAPER }, uNear: { value: scene.fog.near }, uFar: { value: scene.fog.far } },
    vertexShader: `
      attribute float aSize; attribute float aAlpha;
      varying float vA;
      uniform float uDpr, uNear, uFar;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float fog = clamp((uFar + mv.z) / (uFar - uNear), 0.0, 1.0); // mv.z negative
        vA = aAlpha * fog;
        gl_PointSize = aSize * uDpr * (7.5 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; varying float vA;
      void main(){
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        gl_FragColor = vec4(uColor, vA * smoothstep(0.5, 0.4, r));
      }`,
  });
}
const nodePoints = new THREE.Points(nodeGeo, nodeMaterial(INK));
graph.add(nodePoints);

// ---- edges: hairline ink lines, per-vertex colour so we can light a subsystem ----
const edgeGeo = new THREE.BufferGeometry();
const epos = new Float32Array(E * 6), ecol = new Float32Array(E * 6);
edges.forEach((e, k) => { const a = nodeBase[e[0]], b = nodeBase[e[1]]; epos.set([a.x, a.y, a.z, b.x, b.y, b.z], k * 6); });
edgeGeo.setAttribute('position', new THREE.BufferAttribute(epos, 3));
edgeGeo.setAttribute('color', new THREE.BufferAttribute(ecol, 3));
const edgeMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false });
const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
graph.add(edgeLines);
const _ec = new THREE.Color();
function recolorEdges(active) {
  edges.forEach((e, k) => {
    const sect = nodes[e[0]].section;
    let strength = e[2] ? 0.36 : (sect === active ? 0.58 : 0.15);   // active subsystem lit, others faint
    _ec.copy(PAPER).lerp(INK, strength);
    ecol.set([_ec.r, _ec.g, _ec.b, _ec.r, _ec.g, _ec.b], k * 6);
  });
  edgeGeo.attributes.color.needsUpdate = true;
}
recolorEdges(0);

// ---- data pulses: bright signal dots that run the wires ----
const M = LITE ? 9 : 16;
const pulses = Array.from({ length: M }, () => ({ e: Math.floor(Math.random() * E), t: Math.random(), spd: 0.25 + Math.random() * 0.5 }));
const pulseGeo = new THREE.BufferGeometry();
const ppos = new Float32Array(M * 3), psize = new Float32Array(M).fill(9), palpha = new Float32Array(M).fill(1);
pulseGeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
pulseGeo.setAttribute('aSize', new THREE.BufferAttribute(psize, 1));
pulseGeo.setAttribute('aAlpha', new THREE.BufferAttribute(palpha, 1));
const pulsePoints = new THREE.Points(pulseGeo, nodeMaterial(SIGNAL));
graph.add(pulsePoints);

// active-subsystem ring — a focal "you are here / this part is live" marker
const activeRing = new THREE.Mesh(
  new THREE.RingGeometry(0.5, 0.53, 72),
  new THREE.MeshBasicMaterial({ color: SIGNAL, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }),
);
graph.add(activeRing);
const _hubL = new THREE.Vector3();
const _pa = new THREE.Vector3(), _pb = new THREE.Vector3();
function updatePulses(dt, active) {
  pulses.forEach((p, i) => {
    p.t += p.spd * dt;
    if (p.t >= 1) {
      p.t = 0; p.spd = 0.25 + Math.random() * 0.5;
      // bias new pulses toward the active subsystem + the spine → the live area feels busiest
      const pool = edges.map((e, k) => ((e[2] || nodes[e[0]].section === active) ? k : -1)).filter((k) => k >= 0);
      p.e = pool.length && Math.random() < 0.7 ? pool[Math.floor(Math.random() * pool.length)] : Math.floor(Math.random() * E);
    }
    const e = edges[p.e];
    _pa.copy(nodeBase[e[0]]); _pb.copy(nodeBase[e[1]]);
    _pa.lerp(_pb, p.t);
    ppos[i * 3] = _pa.x; ppos[i * 3 + 1] = _pa.y; ppos[i * 3 + 2] = _pa.z;
  });
  pulseGeo.attributes.position.needsUpdate = true;
}

// caption: names the live system + invites the interaction (the curiosity hook)
const CAPTIONS = ['core · identity', 'memory · about', 'agents · work', 'clusters · projects', 'uplink · contact'];
const cap = document.createElement('div');
cap.className = 'sys-cap';
cap.innerHTML = `<span class="sys-cap-k" id="sysCapK">core · identity</span><span class="sys-cap-h">drag to turn the system · move to perturb it</span>`;
document.body.appendChild(cap);
const sysCapK = cap.querySelector('#sysCapK');

// ---- post-processing: a soft paper vignette ----
const composer = new EffectComposer(renderer, { multisampling: LITE ? 0 : 4 });
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new EffectPass(camera, new VignetteEffect({ offset: 0.32, darkness: 0.26 })));

function size() {
  renderer.setSize(innerWidth, innerHeight, false);
  composer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
}
size(); addEventListener('resize', size);

// ---------- Scroll progress + pointer ----------
const st = { p: 0 };
ScrollTrigger.create({ trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: 1, onUpdate: (self) => { st.p = self.progress; } });

const mouse = { x: 0, y: 0, px: window.innerWidth / 2, py: window.innerHeight / 2 };
addEventListener('pointermove', (e) => {
  mouse.x = e.clientX / innerWidth - 0.5;
  mouse.y = -(e.clientY / innerHeight - 0.5);
  mouse.px = e.clientX; mouse.py = e.clientY;
  if (dragging) { dragRY += (e.clientX - lastX) * 0.006; dragRX += (e.clientY - lastY) * 0.006; lastX = e.clientX; lastY = e.clientY; }
});

// ---------- Grab + turn the SYSTEM (agency / exploration) ----------
let dragging = false, lastX = 0, lastY = 0, dragRY = 0, dragRX = 0;
canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.classList.add('grabbing'); });
addEventListener('pointerup', () => { dragging = false; canvas.classList.remove('grabbing'); });

// content reveals — staggered rise + de-blur as each section enters
gsap.utils.toArray('.panel').forEach((panel) => {
  const items = panel.querySelectorAll('.content > *, .hero-id > *');
  gsap.from(items, { scrollTrigger: { trigger: panel, start: 'top 68%', toggleActions: 'play none none reverse' }, y: 30, opacity: 0, filter: 'blur(8px)', duration: 0.8, stagger: 0.08, ease: 'power3.out' });
});
gsap.utils.toArray('.rows').forEach((list) => {
  gsap.from(list.querySelectorAll('.row'), { scrollTrigger: { trigger: list, start: 'top 78%', toggleActions: 'play none none reverse' }, x: -24, opacity: 0, duration: 0.6, stagger: 0.09, ease: 'power3.out' });
});
gsap.utils.toArray('.panel-num').forEach((num) => {
  gsap.from(num, { scrollTrigger: { trigger: num.closest('.panel'), start: 'top 85%', end: 'bottom top', scrub: 1 }, yPercent: 18, opacity: 0 });
});

// ---------- Section rail: active-state + click-to-jump ----------
const railItems = [...document.querySelectorAll('.rail-item')];
const railFor = (step) => railItems.find((r) => r.dataset.rail === step);
gsap.utils.toArray('.panel').forEach((panel) => {
  const item = railFor(panel.dataset.step);
  ScrollTrigger.create({ trigger: panel, start: 'top center', end: 'bottom center', onToggle: (self) => { if (!self.isActive) return; railItems.forEach((r) => r.classList.remove('is-active')); if (item) item.classList.add('is-active'); } });
});
railItems.forEach((item) => item.addEventListener('click', (e) => {
  const id = item.getAttribute('href');
  const target = id === '#top' ? 0 : document.querySelector(id);
  if (target === 0 || target) { e.preventDefault(); lenis.scrollTo(target, { duration: 1.0 }); }
}));

const cue = document.getElementById('scroll-cue');
ScrollTrigger.create({ trigger: 'main', start: 'top top', end: '6% top', scrub: 0.4, onUpdate: (s) => { cue.style.opacity = (1 - s.progress).toFixed(2); } });

// ---------- Render ----------
const clock = new THREE.Clock();
let sysT = 0, lastActive = -1;
const _p = new THREE.Vector3();
const brandPort = document.getElementById('brand-port');
let portT = 0;

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  sysT += dt;

  // ---- scroll focus: center the active hub, pull it forward ----
  const af = st.p * (SECTIONS - 1);                 // active float 0..4
  const lo = Math.floor(af), hi = Math.min(lo + 1, SECTIONS - 1), fr = af - lo;
  const hubX = THREE.MathUtils.lerp(hubPos[lo].x, hubPos[hi].x, fr);
  const hubZ = THREE.MathUtils.lerp(hubPos[lo].z, hubPos[hi].z, fr);
  graph.position.x += (-hubX - graph.position.x) * 0.07;
  graph.position.z += ((1.4 - hubZ) - graph.position.z) * 0.06;

  // ---- breathing + cursor tilt + drag orbit (the system feels alive + handlable) ----
  const tgtRotY = mouse.x * 0.3 + dragRY + Math.sin(sysT * 0.12) * 0.05;
  const tgtRotX = -mouse.y * 0.18 + dragRX + Math.sin(sysT * 0.16) * 0.03;
  graph.rotation.y += (tgtRotY - graph.rotation.y) * (dragging ? 0.2 : 0.04);
  graph.rotation.x += (tgtRotX - graph.rotation.x) * (dragging ? 0.2 : 0.04);
  graph.updateMatrixWorld();

  // ---- focal ring rides the live hub, billboards to camera, breathes ----
  _hubL.set(hubX, THREE.MathUtils.lerp(hubPos[lo].y, hubPos[hi].y, fr), hubZ);
  activeRing.position.copy(_hubL);
  activeRing.quaternion.copy(graph.quaternion).invert().multiply(camera.quaternion);
  const rs = 1 + Math.sin(sysT * 1.6) * 0.06;
  activeRing.scale.set(rs, rs, rs);
  activeRing.material.opacity = 0.4 + Math.sin(sysT * 1.6) * 0.16;

  // ---- per-node life: active subsystem lit, cursor halo brightens what's near ----
  const active = Math.round(af);
  for (let i = 0; i < N; i++) {
    const n = nodes[i];
    _p.copy(nodeBase[i]).applyMatrix4(graph.matrixWorld).project(camera);
    const sx = (_p.x * 0.5 + 0.5) * innerWidth, sy = (-_p.y * 0.5 + 0.5) * innerHeight;
    const near = Math.max(0, 1 - Math.hypot(sx - mouse.px, sy - mouse.py) / 170);
    const focus = n.section === active ? 1 : 0.34;
    nalpha[i] = Math.min(1, (n.hub ? 1 : 0.78) * focus + near * 0.6);
    nsize[i] = (n.hub ? 15 : 6) * (1 + near * 0.9) + (n.hub ? Math.sin(sysT * 1.4 + n.section) * 1.6 : 0);
  }
  nodeGeo.attributes.aAlpha.needsUpdate = true;
  nodeGeo.attributes.aSize.needsUpdate = true;

  if (active !== lastActive) {
    recolorEdges(active); lastActive = active;
    if (sysCapK) sysCapK.textContent = CAPTIONS[active] || CAPTIONS[0];
  }
  updatePulses(dt, active);

  // ---- the data line still feeds the wordmark: pulse the brand port ----
  portT += dt;
  if (portT > 0.9) { portT = 0; brandPort.classList.add('hit'); setTimeout(() => brandPort.classList.remove('hit'), 520); }

  // camera parallax for depth
  camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.04;
  camera.position.y += (mouse.y * 0.35 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);

  if (LITE) renderer.render(scene, camera);
  else composer.render(dt);
  requestAnimationFrame(tick);
}
tick();
