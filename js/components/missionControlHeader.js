// Mission control header section — full-width status block (separate from top nav)
import { el } from '../utils/dom.js';
import { bus, Events } from '../eventBus.js';
import { state } from '../state.js';
import { attachTilt } from './tiltCard.js';
import { AI_ENGINES, MISSION } from '../config.js';
import { formatUptime } from '../utils/format.js';
import { ticker } from '../utils/animation.js';

export function mountMissionControlHeader(root) {
  const panel = el('section', { class: 'panel tilt', id: 'section-overview', 'aria-label': 'Mission control overview' }, [
    el('header', { class: 'panel__header' }, [
      el('span', { class: 'panel__led panel__led--cyan' }),
      el('h2', { class: 'panel__title', textContent: 'Mission Control · Live Status' }),
      el('span', { class: 'badge badge--online', textContent: 'MISSION ACTIVE' }),
    ]),
  ]);

  const body = el('div', { class: 'panel__body' });
  panel.appendChild(body);

  const hero = el('div', { class: 'row gap-4', style: { flexWrap: 'wrap', alignItems: 'center' } });
  body.appendChild(hero);

  // Mission tag + brand
  const brand = el('div', { class: 'stack gap-2', style: { flex: '1 1 300px' } });
  brand.appendChild(el('div', { class: 'mission-tag' }, [
    el('span', { class: 'mission-tag__dot' }),
    el('span', { textContent: `MISSION ${MISSION.id} · OPERATOR ${MISSION.operator}` }),
  ]));
  brand.appendChild(el('div', { style: { fontFamily: 'var(--ff-display)', fontSize: 'var(--fs-24)', letterSpacing: '0.18em', color: 'var(--c-text-primary)' }, textContent: 'From Infrared Vision to Earth Intelligence' }));
  brand.appendChild(el('div', { style: { fontFamily: 'var(--ff-mono)', fontSize: 'var(--fs-12)', color: 'var(--c-text-muted)', letterSpacing: '0.06em' }, textContent: `Launched ${MISSION.launchDate} · Status: ${MISSION.status}` }));
  hero.appendChild(brand);

  // Metric tiles
  const tiles = el('div', { class: 'grid-icons', style: { flex: '1 1 360px' } });
  const uptimeVal = el('div', { class: 'metric-tile__value', textContent: '00:00:00' });
  const queueVal = el('div', { class: 'metric-tile__value', textContent: '0' });
  const procVal = el('div', { class: 'metric-tile__value', textContent: 'IDLE' });
  const sigVal = el('div', { class: 'metric-tile__value', textContent: '—' });

  tiles.appendChild(el('div', { class: 'metric-tile' }, [
    el('div', { class: 'metric-tile__label', textContent: 'Mission Uptime' }),
    uptimeVal,
  ]));
  tiles.appendChild(el('div', { class: 'metric-tile' }, [
    el('div', { class: 'metric-tile__label', textContent: 'Queue Depth' }),
    queueVal,
  ]));
  tiles.appendChild(el('div', { class: 'metric-tile' }, [
    el('div', { class: 'metric-tile__label', textContent: 'Pipeline' }),
    procVal,
  ]));
  tiles.appendChild(el('div', { class: 'metric-tile' }, [
    el('div', { class: 'metric-tile__label', textContent: 'Signal (dBm)' }),
    sigVal,
  ]));
  hero.appendChild(tiles);

  // Engine grid
  const engines = el('div', { style: { marginTop: 'var(--s-4)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--s-3)' } });
  AI_ENGINES.forEach((eng) => {
    engines.appendChild(el('div', { class: 'metric-tile', style: { borderColor: 'rgba(0, 240, 255, 0.18)' } }, [
      el('div', { class: 'metric-tile__label', textContent: eng.label }),
      el('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginTop: 'var(--s-1)' } }, [
        el('span', { class: 'panel__led panel__led--cyan' }),
        el('span', { style: { fontFamily: 'var(--ff-mono)', fontSize: 'var(--fs-13)', color: 'var(--c-green)', letterSpacing: '0.06em' }, textContent: eng.status }),
      ]),
    ]));
  });
  body.appendChild(engines);

  // Glare
  panel.appendChild(el('div', { class: 'tilt__glare' }));
  attachTilt(panel, { max: 2.5, scale: 1.005 });
  root.appendChild(panel);

  // Tick updates
  const startTime = Date.now() - state.telemetry.uptimeSec * 1000;
  const tk = ticker(1000, () => {
    const up = Math.floor((Date.now() - startTime) / 1000);
    uptimeVal.textContent = formatUptime(up);
    queueVal.textContent = String(state.telemetry.processingQueue.count);
    sigVal.textContent = state.telemetry.signalStrength.dbm.toFixed(1);
    procVal.textContent = state.pipeline.running ? 'RUNNING' : 'IDLE';
    procVal.style.color = state.pipeline.running ? 'var(--c-gold)' : 'var(--c-cyan)';
  });
  tk.start();
  bus.on(Events.SPLASH_DONE, () => { /* no-op, already started */ });
  return panel;
}