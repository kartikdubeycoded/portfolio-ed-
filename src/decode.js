// Decoding/scramble text reveal — letters cycle through random glyphs
// then settle to the final character. Triggered on intersection.

const GLYPHS = '!<>-_\\/[]{}—=+*^?#§∆Ωαβγδ';

function scrambleOnce(el, finalText, durationMs) {
  const chars = finalText.split('');
  const start = performance.now();

  return new Promise((resolve) => {
    function frame(now) {
      const t = Math.min(1, (now - start) / durationMs);
      const out = chars.map((c, i) => {
        // when reveal reaches this letter, lock it
        const reveal = i / chars.length;
        if (t >= reveal + 0.04) return c;
        if (c === ' ') return ' ';
        if (c === '\n') return '\n';
        return GLYPHS[(Math.random() * GLYPHS.length) | 0];
      });
      el.textContent = out.join('');
      if (t < 1) requestAnimationFrame(frame);
      else { el.textContent = finalText; resolve(); }
    }
    requestAnimationFrame(frame);
  });
}

export function initDecode() {
  const targets = document.querySelectorAll('[data-decode]');

  // capture original text and clear initial frame so it doesn't flash
  targets.forEach((el) => {
    if (!el.dataset.original) {
      el.dataset.original = el.textContent;
      // brief placeholder of zero-width spaces of same length to avoid layout shift
    }
  });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset.decoded === '1') return;
      el.dataset.decoded = '1';
      const txt = el.dataset.original;
      scrambleOnce(el, txt, Math.min(900, 320 + txt.length * 22));
    });
  }, { threshold: 0.4, rootMargin: '0px 0px -10% 0px' });

  targets.forEach((el) => obs.observe(el));
}
