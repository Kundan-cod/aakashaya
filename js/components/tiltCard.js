// 3D tilt on mousemove using CSS transform
export function attachTilt(card, { max = 8, perspective = 800, scale = 1.02 } = {}) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return () => {};
  let raf = 0;
  function onMove(e) {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      card.style.transform = `perspective(${perspective}px) rotateX(${-py * max}deg) rotateY(${px * max}deg) scale(${scale})`;
      const glare = card.querySelector('.tilt__glare');
      if (glare) {
        glare.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
        glare.style.setProperty('--my', `${(py + 0.5) * 100}%`);
      }
    });
  }
  function onLeave() {
    cancelAnimationFrame(raf);
    card.style.transform = '';
  }
  card.addEventListener('mousemove', onMove);
  card.addEventListener('mouseleave', onLeave);
  return () => {
    card.removeEventListener('mousemove', onMove);
    card.removeEventListener('mouseleave', onLeave);
  };
}