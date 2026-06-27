// Earth Intelligence Report — premium report card with export buttons
import { el } from '../utils/dom.js';
import { bus, Events } from '../eventBus.js';
import { state } from '../state.js';
import { animateNumber } from '../utils/animation.js';
import { attachTilt } from './tiltCard.js';
import { exportNodeToPng } from '../export/pngExport.js';
import { exportReportToPdf } from '../export/pdfExport.js';
import { exportReportToCsv } from '../export/csvExport.js';
import { toast } from './toastManager.js';

const ICONS = {
  PDF: '<svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6M9 17h6"/></svg>',
  PNG: '<svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
  CSV: '<svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
};

function detectionIcon(type) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 10v6m11-11h-6M7 12H1"/></svg>';
}

export function mountEarthIntelligenceReport(root) {
  const panel = el('section', { class: 'panel tilt', id: 'section-report', 'aria-label': 'Earth intelligence report' }, [
    el('header', { class: 'panel__header' }, [
      el('span', { class: 'panel__led panel__led--magenta' }),
      el('h2', { class: 'panel__title', textContent: 'Earth Intelligence Report' }),
      el('span', { class: 'panel__subtitle', textContent: 'AI-GENERATED' }),
    ]),
  ]);

  const body = el('div', { class: 'panel__body' });
  panel.appendChild(body);

  const empty = el('div', { class: 'muted mono', style: { fontSize: 'var(--fs-12)' }, textContent: 'Run the pipeline to generate the Earth Intelligence Report.' });
  body.appendChild(empty);

  const content = el('div', { id: 'report-content', style: { display: 'none' } });
  body.appendChild(content);

  const metaGrid = el('div', { class: 'subgrid' });
  content.appendChild(metaGrid);

  const metricsRow = el('div', { class: 'report' });
  content.appendChild(metricsRow);

  const landCoverSection = el('div', { class: 'report__section' });
  content.appendChild(landCoverSection);

  const detectSection = el('div', { class: 'report__section' });
  content.appendChild(detectSection);

  const interpSection = el('div', { class: 'report__section' });
  content.appendChild(interpSection);

  const exportRow = el('div', { class: 'report__export' });
  content.appendChild(exportRow);

  panel.appendChild(el('div', { class: 'tilt__glare' }));
  attachTilt(panel, { max: 2, scale: 1.005 });
  root.appendChild(panel);

  function renderReport(r) {
    empty.style.display = 'none';
    content.style.display = 'block';

    // Metadata tiles
    metaGrid.innerHTML = '';
    [
      ['Report ID', r.id, 'mono'],
      ['Region', `${r.metadata.coordinates.region}`, 'mono'],
      ['Coordinates', `${r.metadata.coordinates.lat.toFixed(2)}°, ${r.metadata.coordinates.lon.toFixed(2)}°`, 'mono'],
      ['Satellite', `${r.metadata.satellite}`, 'mono'],
      ['Sensor', r.metadata.sensor, 'mono'],
      ['Capture Time', new Date(r.metadata.captureTime).toLocaleTimeString(), 'mono'],
    ].forEach(([k, v, cls]) => {
      metaGrid.appendChild(el('div', { class: 'metric-tile' }, [
        el('div', { class: 'metric-tile__label', textContent: k }),
        el('div', { class: `metric-tile__value ${cls || ''}`, textContent: v, style: { fontSize: 'var(--fs-14)' } }),
      ]));
    });

    // Quality metrics
    metricsRow.innerHTML = '';
    metricsRow.appendChild(el('div', { class: 'section-title', style: { gridColumn: '1 / -1' }, textContent: 'Quality Metrics' }));
    const qTiles = [
      ['PSNR', r.quality.psnr.toFixed(2), 'dB', Math.min(1, (r.quality.psnr - 30) / 8)],
      ['SSIM', r.quality.ssim.toFixed(3), '', r.quality.ssim],
      ['FID', r.quality.fid.toFixed(1), 'lower = better', Math.max(0, 1 - r.quality.fid / 30)],
      ['Inference Time', (r.quality.inferenceTimeMs / 1000).toFixed(2), 's', Math.min(1, 10000 / Math.max(1000, r.quality.inferenceTimeMs))],
      ['AI Confidence', (r.confidence * 100).toFixed(1), '%', r.confidence],
    ];
    qTiles.forEach(([label, value, unit, ratio]) => {
      const tile = el('div', { class: 'report__metric' });
      tile.appendChild(el('div', { class: 'report__metric-label', textContent: label }));
      tile.appendChild(el('div', { class: 'report__metric-value' }, [
        document.createTextNode(value),
        el('small', { textContent: unit }),
      ]));
      const bar = el('div', { class: 'report__metric-bar' });
      tile.appendChild(bar);
      requestAnimationFrame(() => { bar.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`; });
      metricsRow.appendChild(tile);
    });

    // Land cover
    landCoverSection.innerHTML = '';
    landCoverSection.appendChild(el('div', { class: 'report__section-title', textContent: 'Detected Land Cover' }));
    const lcGrid = el('div', { class: 'semantic__list' });
    r.landCover.forEach((lc) => {
      const row = el('div', { class: 'semantic__row' });
      row.appendChild(el('div', { class: 'semantic__row-label', textContent: lc.class }));
      const bar = el('div', { class: 'semantic__bar' });
      const fill = el('div', { class: 'semantic__bar-fill' });
      fill.style.background = `linear-gradient(90deg, ${lc.color}, var(--c-magenta))`;
      fill.style.color = lc.color;
      fill.style.width = '0%';
      bar.appendChild(fill);
      row.appendChild(bar);
      row.appendChild(el('div', { class: 'semantic__row-value', textContent: `${lc.percent.toFixed(1)}%` }));
      lcGrid.appendChild(row);
      requestAnimationFrame(() => { fill.style.width = `${lc.percent}%`; });
    });
    landCoverSection.appendChild(lcGrid);

    // Detections
    detectSection.innerHTML = '';
    detectSection.appendChild(el('div', { class: 'report__section-title', textContent: `Detected Objects (${r.detections.length})` }));
    const det = el('div', { class: 'report__detections' });
    r.detections.forEach((d) => {
      det.appendChild(el('div', { class: 'report__detection' }, [
        el('span', { class: 'report__detection-icon', html: detectionIcon(d.type) }),
        el('span', { textContent: d.type }),
        el('span', { class: 'report__detection-conf', textContent: `${(d.confidence * 100).toFixed(1)}%` }),
      ]));
    });
    detectSection.appendChild(det);

    // Interpretation
    interpSection.innerHTML = '';
    interpSection.appendChild(el('div', { class: 'report__section-title', textContent: 'Semantic Interpretation' }));
    interpSection.appendChild(el('div', { class: 'semantic__interpretation', textContent: r.interpretation }));

    // Export buttons
    exportRow.innerHTML = '';
    const pdfBtn = el('button', { class: 'btn', html: `${ICONS.PDF}<span>Download PDF</span>` });
    const pngBtn = el('button', { class: 'btn', html: `${ICONS.PNG}<span>Download PNG</span>` });
    const csvBtn = el('button', { class: 'btn', html: `${ICONS.CSV}<span>Download CSV</span>` });
    exportRow.appendChild(pdfBtn);
    exportRow.appendChild(pngBtn);
    exportRow.appendChild(csvBtn);

    pdfBtn.addEventListener('click', async () => {
      try { await exportReportToPdf(r, `${r.id}.pdf`); toast.success('PDF exported'); }
      catch (e) { toast.error(`PDF export failed: ${e.message}`); }
    });
    pngBtn.addEventListener('click', async () => {
      try { await exportNodeToPng(panel, `${r.id}.png`); toast.success('PNG exported'); }
      catch (e) { toast.error(`PNG export failed: ${e.message}`); }
    });
    csvBtn.addEventListener('click', () => {
      try { exportReportToCsv(r, `${r.id}.csv`); toast.success('CSV exported'); }
      catch (e) { toast.error(`CSV export failed: ${e.message}`); }
    });
  }

  bus.on(Events.REPORT_READY, () => {
    if (state.report) renderReport(state.report);
  });

  return { panel };
}