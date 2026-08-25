// Wavy Canvas-Based Ghost Tail Cursor

const N = 22; // Number of segments in the tail
const nodes = [];
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let isHot = false;
let hotMix = 0;   // eased 0->1 hover state, drives the cursor ring

class TrailNode {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
  }
}

// Initialize nodes
for (let i = 0; i < N; i++) {
  nodes.push(new TrailNode(mouseX, mouseY));
}

// The astronaut's hand pins the END of the string (set each frame from main.js)
let handX = null, handY = null;
export function setAstronautHand(x, y) { handX = x; handY = y; }

export function initCursor() {
  // Check if canvas already exists
  if (document.getElementById('cursor-canvas')) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-canvas';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  // Only hide the native cursor once we KNOW a replacement is running. The CSS used to
  // do this unconditionally, so any device that skipped initCursor (touch laptops, or a
  // thrown error here) was left with no pointer at all.
  document.documentElement.classList.add('has-custom-cursor');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Track mouse coordinates
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  window.addEventListener('pointermove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Track hot elements (buttons, links, etc.)
  const updateHotListeners = () => {
    const hotSelectors = 'a, button, [data-doc], [data-magnetic], .modal-close, .row, .window-close';
    document.querySelectorAll(hotSelectors).forEach((el) => {
      el.addEventListener('mouseenter', () => { isHot = true; });
      el.addEventListener('mouseleave', () => { isHot = false; });
    });
  };
  updateHotListeners();
  
  // Periodically re-bind to handle dynamically loaded content if any
  setInterval(updateHotListeners, 2000);

  let time = 0;
  
  function tick() {
    time += 0.085;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Node 0 follows mouse
    nodes[0].x += (mouseX - nodes[0].x) * 0.35;
    nodes[0].y += (mouseY - nodes[0].y) * 0.35;

    // Propagate spring physics down the chain
    for (let i = 1; i < N; i++) {
      const prev = nodes[i - 1];
      const curr = nodes[i];
      const dx = prev.x - curr.x;
      const dy = prev.y - curr.y;
      
      curr.vx += dx * 0.18;
      curr.vy += dy * 0.18;
      curr.vx *= 0.58;
      curr.vy *= 0.58;
      curr.x += curr.vx;
      curr.y += curr.vy;
    }

    // Pin the tail's END to the astronaut's hand → the string spans cursor → hand,
    // so it reads as a tether he's holding (and waves like a real slack string).
    if (handX !== null) {
      nodes[N - 1].x = handX;
      nodes[N - 1].y = handY;
    }

    // Draw the wavy, tangling ghost shadow trails
    // We compute the drawn coordinates with perpendicular waving offsets
    const drawCoords = [];
    for (let i = 0; i < N; i++) {
      const prev = nodes[i - 1] || nodes[i];
      const next = nodes[i + 1] || nodes[i];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      
      // Normal vector
      const nx = -dy / len;
      const ny = dx / len;
      
      // Amplitude scales up along the tail
      const amp = 8.5 * (i / N);
      
      // Base phase offset
      const phase = time - i * 0.45;
      
      drawCoords.push({
        x: nodes[i].x,
        y: nodes[i].y,
        nx,
        ny,
        amp,
        phase
      });
    }

    // Layer 1: Wavy cursor shadows (faint wide wave). NOTE: canvas shadowBlur is
    // very expensive per-frame — left off to keep scrolling smooth.
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const c = drawCoords[i];
      // Wider wobbly shadow offset
      const offset = Math.sin(c.phase * 0.8) * c.amp * 1.5;
      const x = c.x + c.nx * offset;
      const y = c.y + c.ny * offset;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(10, 10, 10, 0.08)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.shadowBlur = 0; // reset shadow

    // Layer 2: Opposite phase tangled ribbon (medium opacity)
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const c = drawCoords[i];
      // Wave offset in opposite direction
      const offset = Math.sin(c.phase + Math.PI) * c.amp * 1.1;
      const x = c.x + c.nx * offset;
      const y = c.y + c.ny * offset;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(10, 10, 10, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Layer 3: Main snaking line (thick-to-thin, dark opacity)
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const c = drawCoords[i];
      const offset = Math.sin(c.phase) * c.amp;
      const x = c.x + c.nx * offset;
      const y = c.y + c.ny * offset;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(10, 10, 10, 0.55)';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // ---- THE CURSOR HEAD ----
    // Without this there is no pointer on the page at all: the native cursor is hidden
    // in CSS and the trail above collapses to a ~3px smudge whenever the mouse is still.
    // The head is the thing you actually point with; the tail is decoration behind it.
    hotMix += ((isHot ? 1 : 0) - hotMix) * 0.18;          // eased hover state

    const hx = nodes[0].x, hy = nodes[0].y;
    const ringR = 9 + hotMix * 9;                          // ring opens up over links

    // outer ring — grows and darkens on anything clickable
    ctx.beginPath();
    ctx.arc(hx, hy, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(10, 10, 10, ${0.28 + hotMix * 0.42})`;
    ctx.lineWidth = 1.25;
    ctx.stroke();

    // cream halo so the head stays visible over dark planets and ring bands
    ctx.beginPath();
    ctx.arc(hx, hy, 4.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(244, 241, 234, 0.9)';
    ctx.fill();

    // solid core — shrinks slightly as the ring opens, so the pair reads as a "target"
    ctx.beginPath();
    ctx.arc(hx, hy, 3.2 - hotMix * 1.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10, 10, 10, 0.92)';
    ctx.fill();

    requestAnimationFrame(tick);
  }

  tick();
}

let lastAngle = 0;

// Computes target for astronaut in screen space (always at least 2cm / 75px away from mouse, trails full tail when moving)
export function getCursorTailTarget() {
  if (nodes.length < 2) {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }
  
  const lastNode = nodes[N - 1];
  
  // Calculate vector from mouse to last node of the tail
  const dx = lastNode.x - mouseX;
  const dy = lastNode.y - mouseY;
  const dist = Math.hypot(dx, dy);
  
  if (dist > 0.5) {
    lastAngle = Math.atan2(dy, dx);
  }
  
  // 75px (~2cm) is the minimum distance from the cursor (mouse) to the astronaut
  const minDistance = 75;
  
  let targetX = lastNode.x;
  let targetY = lastNode.y;
  
  if (dist < minDistance) {
    // If the tail is collapsed or shorter than 2cm, we push the target out
    // along the heading direction so the astronaut is always at least 2cm away from the mouse
    targetX = mouseX + Math.cos(lastAngle) * minDistance;
    targetY = mouseY + Math.sin(lastAngle) * minDistance;
  }
  
  return { x: targetX, y: targetY };
}
