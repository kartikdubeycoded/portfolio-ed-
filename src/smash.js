import Matter from 'matter-js';

/* =============================================================
   Text break-and-rejoin. Each word of the big display type gets a
   2D physics body tethered to its home slot by a spring. A "smasher"
   body rides the cursor (where the astronaut is diving): words get
   shoved aside and spring back. The astronaut is *behind* the text,
   so the words scatter to reveal him through the gap.
   Skips touch/small screens + reduced-motion.
   ============================================================= */

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce && innerWidth > 760 && matchMedia('(pointer: fine)').matches) {
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', initSmash);
  else initSmash();
}

function initSmash() {
  const { Engine, Bodies, Body, Composite, Constraint } = Matter;
  const targets = [...document.querySelectorAll('.hero-name, main h2')];
  const words = [];

  // wrap each WORD: outer span holds layout, inner span gets the transform.
  // (preserves <br> and other inline nodes so the heading still lays out right)
  targets.forEach((el) => {
    const frag = document.createDocumentFragment();
    [...el.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach((tok) => {
          if (/\S/.test(tok)) {
            const outer = document.createElement('span'); outer.className = 'smash-w';
            const inner = document.createElement('span'); inner.className = 'smash-i';
            inner.textContent = tok; outer.appendChild(inner); frag.appendChild(outer);
            words.push({ outer, inner });
          } else if (tok.length) {
            frag.appendChild(document.createTextNode(tok));
          }
        });
      } else {
        frag.appendChild(node.cloneNode(true));
      }
    });
    el.textContent = ''; el.appendChild(frag);
  });
  if (!words.length) return;

  const engine = Engine.create();
  engine.gravity.x = 0; engine.gravity.y = 0;
  const world = engine.world;

  // a body + home spring for every word
  words.forEach((w) => {
    const r = w.outer.getBoundingClientRect();
    w.home = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    const body = Bodies.rectangle(w.home.x, w.home.y, Math.max(r.width, 8), Math.max(r.height, 8),
      { frictionAir: 0.14, restitution: 0.5, density: 0.0008 });
    const spring = Constraint.create({ bodyA: body, pointB: { x: w.home.x, y: w.home.y }, stiffness: 0.028, damping: 0.085, length: 0 });
    Composite.add(world, [body, spring]);
    w.body = body; w.spring = spring;
  });

  // the smasher rides the cursor (= where the astronaut is diving)
  const smasher = Bodies.circle(-9999, -9999, 78, { isStatic: true });
  Composite.add(world, smasher);
  addEventListener('pointermove', (e) => Body.setPosition(smasher, { x: e.clientX, y: e.clientY }), { passive: true });
  addEventListener('pointerleave', () => Body.setPosition(smasher, { x: -9999, y: -9999 }));

  // Anchor sync. Full re-read (getBoundingClientRect) is a layout-forcing reflow —
  // doing it every scroll frame is what made scrolling stutter. So: full refresh
  // ONLY on resize; while scrolling, just shift anchors by the scroll delta (no reads).
  let needResize = false;
  let lastScrollY = window.scrollY;
  addEventListener('resize', () => { needResize = true; }, { passive: true });
  function refreshAnchors() {
    lastScrollY = window.scrollY;
    words.forEach((w) => {
      const r = w.outer.getBoundingClientRect();
      w.home.x = r.left + r.width / 2; w.home.y = r.top + r.height / 2;
      w.spring.pointB.x = w.home.x; w.spring.pointB.y = w.home.y;
    });
    needResize = false;
  }

  let last = performance.now();
  function loop(now) {
    if (needResize) refreshAnchors();
    const sy = window.scrollY;
    if (sy !== lastScrollY) {                       // cheap: shift anchors, no layout reads
      const d = sy - lastScrollY; lastScrollY = sy;
      for (const w of words) { w.home.y -= d; w.spring.pointB.y = w.home.y; }
    }
    Engine.update(engine, Math.min(now - last, 33)); last = now;
    for (const w of words) {
      const dx = w.body.position.x - w.home.x;
      const dy = w.body.position.y - w.home.y;
      w.inner.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${w.body.angle.toFixed(3)}rad)`;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
