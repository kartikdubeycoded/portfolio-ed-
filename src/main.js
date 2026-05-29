import './style.css';
import * as THREE from 'three';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initModal } from './modal.js';
import { initCursor } from './cursor.js';
import { initDecode } from './decode.js';
import { initTilt, initMagnetic } from './tilt.js';

gsap.registerPlugin(ScrollTrigger);

// ---------- Smooth scroll ----------
const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const isMobile = window.matchMedia('(max-width: 980px)').matches
              || window.matchMedia('(pointer: coarse)').matches;

function hideLoader(delay = 0) {
  const el = document.getElementById('loader');
  if (!el) return;
  setTimeout(() => el.classList.add('is-hidden'), delay);
}

// ---------- Plate parallax (both modes) ----------
// Pan the painting slowly upward through the descent so the eye travels
// from canopy → falls → pool. The beauty is in the image; we only move it.
// The single stitched scene spans the whole document and scrolls as one layer.
// Motion/life comes from the drifting mist, the marquee and the bird — not from
// transforming this full-height plate (which would misalign the descent).

if (!isMobile) {
  bootBird();
} else {
  hideLoader(140);
}

// ===========================================================
// THE BIRD
// A procedural low-poly dove on a transparent canvas above the
// painted plate. It rides a single scroll timeline across 5 states:
//   1 (0–20%)   glide-loop, top-right (over the canopy)
//   2 (20–50%)  descend + bank, swing to the left corridor
//   3 (50–80%)  swing back, track down the right of the falls
//   4 (80–92%)  dive toward centre / the pool
//   5 (92–100%) flare, fold wings, settle — perched idle
// No procedural waterfall. No per-state allocation → no leaks.
// ===========================================================

