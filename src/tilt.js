// Subtle 3D tilt on hover + radial highlight that tracks mouse position.

export function initTilt() {
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    let raf = 0;
    let targetRX = 0, targetRY = 0;
    let rx = 0, ry = 0;

    function loop() {
      rx += (targetRX - rx) * 0.18;
      ry += (targetRY - ry) * 0.18;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
      if (Math.abs(rx - targetRX) > 0.01 || Math.abs(ry - targetRY) > 0.01) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    }

    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      targetRY = (px - 0.5) * 6;   // tilt left/right
      targetRX = -(py - 0.5) * 6;  // tilt up/down
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
      if (!raf) raf = requestAnimationFrame(loop);
    });

    el.addEventListener('mouseleave', () => {
      targetRX = 0;
      targetRY = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    });
  });
}

export function initMagnetic() {
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    let raf = 0;
    let tx = 0, ty = 0, x = 0, y = 0;

    function loop() {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      el.style.transform = `translate(${x}px, ${y}px)`;
      if (Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    }

    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      tx = (e.clientX - cx) * 0.25;
      ty = (e.clientY - cy) * 0.25;
      if (!raf) raf = requestAnimationFrame(loop);
    });

    el.addEventListener('mouseleave', () => {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    });
  });
}
