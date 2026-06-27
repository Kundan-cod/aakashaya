// Animation utilities
export const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
export const easeSpring = (t) => {
  // simple spring overshoot
  return 1 - Math.cos(t * Math.PI * 2.5) * Math.exp(-3 * t);
};

export function rafLoop(callback) {
  let running = false; let last = 0; let raf = 0;
  function frame(ts) {
    if (!running) return;
    const dt = last ? (ts - last) / 1000 : 0;
    last = ts;
    callback(dt, ts);
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { if (!running) { running = true; last = 0; raf = requestAnimationFrame(frame); } return this; },
    stop() { running = false; cancelAnimationFrame(raf); return this; },
    get running() { return running; },
  };
}

export function ticker(intervalMs, callback) {
  let id = null;
  return {
    start() { if (id == null) { id = setInterval(callback, intervalMs); } return this; },
    stop() { if (id != null) { clearInterval(id); id = null; } return this; },
    get running() { return id != null; },
  };
}

export function animateNumber(from, to, duration, onUpdate, easing = easeOutExpo) {
  return new Promise((resolve) => {
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = easing(t);
      onUpdate(from + (to - from) * eased, t);
      if (t < 1) requestAnimationFrame(step); else resolve();
    }
    requestAnimationFrame(step);
  });
}

export function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }
