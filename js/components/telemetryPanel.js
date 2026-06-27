// Telemetry panel — live ticking telemetry rows
import { el } from '../utils/dom.js';
import { state } from '../state.js';
import { formatUptime } from '../utils/format.js';
import { bus, Events } from '../eventBus.js';
import { ticker } from '../utils/animation.js';

function makeSparkline(history, color) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'sparkline');
  svg.setAttribute('viewBox', '0 0 100 28');
  svg.setAttribute('preserveAspectRatio', 'none');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', color || '#00f0ff');
  path.setAttribute('stroke-width', '1.5');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);
  return { svg, path };
}

function updateSparkline(s, history, { inverse = false, fixedRange = null } = {}) {
  if (!history || history.length === 0) return;
  const min = fixedRange ? fixedRange[0] : Math.min(...history);
  const max = fixedRange ? fixedRange[1] : Math.max(...history);
  const range = max - min || 1;
  const stepX = 100 / (history.length - 1);
  const points = history.map((v, i) => {
    const norm = (v - min) / range;
    const y = inverse ? norm * 26 + 1 : (1 - norm) * 26 + 1;
    return `${(i * stepX).toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  s.path.setAttribute('d', `M${points.replace(/ /g, ' L')}`);
}

function makeRow(label, valueNode, extra = null) {
  return el('div', { class: 'telemetry__row' }, [
    el('span', { class: 'telemetry__label', textContent: label }),
    el('div', { class: 'telemetry__value' }, [valueNode, extra].filter(Boolean)),
  ]);
}

export function mountTelemetryPanel(root) {
  const t = state.telemetry;
  const panel = el('section', { class: 'panel telemetry', 'aria-label': 'Live telemetry' }, [
    el('header', { class: 'panel__header' }, [
      el('span', { class: 'panel__led panel__led--cyan' }),
      el('h2', { class: 'panel__title', textContent: 'Real-Time Telemetry' }),
      el('span', { class: 'panel__subtitle', textContent: 'SAT-AAROHI-1' }),
    ]),
  ]);

  const body = el('div', { class: 'panel__body' });
  panel.appendChild(body);

  const list = el('div', { class: 'telemetry__list' });
  body.appendChild(list);

  // Satellite ID
  const satRow = makeRow('Satellite ID', el('span', { textContent: t.satelliteId }));
  list.appendChild(satRow);

  // Orbit
  const orbitRow = makeRow('Orbit Status', el('span', { textContent: t.orbitStatus }));
  list.appendChild(orbitRow);

  // Coverage
  const covRow = makeRow('Coverage Region', el('span', { textContent: t.coverageRegion }));
  list.appendChild(covRow);

  // Data Feed (status + bar + sparkline)
  const feedVal = el('span', { textContent: 'STREAMING' });
  const feedBar = el('div', { class: 'telemetry__bar' });
  const feedBarFill = el('div', { class: 'telemetry__bar-fill' });
  feedBar.appendChild(feedBarFill);
  const feedRow = el('div', { class: 'telemetry__row telemetry__row--bar' }, [
    el('span', { class: 'telemetry__label', textContent: 'Data Feed' }),
    el('div', { class: 'telemetry__value' }, [feedVal, feedBar]),
  ]);
  list.appendChild(feedRow);
  const feedSpark = makeSparkline(t.dataFeed.history, '#00f0ff');
  list.appendChild(el('div', { class: 'telemetry__row' }, [
    el('span', { class: 'telemetry__label', textContent: 'Throughput' }),
    el('div', { class: 'telemetry__value' }, [feedSpark.svg]),
  ]));
  feedSpark.svg.setAttribute('viewBox', '0 0 200 28');

  // Signal strength
  const sigVal = el('span', { textContent: `${t.signalStrength.dbm.toFixed(1)} dBm` });
  const sigBar = el('div', { class: 'telemetry__bar' });
  const sigBarFill = el('div', { class: 'telemetry__bar-fill' });
  sigBar.appendChild(sigBarFill);
  const sigRow = el('div', { class: 'telemetry__row telemetry__row--bar' }, [
    el('span', { class: 'telemetry__label', textContent: 'Signal Strength' }),
    el('div', { class: 'telemetry__value' }, [sigVal, sigBar]),
  ]);
  list.appendChild(sigRow);
  const sigSpark = makeSparkline(t.signalStrength.history, '#00ff88');
  list.appendChild(el('div', { class: 'telemetry__row' }, [
    el('span', { class: 'telemetry__label', textContent: 'Quality' }),
    el('div', { class: 'telemetry__value' }, [sigSpark.svg]),
  ]));
  sigSpark.svg.setAttribute('viewBox', '0 0 200 28');

  // Processing queue
  const qVal = el('span', { textContent: `${t.processingQueue.count} items` });
  list.appendChild(makeRow('Processing Queue', qVal));
  const qSpark = makeSparkline(t.processingQueue.history, '#ffb800');
  list.appendChild(el('div', { class: 'telemetry__row' }, [
    el('span', { class: 'telemetry__label', textContent: 'Queue Trend' }),
    el('div', { class: 'telemetry__value' }, [qSpark.svg]),
  ]));
  qSpark.svg.setAttribute('viewBox', '0 0 200 28');

  // Mission uptime (live)
  const upVal = el('span', { textContent: '00:00:00' });
  list.appendChild(makeRow('Mission Uptime', upVal));

  // Last heartbeat
  const hbVal = el('span', { textContent: '—' });
  list.appendChild(makeRow('Last Heartbeat', hbVal));

  root.appendChild(panel);

  // Update function — called every second
  function update() {
    t.uptimeSec = Math.floor((Date.now() - startTime) / 1000);
    upVal.textContent = formatUptime(t.uptimeSec);
    const sig = -65 + Math.sin(Date.now() / 4000) * 4 + (Math.random() - 0.5) * 1.5;
    t.signalStrength.dbm = sig;
    t.signalStrength.quality = Math.max(0.6, Math.min(1, 1 + (sig + 75) / 30));
    t.signalStrength.history.push(sig);
    if (t.signalStrength.history.length > 60) t.signalStrength.history.shift();
    sigVal.textContent = `${sig.toFixed(1)} dBm`;
    sigBarFill.style.width = `${t.signalStrength.quality * 100}%`;

    const tp = 1700 + Math.sin(Date.now() / 3000) * 250 + Math.random() * 100;
    t.dataFeed.throughputKbps = Math.round(tp);
    t.dataFeed.history.push(tp);
    if (t.dataFeed.history.length > 60) t.dataFeed.history.shift();
    feedVal.textContent = `${t.dataFeed.throughputKbps} kbps`;
    feedBarFill.style.width = `${Math.min(100, (tp / 2400) * 100)}%`;

    if (Math.random() < 0.1) {
      t.processingQueue.count = Math.max(2, Math.min(12, t.processingQueue.count + (Math.random() > 0.5 ? 1 : -1)));
      t.processingQueue.history.push(t.processingQueue.count);
      if (t.processingQueue.history.length > 60) t.processingQueue.history.shift();
      qVal.textContent = `${t.processingQueue.count} items`;
    }
    hbVal.textContent = new Date().toLocaleTimeString();

    // Update sparklines
    feedSpark.path.setAttribute('d', sparkPath(t.dataFeed.history, '#00f0ff', { width: 200, height: 28 }));
    sigSpark.path.setAttribute('d', sparkPath(t.signalStrength.history, '#00ff88', { width: 200, height: 28 }));
    qSpark.path.setAttribute('d', sparkPath(t.processingQueue.history, '#ffb800', { width: 200, height: 28 }));
  }

  function sparkPath(data, color, { width, height }) {
    if (!data || data.length === 0) return '';
    const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1;
    const stepX = width / Math.max(1, data.length - 1);
    const points = data.map((v, i) => `${(i * stepX).toFixed(2)},${((1 - (v - min) / range) * (height - 4) + 2).toFixed(2)}`).join(' L');
    return `M${points}`;
  }

  // Initial render
  let startTime = Date.now() - t.uptimeSec * 1000;
  update();
  const tk = ticker(1000, update);
  tk.start();
  bus.on(Events.SPLASH_DONE, () => { startTime = Date.now(); });
  return panel;
}