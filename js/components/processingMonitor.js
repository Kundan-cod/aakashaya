// Processing monitor — progress overlay while pipeline runs
import { el } from '../utils/dom.js';
import { state } from '../state.js';
import { bus, Events } from '../eventBus.js';
import { PIPELINE_STAGES } from '../api/pipelineStages.js';

export function mountProcessingMonitor(root) {
  const panel = el('section', { class: 'panel', id: 'section-processing', 'aria-label': 'Processing monitor' }, [
    el('header', { class: 'panel__header' }, [
      el('span', { class: 'panel__led panel__led--warn' }),
      el('h2', { class: 'panel__title', textContent: 'Processing Monitor' }),
      el('span', { class: 'panel__subtitle', textContent: 'INFERENCE CLUSTER' }),
    ]),
  ]);

  const body = el('div', { class: 'panel__body' });
  panel.appendChild(body);

  const overlay = el('div', { class: 'processing-overlay', id: 'processing-overlay' }, [
    el('div', { class: 'processing-ring' }),
    el('div', { class: 'processing-overlay__title', textContent: 'AI Inference Running' }),
    el('div', { class: 'processing-overlay__stage', id: 'processing-stage', textContent: 'Awaiting input…' }),
    el('div', { class: 'processing-overlay__pct', id: 'processing-pct', textContent: '0%' }),
    el('div', { class: 'progress processing-overlay__bar' }, [
      el('div', { class: 'progress__bar', id: 'processing-bar' }),
    ]),
  ]);
  body.appendChild(overlay);

  // Live metrics (always shown)
  const live = el('div', { class: 'subgrid' });
  live.appendChild(el('div', { class: 'metric-tile' }, [
    el('div', { class: 'metric-tile__label', textContent: 'Current Stage' }),
    el('div', { class: 'metric-tile__value', id: 'pm-stage', textContent: '—' }),
  ]));
  live.appendChild(el('div', { class: 'metric-tile' }, [
    el('div', { class: 'metric-tile__label', textContent: 'Model' }),
    el('div', { class: 'metric-tile__value', id: 'pm-model', textContent: '—' }),
  ]));
  live.appendChild(el('div', { class: 'metric-tile' }, [
    el('div', { class: 'metric-tile__label', textContent: 'Sub-progress' }),
    el('div', { class: 'progress' }, [el('div', { class: 'progress__bar', id: 'pm-bar' })]),
  ]));
  live.appendChild(el('div', { class: 'metric-tile' }, [
    el('div', { class: 'metric-tile__label', textContent: 'Total Progress' }),
    el('div', { class: 'metric-tile__value', id: 'pm-total', textContent: '0%' }),
  ]));
  body.appendChild(live);

  root.appendChild(panel);

  const stageEl = panel.querySelector('#processing-stage');
  const pctEl = panel.querySelector('#processing-pct');
  const barEl = panel.querySelector('#processing-bar');
  const pmStage = panel.querySelector('#pm-stage');
  const pmModel = panel.querySelector('#pm-model');
  const pmBar = panel.querySelector('#pm-bar');
  const pmTotal = panel.querySelector('#pm-total');

  bus.on(Events.PIPELINE_START, () => {
    overlay.classList.add('is-active');
    stageEl.textContent = 'Initializing inference cluster…';
    pctEl.textContent = '0%';
    barEl.style.width = '0%';
  });
  bus.on(Events.PIPELINE_STAGE_START, ({ index, stage }) => {
    const cfg = PIPELINE_STAGES[index];
    stageEl.textContent = `[${index + 1}/${PIPELINE_STAGES.length}] ${cfg.label}`;
    pmStage.textContent = cfg.label;
    pmModel.textContent = cfg.model;
    pmBar.style.width = '0%';
  });
  bus.on(Events.PIPELINE_STAGE_PROGRESS, ({ stage, progress, totalProgress }) => {
    pmBar.style.width = `${progress * 100}%`;
    barEl.style.width = `${totalProgress * 100}%`;
    pctEl.textContent = `${Math.round(totalProgress * 100)}%`;
    pmTotal.textContent = `${Math.round(totalProgress * 100)}%`;
  });
  bus.on(Events.PIPELINE_COMPLETE, () => {
    overlay.classList.remove('is-active');
    pctEl.textContent = '100%';
    barEl.style.width = '100%';
    pmTotal.textContent = '100%';
    stageEl.textContent = 'Complete';
  });

  return panel;
}