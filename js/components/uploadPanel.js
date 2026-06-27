// Upload panel — drag-drop with preview and initiate processing button
import { el } from '../utils/dom.js';
import { attachDropZone } from '../upload/dragDrop.js';
import { createPreview } from '../upload/imagePreview.js';
import { validateFile } from '../upload/fileValidator.js';
import { bus, Events } from '../eventBus.js';
import { state } from '../state.js';
import { attachMagnetic } from './magneticButton.js';
import { gradientForSeed } from '../api/textureBank.js';
import { toast } from './toastManager.js';

export function mountUploadPanel(root) {
  const panel = el('section', { class: 'panel tilt', id: 'section-upload', 'aria-label': 'Image upload' }, [
    el('header', { class: 'panel__header' }, [
      el('span', { class: 'panel__led panel__led--cyan' }),
      el('h2', { class: 'panel__title', textContent: 'Upload Infrared Image' }),
      el('span', { class: 'panel__subtitle', textContent: 'PNG · JPG · WEBP ≤ 25 MB' }),
    ]),
  ]);

  const body = el('div', { class: 'panel__body' });
  panel.appendChild(body);

  const subgrid = el('div', { class: 'subgrid' });

  // Drop zone
  const drop = el('label', { class: 'upload-zone', tabindex: '0', 'aria-label': 'Drag and drop or click to upload' }, [
    el('div', { class: 'upload-zone__scan' }),
    el('svg', { class: 'upload-zone__icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', html: `
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    `}),
    el('div', { class: 'upload-zone__title', textContent: 'Drag & Drop Infrared Frame' }),
    el('div', { class: 'upload-zone__hint', textContent: 'or click to browse · sample data available below' }),
    el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp', 'aria-label': 'File input' }),
  ]);
  const input = drop.querySelector('input');

  subgrid.appendChild(drop);

  // Preview pane
  const preview = el('div', { class: 'stack gap-2' });
  const previewTitle = el('div', { class: 'section-title', textContent: 'Preview' });
  preview.appendChild(previewTitle);

  const thumb = el('div', { class: 'preview-thumb', html: `
    <div class="preview-thumb__overlay"></div>
    <div class="preview-thumb__label">NO INPUT</div>
    <div style="aspect-ratio: 4/3; display:grid; place-items:center; background: rgba(0,0,0,0.4); color: var(--c-text-muted); font-family: var(--ff-mono); font-size: var(--fs-11); letter-spacing: 0.18em;">AWAITING IR FRAME</div>
  ` });
  preview.appendChild(thumb);

  const actions = el('div', { class: 'row gap-2', style: { flexWrap: 'wrap' } });
  const processBtn = el('button', { class: 'btn btn--primary', 'aria-label': 'Initiate processing', html: `
    <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    <span>Initiate Processing</span>
  ` });
  const sampleBtn = el('button', { class: 'btn btn--ghost btn--small', textContent: 'Load Sample' });
  const clearBtn = el('button', { class: 'btn btn--ghost btn--small', textContent: 'Clear' });
  processBtn.disabled = true;
  actions.appendChild(processBtn);
  actions.appendChild(sampleBtn);
  actions.appendChild(clearBtn);
  preview.appendChild(actions);

  const meta = el('div', { class: 'muted mono', style: { fontSize: 'var(--fs-11)' }, textContent: 'No file selected.' });
  preview.appendChild(meta);

  subgrid.appendChild(preview);
  body.appendChild(subgrid);

  panel.appendChild(el('div', { class: 'tilt__glare' }));
  root.appendChild(panel);

  // Generate a sample IR-style placeholder canvas (thermal-like gradient)
  async function generateSamplePreview() {
    const c = document.createElement('canvas');
    c.width = 800; c.height = 600;
    const ctx = c.getContext('2d');
    // base
    ctx.fillStyle = '#0a1f3a';
    ctx.fillRect(0, 0, 800, 600);
    // thermal gradient blobs
    const blobs = [
      { x: 200, y: 180, r: 180, color: '#ff3860' },
      { x: 500, y: 250, r: 220, color: '#ffb800' },
      { x: 350, y: 450, r: 160, color: '#3ad6ff' },
      { x: 650, y: 480, r: 140, color: '#00ff88' },
      { x: 120, y: 500, r: 100, color: '#ff00ea' },
    ];
    blobs.forEach((b) => {
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      grad.addColorStop(0, b.color + 'cc');
      grad.addColorStop(0.5, b.color + '55');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    });
    // noise
    const img = ctx.getImageData(0, 0, 800, 600);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 30;
      img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
      img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n));
      img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n));
    }
    ctx.putImageData(img, 0, 0);
    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke(); }
    for (let y = 0; y < 600; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke(); }
    return c.toDataURL('image/jpeg', 0.85);
  }

  async function setFile(file) {
    if (!file) {
      toast.error('Invalid file. Use PNG/JPG/WEBP up to 25 MB.');
      return;
    }
    try {
      const { dataUrl, width, height } = await createPreview(file);
      state.upload.file = { name: file.name, size: file.size, type: file.type };
      state.upload.previewUrl = dataUrl;
      state.upload.status = 'ready';
      renderPreview();
      meta.textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} KB · ${width}×${height}`;
      processBtn.disabled = false;
      bus.emit(Events.UPLOAD_RECEIVED, { file: state.upload.file, dataUrl });
      bus.emit(Events.CONSOLE_APPEND, { level: 'INFO', source: 'API', message: `Frame "${file.name}" staged for processing` });
    } catch (err) {
      toast.error(`Failed to load image: ${err.message}`);
    }
  }

  function renderPreview() {
    if (!state.upload.previewUrl) return;
    thumb.innerHTML = `
      <div class="preview-thumb__overlay"></div>
      <div class="preview-thumb__label">IR FRAME</div>
      <img src="${state.upload.previewUrl}" alt="Uploaded IR frame" style="width:100%; height:auto; display:block;" />
    `;
  }

  function clearFile() {
    state.upload.file = null;
    state.upload.previewUrl = null;
    state.upload.status = 'idle';
    thumb.innerHTML = `
      <div class="preview-thumb__overlay"></div>
      <div class="preview-thumb__label">NO INPUT</div>
      <div style="aspect-ratio: 4/3; display:grid; place-items:center; background: rgba(0,0,0,0.4); color: var(--c-text-muted); font-family: var(--ff-mono); font-size: var(--fs-11); letter-spacing: 0.18em;">AWAITING IR FRAME</div>
    `;
    meta.textContent = 'No file selected.';
    processBtn.disabled = true;
    bus.emit(Events.UPLOAD_CLEAR, {});
  }

  // Wire events
  attachDropZone(drop, (file, error) => { if (error) toast.error(error); else setFile(file); });
  input.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const v = validateFile(file);
    if (!v.ok) { toast.error(v.error); return; }
    setFile(file);
  });
  processBtn.addEventListener('click', () => {
    if (!state.upload.file) { toast.info('Upload an image first.'); return; }
    if (state.pipeline.running) { toast.warn('Pipeline already running.'); return; }
    bus.emit('ui:startProcessing', { file: state.upload.file });
  });
  sampleBtn.addEventListener('click', async () => {
    const dataUrl = await generateSamplePreview();
    state.upload.file = { name: `sample-ir-${Date.now()}.jpg`, size: 184320, type: 'image/jpeg' };
    state.upload.previewUrl = dataUrl;
    state.upload.status = 'ready';
    renderPreview();
    meta.textContent = 'sample-ir-frame.jpg · 184.3 KB · 800×600 (synthetic)';
    processBtn.disabled = false;
    bus.emit(Events.UPLOAD_RECEIVED, { file: state.upload.file, dataUrl });
    bus.emit(Events.CONSOLE_APPEND, { level: 'INFO', source: 'GND', message: 'Loaded synthetic sample frame for demonstration' });
    toast.success('Sample IR frame loaded');
  });
  clearBtn.addEventListener('click', () => { clearFile(); toast.info('Cleared'); });
  bus.on('ui:startProcessing', () => { /* main wires this to mockApi */ });

  attachMagnetic(processBtn, { strength: 0.4, range: 100 });

  return { setFile, clearFile };
}