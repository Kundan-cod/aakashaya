// Small reusable visual effect utilities
export function attachMagnetic(button, { strength = 0.3, range = 80 } = {}) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return () => {};
  let frame = 0;
  function onMove(e) {
    const r = button.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < range) {
      cancelAnimationFrame(frame);
      const tx = dx * strength;
      const ty = dy * strength;
      frame = requestAnimationFrame(() => {
        button.style.transform = `translate(${tx}px, ${ty}px)`;
      });
    } else {
      button.style.transform = '';
    }
  }
  function onLeave() { button.style.transform = ''; }
  button.addEventListener('mousemove', onMove);
  button.addEventListener('mouseleave', onLeave);
  return () => {
    button.removeEventListener('mousemove', onMove);
    button.removeEventListener('mouseleave', onLeave);
  };
}