// Before/after comparison slider
import { el } from '../utils/dom.js';
import { gradientForSeed } from '../api/textureBank.js';
import { state } from '../state.js';

export function mountBeforeAfterSlider(root) {
  const panel = el('section', { class: 'panel', id: 'section-slider', 'aria-label': 'Before after comparison' }, [
    el('header', { class: 'panel__header' }, [
      el('span', { class: 'panel__led panel__led--cyan' }),
      el('h2', { class: 'panel__title', textContent: 'Before / After · Visual Comparison' }),
      el('span', { class: 'panel__subtitle', textContent: 'IR vs COLORIZED' }),
    ]),
  ]);

  const body = el('div', { class: 'panel__body' });
  panel.appendChild(body);

  const slider = el('div', { class: 'ba-slider', id: 'ba-slider', role: 'slider', 'aria-label': 'Reveal slider', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '50', tabindex: '0' });
  slider.style.setProperty('--clip', '50%');

  const beforeLayer = el('div', { class: 'ba-slider__layer' });
  const beforeImg = el('img', { class: 'ba-slider__img', alt: 'Input IR frame', src: '' });
  beforeLayer.appendChild(beforeImg);

  const afterLayer = el('div', { class: 'ba-slider__layer ba-slider__after' });
  const afterImg = el('img', { class: 'ba-slider__img', alt: 'Enhanced colorized frame', src: '' });
  afterLayer.appendChild(afterImg);

  slider.appendChild(beforeLayer);
  slider.appendChild(afterLayer);

  const beforeLabel = el('div', { class: 'ba-slider__label', textContent: 'INPUT · IR' });
  const afterLabel = el('div', { class: 'ba-slider__label ba-slider__label--right', textContent: 'ENHANCED · COLORIZED' });
  slider.appendChild(beforeLabel);
  slider.appendChild(afterLabel);

  const handle = el('div', { class: 'ba-slider__handle' });
  const knob = el('div', { class: 'ba-slider__knob', textContent: '⇆' });
  handle.appendChild(knob);
  slider.appendChild(handle);

  body.appendChild(slider);

  // Status row
  const status = el('div', { class: 'row gap-2 muted mono', style: { marginTop: 'var(--s-3)', fontSize: 'var(--fs-11)' } });
  status.appendChild(el('span', { id: 'ba-status', textContent: 'Awaiting processed frame' }));
  body.appendChild(status);

  root.appendChild(panel);

  // Interaction
  let dragging = false;
  function setClip(pct) {
    pct = Math.max(0, Math.min(100, pct));
    slider.style.setProperty('--clip', `${pct}%`);
    slider.setAttribute('aria-valuenow', String(Math.round(pct)));
  }
  function onDown(e) { dragging = true; e.preventDefault(); onMove(e); }
  function onUp() { dragging = false; }
  function onMove(e) {
    if (!dragging && e.type !== 'click') return;
    const r = slider.getBoundingClientRect();
    const cx = (e.touches?.[0]?.clientX ?? e.clientX);
    const pct = ((cx - r.left) / r.width) * 100;
    setClip(pct);
  }
  function onKey(e) {
    const cur = parseFloat(slider.style.getPropertyValue('--clip')) || 50;
    if (e.key === 'ArrowLeft') { setClip(cur - 2); e.preventDefault(); }
    if (e.key === 'ArrowRight') { setClip(cur + 2); e.preventDefault(); }
  }
  slider.addEventListener('mousedown', onDown);
  window.addEventListener('mouseup', onUp);
  window.addEventListener('mousemove', onMove);
  slider.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('touchend', onUp);
  window.addEventListener('touchmove', onMove, { passive: false });
  slider.addEventListener('click', onMove);
  slider.addEventListener('keydown', onKey);

  // Generate "colorized" output as a gradient + canvas-rendered version of the input
  async function generateColorized(beforeDataUrl) {
    const c = document.createElement('canvas');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = beforeDataUrl;
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
    const w = Math.min(800, img.naturalWidth);
    const h = Math.round(w * (img.naturalHeight / img.naturalWidth));
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    // Create "colorized" version by remapping luminance to a thermal palette
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h);
    const PALETTE = [
      [10, 20, 60], [50, 30, 110], [120, 60, 180], [220, 90, 160],
      [255, 140, 90], [255, 200, 80], [180, 230, 110], [90, 220, 180],
      [30, 180, 220], [10, 100, 200], [5, 30, 90],
    ];
    for (let i = 0; i < data.data.length; i += 4) {
      const r = data.data[i]; const g = data.data[i + 1]; const b = data.data[i + 2];
      // luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const t = lum / 255;
      const idx = Math.min(PALETTE.length - 1, Math.max(0, Math.floor(t * (PALETTE.length - 1))));
      const next = Math.min(PALETTE.length - 1, idx + 1);
      const frac = t * (PALETTE.length - 1) - idx;
      const c0 = PALETTE[idx]; const c1 = PALETTE[next];
      data.data[i] = c0[0] + (c1[0] - c0[0]) * frac;
      data.data[i + 1] = c0[1] + (c1[1] - c0[1]) * frac;
      data.data[i + 2] = c0[2] + (c1[2] - c0[2]) * frac;
    }
    ctx.putImageData(data, 0, 0);
    // overlay subtle holographic grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    return c.toDataURL('image/jpeg', 0.88);
  }

  // Set initial empty preview
  function renderEmpty() {
    beforeImg.src = '';
    afterImg.src = '';
    beforeImg.style.background = 'rgba(0,0,0,0.4)';
    afterImg.style.background = 'rgba(0,0,0,0.4)';
  }
  renderEmpty();

  // Listen to pipeline completion to set images
  let lastPreviewUrl = null;
  let processedRendered = false;
  // Simpler: poll state via custom event
  document.addEventListener('aak:uploadPreviewChanged', () => {
    if (state.upload.previewUrl && state.upload.previewUrl !== lastPreviewUrl) {
      lastPreviewUrl = state.upload.previewUrl;
      beforeImg.style.background = '';
      beforeImg.src = state.upload.previewUrl;
      panel.querySelector('#ba-status').textContent = 'Awaiting processed frame';
    }
  });

  document.addEventListener('aak:pipelineComplete', async () => {
    if (!state.upload.previewUrl) return;
    try {
      const colorized = await generateColorized(state.upload.previewUrl);
      afterImg.style.background = '';
      afterImg.src = colorized;
      processedRendered = true;
      panel.querySelector('#ba-status').textContent = 'Colorized reconstruction ready';
    } catch (err) {
      console.error(err);
    }
  });

  return { panel };
}