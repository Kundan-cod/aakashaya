// Boot AAKASHAYA: fonts → splash → three → dashboard
import { startSplash } from './splash/splashController.js';
import { mountDashboard } from './dashboard/dashboardController.js';
import { initThreeScene } from './three/earthScene.js';
import { bus, Events } from './eventBus.js';
import { dom } from './utils/domCache.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

async function waitForFonts() {
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch {}
  }
}

async function boot() {
  document.documentElement.setAttribute('data-state', 'booting');
  await waitForFonts();

  // Kick off the 3D scene as early as possible so it's rendering behind the splash
  try {
    await initThreeScene();
    bus.emit(Events.THREE_READY, {});
  } catch (err) {
    console.warn('[AAKASHAYA] 3D scene failed to init; continuing with CSS background.', err);
  }

  // Run the cinematic splash (with safety: never block more than 15s)
  try {
    await Promise.race([
      startSplash({ reducedMotion }),
      new Promise((res) => setTimeout(res, 15000)),
    ]);
  } catch (err) {
    console.warn('[AAKASHAYA] splash error, continuing to dashboard', err);
  }

  // Always force the splash away in case something hung
  const splash = dom.get('splash-screen');
  if (splash) {
    splash.classList.add('is-exiting', 'is-done');
  }

  // Show landing/intro page
  const landing = dom.get('landing-screen');
  if (landing) {
    landing.hidden = false;
  }

  // Wait for user to click "INITIATE MISSION CONTROL"
  const enterBtn = dom.get('enter-dashboard-btn');
  if (enterBtn && landing) {
    await new Promise((resolve) => {
      enterBtn.addEventListener('click', () => {
        landing.classList.add('is-exiting');
        const onEnd = () => {
          landing.classList.add('is-done');
          resolve();
        };
        landing.addEventListener('transitionend', onEnd, { once: true });
        setTimeout(onEnd, 800); // safety fallback
      });
    });
  }

  // Unhide dashboard before mounting so CSS transitions can animate in
  const dashboard = dom.get('dashboard');
  if (dashboard) dashboard.hidden = false;

  // Mount the dashboard (wrapped so a single component error doesn't kill everything)
  document.documentElement.setAttribute('data-state', 'ready');
  try {
    await mountDashboard({ root: dashboard });
  } catch (err) {
    console.error('[AAKASHAYA] dashboard mount failed', err);
    if (dashboard) {
      dashboard.innerHTML = `<div style="padding:40px;color:#ff3860;font-family:monospace;">Dashboard mount failed: ${err.message}<br/>See browser console for details.</div>`;
    }
  }

  // Global error hooks → command console
  window.addEventListener('error', (e) => {
    bus.emit(Events.CONSOLE_APPEND, { level: 'ERROR', source: 'SYS', message: e.message });
  });
  window.addEventListener('unhandledrejection', (e) => {
    bus.emit(Events.CONSOLE_APPEND, { level: 'ERROR', source: 'SYS', message: `Unhandled rejection: ${e.reason}` });
  });

  // Page visibility — pause heavy work when hidden
  document.addEventListener('visibilitychange', () => {
    bus.emit('visibility', { hidden: document.hidden });
  });
}

boot().catch((err) => {
  console.error('[AAKASHAYA] boot failed', err);
  // Force dashboard to show so user sees SOMETHING
  const splash = dom.get('splash-screen');
  if (splash) splash.classList.add('is-exiting', 'is-done');
  const dashboard = dom.get('dashboard');
  if (dashboard) {
    dashboard.hidden = false;
    dashboard.innerHTML = `<div style="padding:40px;color:#ff3860;font-family:monospace;background:#020617;min-height:100vh;">
      <h2 style="color:#ff00ea;">AAKASHAYA Boot Failure</h2>
      <pre style="white-space:pre-wrap;color:#ffb800;">${(err && err.stack) || err}</pre>
    </div>`;
  }
});
