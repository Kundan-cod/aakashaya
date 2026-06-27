// Mission control header — top nav with mission status, AI engine LEDs, health
import { el } from '../utils/dom.js';
import { AI_ENGINES } from '../config.js';
import { bus } from '../eventBus.js';
import { state } from '../state.js';
import { attachTilt } from '../components/tiltCard.js';
import { animateNumber } from '../utils/animation.js';

export function mountNavBar(root) {
  const nav = el('nav', { class: 'nav tilt', 'aria-label': 'Mission status' });

  // Brand
  const brand = el('div', { class: 'nav__brand' }, [
    el('div', { class: 'nav__brand-mark' }, [
      el('span', { class: 'orbit o1' }),
      el('span', { class: 'orbit o2' }),
      el('span', { class: 'dot' }),
    ]),
    el('div', {}, [
      el('div', { textContent: 'AAKASHAYA' }),
      el('small', { textContent: 'Infrared Satellite Intelligence' }),
    ]),
  ]);
  nav.appendChild(brand);

  // AI engines
  const engines = el('div', { class: 'nav__engines' });
  AI_ENGINES.forEach((eng) => {
    engines.appendChild(el('span', {
      class: 'badge badge--online',
      title: `${eng.label}: ${eng.status}`,
    }, [
      el('span', { textContent: eng.label }),
    ]));
  });
  nav.appendChild(engines);

  // System health ring
  const health = el('div', { class: 'nav__health' });
  const ringWrap = el('div', { class: 'nav__health-ring' });
  const circumference = 2 * Math.PI * 18;
  ringWrap.innerHTML = `
    <svg width="44" height="44" viewBox="0 0 44 44">
      <circle class="bg" cx="22" cy="22" r="18" />
      <circle class="fg" cx="22" cy="22" r="18" style="stroke-dasharray: ${circumference}; stroke-dashoffset: 0;" />
    </svg>
  `;
  health.appendChild(ringWrap);
  const text = el('div', {}, [
    el('div', { class: 'nav__health-text', textContent: '100%' }),
    el('span', { class: 'nav__health-sub', textContent: 'System Health' }),
  ]);
  health.appendChild(text);
  nav.appendChild(health);

  // Tilt + glare
  const glare = el('div', { class: 'tilt__glare' });
  nav.appendChild(glare);
  attachTilt(nav, { max: 3, scale: 1.005 });

  root.appendChild(nav);

  // Initial health pulse from 0 → 100 on mount
  const fg = ringWrap.querySelector('.fg');
  const txt = text.querySelector('.nav__health-text');
  fg.style.strokeDashoffset = circumference;
  txt.textContent = '0%';
  requestAnimationFrame(() => {
    fg.style.strokeDashoffset = 0;
    animateNumber(0, 100, 1400, (v) => { txt.textContent = `${Math.round(v)}%`; });
  });

  // Pulse animation on small drops/rises from mock API
  bus.on('state:set', ({ path }) => {
    if (path === 'pipeline.running') {
      const color = state.pipeline.running ? 'var(--c-gold)' : 'var(--c-green)';
      txt.style.color = color;
      fg.style.stroke = color;
    }
  });
}