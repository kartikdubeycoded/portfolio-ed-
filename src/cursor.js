export function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let cx = mx, cy = my;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  function tick() {
    // ease toward target — gives the cursor weight
    cx += (mx - cx) * 0.22;
    cy += (my - cy) * 0.22;
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(tick);
  }
  tick();

  const hotSelectors = 'a, button, [data-modal], [data-magnetic], .modal-close';
  document.querySelectorAll(hotSelectors).forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-hot'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-hot'));
  });
}
