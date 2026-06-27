// Mission timeline — horizontal 7 stages with progression marker
import { el } from '../utils/dom.js';
import { bus, Events } from '../eventBus.js';
import { state } from '../state.js';

const STAGES = [
  { id: 'signal',     label: 'Signal Acquired',       time: '08:18:42' },
  { id: 'upload',     label: 'Image Uploaded',        time: '08:19:08' },
  { id: 'enhance',    label: 'Enhancement Complete',  time: '08:21:34' },
  { id: 'colorize',   label: 'Colorization Complete', time: '08:23:11' },
  { id: 'semantic',   label: 'Semantic Analysis',     time: '08:24:46' },
  { id: 'detect',     label: 'Object Detection',      time: '08:25:21' },
  { id: 'report',     label: 'Report Generated',      time: '08:25:58' },
];

export function mountMissionTimeline(root) {
  const panel = el('section', { class: 'panel', id: 'section-timeline', 'aria-label': 'Mission timeline' }, [
    el('header', { class: 'panel__header' }, [
      el('span', { class: 'panel__led panel__led--cyan' }),
      el('h2', { class: 'panel__title', textContent: 'Mission Timeline' }),
      el('span', { class: 'panel__subtitle', textContent: 'OPERATIONAL' }),
    ]),
  ]);

  const body = el('div', { class: 'panel__body' });
  panel.appendChild(body);

  const timeline = el('div', { class: 'timeline' });
  const track = el('div', { class: 'timeline__track' });
  const progress = el('div', { class: 'timeline__progress' });
  track.appendChild(progress);
  timeline.appendChild(track);

  const nodeRefs = [];
  STAGES.forEach((s, i) => {
    const dot = el('div', { class: 'timeline__dot' });
    const label = el('div', { class: 'timeline__label', textContent: s.label });
    const time = el('div', { class: 'timeline__time', textContent: s.time });
    const node = el('div', {
      class: 'timeline__node',
      role: 'button',
      tabindex: '0',
      'aria-label': `${s.label} at ${s.time}`,
      'data-stage-id': s.id,
      'data-stage-index': String(i),
    }, [dot, label, time]);
    nodeRefs.push({ node, dot, label, time, stage: s });
    timeline.appendChild(node);
  });
  body.appendChild(timeline);

  root.appendChild(panel);

  // State — keep track of current and completed
  let completedUpTo = -1;
  let current = -1;

  function updateVisual() {
    nodeRefs.forEach((n, i) => {
      n.node.classList.remove('is-complete', 'is-current', 'is-future');
      if (i <= completedUpTo) n.node.classList.add('is-complete');
      else if (i === current) n.node.classList.add('is-current');
      else n.node.classList.add('is-future');
    });
    const pct = STAGES.length > 1 ? ((Math.max(current, completedUpTo)) / (STAGES.length - 1)) * 100 : 0;
    progress.style.width = `${pct}%`;
  }

  // Initially show first stage as current
  current = 0;
  completedUpTo = -1;
  updateVisual();

  // Auto-advance simulation
  let simIndex = 0;
  const simTimer = setInterval(() => {
    if (document.hidden) return;
    if (state.pipeline.running) return; // real processing takes over
    if (simIndex < STAGES.length - 1) {
      completedUpTo = simIndex;
      current = simIndex + 1;
      simIndex++;
      updateVisual();
    }
  }, 3500);

  // Wire to pipeline events
  bus.on(Events.PIPELINE_STAGE_COMPLETE, ({ index }) => {
    const stageMapping = ['signal', 'upload', 'enhance', 'colorize', 'semantic', 'detect', 'report'];
    const mapped = stageMapping.indexOf(stageMapping[index] || '');
    // Map pipeline stage index to timeline stage index approximately
    const tIndex = Math.min(STAGES.length - 1, Math.floor((index + 1) / 1.2));
    completedUpTo = Math.max(completedUpTo, tIndex);
    current = Math.min(STAGES.length - 1, tIndex + 1);
    updateVisual();
  });
  bus.on(Events.PIPELINE_COMPLETE, () => {
    completedUpTo = STAGES.length - 1;
    current = STAGES.length - 1;
    updateVisual();
  });

  // Click handlers
  nodeRefs.forEach((n) => {
    n.node.addEventListener('click', () => {
      const idx = parseInt(n.node.dataset.stageIndex, 10);
      completedUpTo = idx - 1;
      current = idx;
      updateVisual();
    });
    n.node.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' && idx < STAGES.length - 1) nodeRefs[idx + 1].node.focus();
      if (e.key === 'ArrowLeft' && idx > 0) nodeRefs[idx - 1].node.focus();
    });
  });

  return panel;
}