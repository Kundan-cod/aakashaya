// Glitch text animation — RGB shift + char swaps
export async function glitchText(node, finalText, { durationMs = 600, intensity = 0.4 } = {}) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { node.textContent = finalText; return; }
  const chars = '!@#$%^&*<>?/|\\=+';
  const start = performance.now();
  return new Promise((resolve) => {
    function frame(now) {
      const t = Math.min(1, (now - start) / durationMs);
      const reveal = Math.floor(t * finalText.length);
      let display = '';
      for (let i = 0; i < finalText.length; i++) {
        if (i < reveal) display += finalText[i];
        else if (Math.random() < intensity) display += chars[Math.floor(Math.random() * chars.length)];
        else display += finalText[i];
      }
      node.textContent = display;
      // RGB-shift shadow
      const shift = (1 - t) * 3;
      node.style.textShadow = `${-shift}px 0 var(--c-magenta), ${shift}px 0 var(--c-cyan)`;
      if (t < 1) requestAnimationFrame(frame);
      else { node.textContent = finalText; node.style.textShadow = ''; resolve(); }
    }
    requestAnimationFrame(frame);
  });
}