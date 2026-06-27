// Canvas2D neural network background — nodes + edges with traveling pulses
import { rafLoop } from '../utils/animation.js';

export function createNeuralNet(container, { nodes = 50, connectionDist = 130 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0.5;pointer-events:none;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let pts = []; let pulses = []; let raf; let running = true;

  function resize() {
    const r = container.getBoundingClientRect();
    canvas.width = r.width * window.devicePixelRatio;
    canvas.height = r.height * window.devicePixelRatio;
    if (pts.length === 0) {
      pts = Array.from({ length: nodes }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4 * window.devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.4 * window.devicePixelRatio,
        r: (1 + Math.random() * 2) * window.devicePixelRatio,
      }));
    }
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  function step() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    // Edges
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x; const dy = pts[i].y - pts[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < connectionDist * connectionDist * window.devicePixelRatio * window.devicePixelRatio) {
          const a = 1 - Math.sqrt(d2) / (connectionDist * window.devicePixelRatio);
          ctx.strokeStyle = `rgba(0, 240, 255, ${a * 0.25})`;
          ctx.lineWidth = 0.6 * window.devicePixelRatio;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
    }
    // Nodes
    pts.forEach((p) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = 'rgba(0, 240, 255, 0.8)';
      ctx.shadowBlur = 6 * window.devicePixelRatio;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    // Pulses along edges
    if (Math.random() < 0.06) {
      const a = pts[Math.floor(Math.random() * pts.length)];
      const b = pts[Math.floor(Math.random() * pts.length)];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < connectionDist * window.devicePixelRatio && len > 30) {
        pulses.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, t: 0, dur: 1.6 + Math.random() * 1.2 });
      }
    }
    pulses = pulses.filter((p) => {
      p.t += 0.016;
      const f = Math.min(1, p.t / p.dur);
      const x = p.x1 + (p.x2 - p.x1) * f;
      const y = p.y1 + (p.y2 - p.y1) * f;
      ctx.fillStyle = `rgba(255, 0, 234, ${1 - f})`;
      ctx.shadowColor = 'rgba(255, 0, 234, 0.9)';
      ctx.shadowBlur = 8 * window.devicePixelRatio;
      ctx.beginPath(); ctx.arc(x, y, 3 * window.devicePixelRatio, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      return f < 1;
    });
  }

  function loop() { if (running) { step(); raf = requestAnimationFrame(loop); } }
  loop();

  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running && !raf) raf = requestAnimationFrame(loop); });

  return { destroy() { running = false; cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); } };
}