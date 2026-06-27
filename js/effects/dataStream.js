// Matrix-rain data stream — decorative background

const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF';

export function createDataStream(container, { columns = 28, fps = 18 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0.18;pointer-events:none;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let drops = []; let cellW = 12; let cellH = 14; let last = 0; let raf = 0; let running = true;

  function resize() {
    const r = container.getBoundingClientRect();
    canvas.width = r.width * window.devicePixelRatio;
    canvas.height = r.height * window.devicePixelRatio;
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';
    cellW = Math.max(8, r.width / columns);
    cellH = cellW * 1.2;
    const cols = Math.floor(r.width / cellW);
    drops = Array.from({ length: cols }, () => Math.random() * r.height / cellH);
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  function tick(now) {
    if (!running) return;
    if (now - last < 1000 / fps) { raf = requestAnimationFrame(tick); return; }
    last = now;
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = 'rgba(2,6,23,0.18)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#00f0ff';
    ctx.font = `${cellH * 0.85 * window.devicePixelRatio}px "JetBrains Mono", monospace`;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
    ctx.shadowBlur = 4 * window.devicePixelRatio;
    drops.forEach((y, i) => {
      const ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      ctx.fillText(ch, i * cellW * window.devicePixelRatio, y * cellH * window.devicePixelRatio);
      drops[i] = (y * cellH * window.devicePixelRatio > h && Math.random() > 0.975) ? 0 : y + 0.4;
    });
    ctx.shadowBlur = 0;
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  return {
    destroy() { running = false; cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); },
  };
}