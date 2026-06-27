// Semantic Earth Intelligence — top-N land cover bars, confidence ring, interpretation
import { el } from '../utils/dom.js';
import { bus, Events } from '../eventBus.js';
import { state } from '../state.js';
import { animateNumber } from '../utils/animation.js';
import { typeText } from '../effects/typing.js';

export function mountSemanticIntelligence(root) {
  const panel = el('section', { class: 'panel', id: 'section-semantic', 'aria-label': 'Semantic intelligence' }, [
    el('header', { class: 'panel__header' }, [
      el('span', { class: 'panel__led panel__led--magenta' }),
      el('h2', { class: 'panel__title', textContent: 'Semantic Earth Intelligence' }),
      el('span', { class: 'panel__subtitle', textContent: 'AI ANALYSIS' }),
    ]),
  ]);

  const body = el('div', { class: 'panel__body' });
  panel.appendChild(body);

  const intro = el('div', { class: 'muted mono', style: { fontSize: 'var(--fs-12)', marginBottom: 'var(--s-3)' }, textContent: 'Awaiting inference completion. Top land cover classes and confidence will populate here.' });
  body.appendChild(intro);

  // SVG defs (gradient)
  const svgDefs = el('svg', { width: '0', height: '0', style: { position: 'absolute' }, html: `
    <defs>
      <linearGradient id="confGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00f0ff"/>
        <stop offset="50%" stop-color="#7a5cff"/>
        <stop offset="100%" stop-color="#ff00ea"/>
      </linearGradient>
    </defs>
  ` });
  body.appendChild(svgDefs);

  const list = el('div', { class: 'semantic__list' });
  body.appendChild(list);

  const confidenceBlock = el('div', { class: 'semantic__confidence' });
  const ringWrap = el('div', { class: 'semantic__confidence-ring' });
  const circumference = 2 * Math.PI * 52;
  ringWrap.innerHTML = `
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle class="bg" cx="60" cy="60" r="52" />
      <circle class="fg" cx="60" cy="60" r="52" style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${circumference};" />
    </svg>
  `;
  ringWrap.appendChild(el('div', { class: 'semantic__confidence-value', textContent: '—' }));
  confidenceBlock.appendChild(ringWrap);

  const confSide = el('div', {}, [
    el('div', { class: 'section-title', textContent: 'AI Confidence' }),
    el('div', { class: 'muted mono', style: { fontSize: 'var(--fs-11)' }, textContent: 'Cross-validated across SwinIR, Pix2Pix, SegFormer, and YOLOv8 outputs.' }),
  ]);
  confidenceBlock.appendChild(confSide);
  body.appendChild(confidenceBlock);

  const interpretation = el('div', { style: { marginTop: 'var(--s-5)', paddingTop: 'var(--s-4)', borderTop: '1px solid var(--c-border-soft)' } }, [
    el('div', { class: 'section-title', textContent: 'Mission Interpretation' }),
    el('div', { class: 'semantic__interpretation', id: 'semantic-interpretation', textContent: '' }),
  ]);
  body.appendChild(interpretation);

  root.appendChild(panel);

  // Populate from state.report
  let filled = false;
  bus.on(Events.REPORT_READY, async () => {
    const r = state.report;
    if (!r) return;
    intro.textContent = `Mission analysis summary · ${r.metadata.coordinates.region}`;
    list.innerHTML = '';
    r.landCover.slice(0, 4).forEach((lc) => {
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
      list.appendChild(row);
      // animate
      requestAnimationFrame(() => { fill.style.width = `${lc.percent}%`; });
    });

    // Confidence ring
    const fg = ringWrap.querySelector('.fg');
    const valEl = ringWrap.querySelector('.semantic__confidence-value');
    fg.style.strokeDashoffset = circumference;
    requestAnimationFrame(() => { fg.style.strokeDashoffset = circumference * (1 - r.confidence); });
    animateNumber(0, r.confidence * 100, 1400, (v) => { valEl.textContent = `${v.toFixed(1)}%`; });

    // Interpretation typing
    const node = panel.querySelector('#semantic-interpretation');
    node.textContent = '';
    typeText(node, r.interpretation, { speed: 14 });

    filled = true;
  });

  return { panel };
}