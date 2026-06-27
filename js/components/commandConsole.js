// Command console — terminal log feed
import { el } from '../utils/dom.js';
import { bus, Events } from '../eventBus.js';
import { uid } from '../utils/id.js';
import { formatHMS } from '../utils/format.js';
import { state } from '../state.js';

const LEVEL_STYLES = {
  INFO: 'console__level--INFO',
  WARN: 'console__level--WARN',
  SUCCESS: 'console__level--SUCCESS',
  ERROR: 'console__level--ERROR',
};

const SYNTHETIC_MESSAGES = [
  { level: 'INFO', source: 'SAT', msg: 'Heartbeat received from AAROHI-1 — nominal' },
  { level: 'INFO', source: 'GND', msg: 'Downlink carrier lock established' },
  { level: 'INFO', source: 'SYS', msg: 'GPU thermal envelope within bounds' },
  { level: 'INFO', source: 'API', msg: 'Coverage tile queue refreshed' },
  { level: 'INFO', source: 'AI', msg: 'Model weights cache hit — SwinIR-M ready' },
  { level: 'INFO', source: 'SAT', msg: 'Star tracker attitude updated' },
  { level: 'INFO', source: 'GND', msg: 'Scheduled pass window opening in 4m 32s' },
  { level: 'INFO', source: 'SYS', msg: 'Telemetry frame sync OK' },
];

let activeFilter = 'ALL';

function createLine({ level, source, message, time }) {
  return el('div', { class: 'console__line' }, [
    el('span', { class: 'console__time', textContent: time || formatHMS() }),
    el('span', { class: `console__level ${LEVEL_STYLES[level] || ''}`, textContent: `[${level}]` }),
    el('span', { class: 'console__source', textContent: source ? `[${source}]` : '' }),
    el('span', { class: 'console__msg', textContent: message }),
  ]);
}

function appendToConsole({ level = 'INFO', source = '', message = '', time }) {
  const root = document.getElementById('console-body');
  if (!root) return;
  if (activeFilter !== 'ALL' && activeFilter !== level) return;
  const line = createLine({ level, source, message, time });
  line.id = uid('log');
  root.appendChild(line);
  // Auto-scroll
  root.scrollTop = root.scrollHeight;
  // Trim to 250
  while (root.children.length > 250) root.firstChild.remove();
}

export function mountCommandConsole(root) {
  const panel = el('section', { class: 'panel', id: 'section-console', 'aria-label': 'Command console' }, [
    el('header', { class: 'panel__header' }, [
      el('span', { class: 'panel__led' }),
      el('h2', { class: 'panel__title', textContent: 'Command Console' }),
      el('span', { class: 'panel__subtitle', textContent: 'LIVE' }),
    ]),
  ]);

  const consoleEl = el('div', { class: 'console' });
  const head = el('div', { class: 'console__head' });
  head.appendChild(el('span', { textContent: '> aaakshaya@mission-control:~$' }));
  const filters = el('div', { class: 'console__filters' });
  ['ALL', 'INFO', 'WARN', 'ERROR'].forEach((f) => {
    const btn = el('button', {
      class: `console__filter ${f === 'ALL' ? 'is-active' : ''}`,
      textContent: f,
      onclick: () => {
        activeFilter = f;
        [...filters.children].forEach((c) => c.classList.remove('is-active'));
        btn.classList.add('is-active');
        // Re-render
        const body = document.getElementById('console-body');
        body.innerHTML = '';
        state.console.lines.forEach((l) => {
          if (f === 'ALL' || f === l.level) body.appendChild(createLine(l));
        });
      },
    });
    filters.appendChild(btn);
  });
  head.appendChild(filters);
  consoleEl.appendChild(head);

  const body = el('div', { class: 'console__body', id: 'console-body' });
  consoleEl.appendChild(body);

  const scan = el('div', { class: 'console__scan' });
  consoleEl.appendChild(scan);

  panel.appendChild(consoleEl);
  root.appendChild(panel);

  // Subscribe to bus
  bus.on(Events.CONSOLE_APPEND, (entry) => {
    const line = { ...entry, time: entry.time || formatHMS() };
    state.console.lines.push(line);
    if (state.console.lines.length > 250) state.console.lines.shift();
    appendToConsole(line);
  });

  // Initial seed
  const seed = [
    { level: 'INFO', source: 'SYS', message: 'AAKASHAYA Mission Control online' },
    { level: 'INFO', source: 'SAT', message: 'Carrier link established with AAROHI-1 (latency 142ms)' },
    { level: 'INFO', source: 'AI', message: 'Inference cluster — 6/6 GPUs ready' },
    { level: 'SUCCESS', source: 'API', message: 'Coverage telemetry synchronized' },
    { level: 'INFO', source: 'GND', message: 'Awaiting upload to begin processing pipeline' },
  ];
  seed.forEach((s, i) => setTimeout(() => bus.emit(Events.CONSOLE_APPEND, s), i * 120));

  // Synthetic feed
  setInterval(() => {
    if (document.hidden) return;
    const m = SYNTHETIC_MESSAGES[Math.floor(Math.random() * SYNTHETIC_MESSAGES.length)];
    bus.emit(Events.CONSOLE_APPEND, m);
  }, 2200);
}