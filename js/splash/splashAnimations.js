// Splash animation orchestrator
import { SPLASH_PHASES, FAST_PHASES } from './splashTimeline.js';
import { dom } from '../utils/domCache.js';
import { sleep } from '../utils/animation.js';
import { bus, Events } from '../eventBus.js';

let _elements = null;
function el(tag, props, children) {
  return Object.assign(document.createElement(tag), props ? Object.fromEntries(Object.entries(props).map(([k, v]) => [k, v])) : {});
}

function getElements() {
  if (_elements) return _elements;
  const splash = dom.get('splash-screen');
  _elements = {
    splash,
    status: splash?.querySelector('#splash-status-text'),
    bar: splash?.querySelector('#splash-progress-bar'),
    pct: splash?.querySelector('#splash-percent'),
    sat: splash?.querySelector('#splash-tel-sat'),
    content: splash?.querySelector('.splash__content'),
  };
  return _elements;
}

function setPhase(idx, total) {
  const { splash, status, bar, pct } = getElements();
  if (!splash) return;
  splash.setAttribute('data-phase', String(idx));
  const phase = SPLASH_PHASES[idx];
  if (status && phase) status.textContent = phase.label;
  if (pct) pct.textContent = `${Math.round(((idx + 1) / total) * 100)}%`;
  if (bar) bar.style.width = `${((idx + 1) / total) * 100}%`;
  bus.emit(Events.SPLASH_PHASE, { phase: idx, label: phase?.label });
}

export async function startSplash({ reducedMotion = false } = {}) {
  const { splash } = getElements();
  if (!splash) {
    bus.emit(Events.SPLASH_DONE, {});
    return;
  }
  splash.classList.remove('is-exiting', 'is-done');
  splash.hidden = false;

  const phases = reducedMotion ? FAST_PHASES : SPLASH_PHASES;

  if (reducedMotion) {
    setPhase(11, phases.length);
    await sleep(600);
    finishSplash();
    return;
  }

  for (let i = 0; i < phases.length; i++) {
    setPhase(i, phases.length);
    await sleep(phases[i].durationMs);
  }
  finishSplash();
}

function finishSplash() {
  const { splash } = getElements();
  if (!splash) return;
  splash.classList.add('is-exiting');
  bus.emit(Events.SPLASH_DONE, {});
  const onEnd = () => {
    splash.classList.add('is-done');
    splash.removeEventListener('transitionend', onEnd);
  };
  splash.addEventListener('transitionend', onEnd, { once: true });
  // Fallback timeout in case transitionend doesn't fire
  setTimeout(onEnd, 1400);
}