function bootBird() {
  const canvas = document.getElementById('bird');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0); // transparent — plate shows through
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 11);
  camera.lookAt(0, 0, 0);

  function sizeRenderer() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  sizeRenderer();
  window.addEventListener('resize', sizeRenderer);

  // ---------- Light: warm key + cool shadow → origami two-tone like the paint
  scene.add(new THREE.AmbientLight(0x3A4A60, 0.5));          // cool shadow fill
  const key = new THREE.DirectionalLight(0xFFF1DC, 1.7);     // warm sun, front-up-right
  key.position.set(4, 7, 7);
  scene.add(key);
  const cool = new THREE.DirectionalLight(0x6FA8DC, 0.85);   // cerulean shadow side
  cool.position.set(-5, -1, 2);
  scene.add(cool);

  // ---------- Origami dove (matches the painted bird's faceted language) ----------
  const doveMat = new THREE.MeshStandardMaterial({
    color: 0xF4ECDD, roughness: 0.5, metalness: 0.0, flatShading: true,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xD0848E, roughness: 0.6, flatShading: true, // rose beak
  });

  const dove = new THREE.Group();   // outer: world position + travel heading
  const model = new THREE.Group();  // inner: the bird, body pointing +Y, facing camera
  dove.add(model);

  // Body — slim faceted diamond down the body axis (head +Y, tail -Y)
  const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), doveMat);
  body.scale.set(0.44, 1.08, 0.5);
  model.add(body);

  // Head + rose beak, at the top
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.19, 0), doveMat);
  head.position.set(0, 0.6, 0.05);
  model.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 4), accentMat);
  beak.position.set(0, 0.8, 0.06);
  model.add(beak);

  // Tail — forked fan pointing down
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0);
  tailShape.lineTo(0.24, -0.62);
  tailShape.lineTo(0, -0.44);
  tailShape.lineTo(-0.24, -0.62);
  tailShape.lineTo(0, 0);
  const tail = new THREE.Mesh(new THREE.ShapeGeometry(tailShape), doveMat);
  tail.position.set(0, -0.32, 0);
  model.add(tail);

  // Wings — spread to the sides (±X) in the facing plane → reads as a dove in
  // flight. Flap rotates each wing about the body (Y) axis.
  function makeWing(side) {
    const s = side; // +1 right, -1 left
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.10);
    shape.lineTo(s * 0.7, 0.30);   // shoulder sweep
    shape.lineTo(s * 1.7, 0.16);   // long swept tip (gull glide)
    shape.lineTo(s * 1.55, -0.02);
    shape.lineTo(s * 0.6, -0.14);
    shape.lineTo(0, -0.05);
    shape.lineTo(0, 0.10);
    const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), doveMat);
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.06, 0.12, 0);
    pivot.add(m);
    return pivot;
  }
  const wingL = makeWing(-1);
  const wingR = makeWing(+1);
  model.add(wingL, wingR);

  // Present at a slight 3/4-from-above tilt so the wing-beat reads in 3D
  model.rotation.x = -0.28;

  dove.scale.setScalar(1.18);
  scene.add(dove);

  // ---------- A few drifting light motes (subtle atmosphere) ----------
  const MOTES = 14;
  const motePos = new Float32Array(MOTES * 3);
  const moteSeed = [];
  for (let i = 0; i < MOTES; i++) {
    motePos[i * 3 + 0] = (Math.random() - 0.5) * 16;
    motePos[i * 3 + 1] = (Math.random() - 0.5) * 12;
    motePos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
    moteSeed.push(Math.random() * 100);
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const moteMat = new THREE.PointsMaterial({
    color: 0xE8DEC6, size: 0.055, transparent: true, opacity: 0.42,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const motes = new THREE.Points(moteGeo, moteMat);
  scene.add(motes);

  // ---------- The NAVIGATOR path ----------
  // Fixed full-viewport canvas → x/y map to the screen. The dove descends with
  // the scroll and weaves side to side (opposite the active section's text),
  // leading the eye from one section into the next, then dives into the pool
  // and lands. Heading is derived from velocity each frame → always faces travel.
  const path = [
    { p: 0.00, x:  3.4, y:  2.8, z: 1.0, flap: 1.0 }, // hero — upper right
    { p: 0.20, x: -3.2, y:  1.8, z: 1.0, flap: 1.0 }, // sweep left → ABOUT
    { p: 0.42, x:  3.2, y:  0.6, z: 1.0, flap: 1.0 }, // cross right → PROJECTS
    { p: 0.62, x: -3.0, y: -0.8, z: 1.0, flap: 1.0 }, // cross left → EXPERIENCE
    { p: 0.82, x:  2.3, y: -1.9, z: 1.1, flap: 0.95 },// right → toward CONTACT
    { p: 0.92, x:  0.3, y: -2.8, z: 1.2, flap: 0.5 }, // dive to the pool
    { p: 1.00, x: -0.2, y: -3.3, z: 1.2, flap: 0.0 }, // land in the pool
  ];

  const smooth = (t) => t * t * (3 - 2 * t);
  function sample(p) {
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1];
      if (p >= a.p && p <= b.p) {
        const t = smooth((p - a.p) / (b.p - a.p));
        const k = (key) => a[key] + (b[key] - a[key]) * t;
        return { x: k('x'), y: k('y'), z: k('z'), flap: k('flap') };
      }
    }
    return { ...path[path.length - 1] };
  }

  const state = { p: 0 };
  ScrollTrigger.create({
    trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: 1.0,
    onUpdate: (self) => { state.p = self.progress; },
  });

  // ---------- Render loop ----------
  let heading = -0.4; // current screen-plane facing (radians)
  const clock = new THREE.Clock();
  function tick() {
    const t = clock.getElapsedTime();
    const p = state.p;
    const s = sample(p);

    // Heading from path tangent → bird body (+Y) points along travel
    const ahead = sample(Math.min(1, p + 0.02));
    let dx = ahead.x - s.x, dy = ahead.y - s.y;
    let target = (Math.hypot(dx, dy) > 0.0006) ? Math.atan2(dy, dx) - Math.PI / 2 : heading;
    if (s.flap < 0.12) target = 0;               // perched: upright
    let diff = ((target - heading + Math.PI) % (Math.PI * 2)) - Math.PI;
    heading += diff * 0.10;                       // smooth, banked turn

    // Position with gentle idle bob (fades as it perches)
    dove.position.x = s.x + Math.sin(t * 0.6) * 0.10 * s.flap;
    dove.position.y = s.y + Math.sin(t * 1.6) * 0.10 * s.flap;
    dove.position.z = s.z;
    dove.rotation.z = heading;

    // Calm wing-beat about the body axis (gliding); tuck wings when perched
    const beat = Math.sin(t * 5.0) * (0.38 * s.flap);
    wingL.rotation.y =  beat + 0.04;
    wingR.rotation.y = -beat - 0.04;
    const fold = 1 - s.flap;
    wingL.rotation.z =  fold * 0.45;
    wingR.rotation.z = -fold * 0.45;

    // Motes drift up slowly and wrap
    const mp = moteGeo.attributes.position;
    for (let i = 0; i < MOTES; i++) {
      let y = mp.getY(i) + 0.004 + Math.sin(t * 0.3 + moteSeed[i]) * 0.0008;
      let x = mp.getX(i) + Math.sin(t * 0.2 + moteSeed[i]) * 0.0015;
      if (y > 6.5) y = -6.5;
      mp.setY(i, y);
      mp.setX(i, x);
    }
    mp.needsUpdate = true;
    motes.rotation.z = Math.sin(t * 0.05) * 0.05;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  // ---------- Scroll hint fade ----------
  const scrollHint = document.getElementById('scroll-hint');
  if (scrollHint) {
    ScrollTrigger.create({
      trigger: 'main', start: 'top top', end: '5% top', scrub: 0.4,
      onUpdate: (self) => { scrollHint.style.opacity = (1 - self.progress).toFixed(2); },
    });
  }

  hideLoader(300);
}

// ===========================================================
// THE MOVIE — one continuous scene, one layer of words at a time.
// Each layer rises from the mist, sharpens at centre, then dissolves
// and recedes as the next emerges. Scrubbed to scroll = film, not slides.
// ===========================================================
gsap.utils.toArray('.section').forEach((sec) => {
  const inner = sec.querySelector('.hero-inner, .section-inner');
  const ghost = sec.querySelector('.section-ghost');

  // Content fades + sharpens in as it enters, then STAYS (continuous document,
  // not a slideshow). The hero is left alone — it just shows and scrolls away.
  if (inner && !sec.classList.contains('section--hero')) {
    gsap.from(inner, {
      scrollTrigger: { trigger: sec, start: 'top 78%', toggleActions: 'play none none none' },
      opacity: 0, filter: 'blur(16px)', yPercent: 8,
      duration: 1.0, ease: 'power3.out', clearProps: 'filter',
    });
  }

  // Ghost word drifts continuously through its section (parallax, stays present)
  if (ghost) {
    gsap.fromTo(ghost, { yPercent: 30 }, {
      yPercent: -30, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 1 },
    });
  }
});

// ---------- Init helpers ----------
initModal(lenis);
initCursor();
initDecode();
initTilt();
initMagnetic();
