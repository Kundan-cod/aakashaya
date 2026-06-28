// Dashboard controller — mounts all components into the layout shell
import { el, empty } from '../utils/dom.js';
import { mountNavBar } from './navBar.js';
import { mountSidebar } from '../components/sidebar.js';
import { mountMissionControlHeader } from '../components/missionControlHeader.js';
import { mountTelemetryPanel } from '../components/telemetryPanel.js';
import { mountCommandConsole } from '../components/commandConsole.js';
import { mountUploadPanel } from '../components/uploadPanel.js';
import { mountWorkflowPipeline } from '../components/workflowPipeline.js';
import { mountMissionTimeline } from '../components/missionTimeline.js';
import { mountProcessingMonitor } from '../components/processingMonitor.js';
import { mountBeforeAfterSlider } from '../components/beforeAfterSlider.js';
import { mountSemanticIntelligence } from '../components/semanticIntelligence.js';
import { mountEarthIntelligenceReport } from '../components/earthIntelligenceReport.js';
import { mountArchitectureViz } from '../components/architectureVisualization.js';
import { mountKeyboardShortcuts } from '../components/keyboardShortcuts.js';
import { startProcessing } from '../api/mockApi.js';
import { bus, Events } from '../eventBus.js';
import { state } from '../state.js';

export async function mountDashboard({ root }) {
  if (!root) return;
  empty(root);

  // ─── App Shell: Sidebar + Content ─────────────────────────
  const shell = el('div', { class: 'app-shell' });
  root.appendChild(shell);

  // Mount sidebar
  mountSidebar(shell);

  // Content area
  const content = el('div', { class: 'app-content' });
  shell.appendChild(content);

  // Skip link
  const skip = el('a', { href: '#section-overview', class: 'skip-link', textContent: 'Skip to main content' });
  content.appendChild(skip);

  // Top nav
  mountNavBar(content);

  // ─── Workflow Pipeline Modal ────────────────────────────────
  mountWorkflowPipeline(document.body);

  // ─── Main Grid ────────────────────────────────────────────
  const main = el('main', { class: 'main', id: 'main-content' });
  content.appendChild(main);

  // Left column — System panel (telemetry + command console)
  const colLeft = el('div', { class: 'col col--left', id: 'section-system-telemetry' });
  main.appendChild(colLeft);

  // Right column — Workspace area (header, upload, timeline, reports)
  const colMid = el('div', { class: 'col col--mid' });
  main.appendChild(colMid);

  // Hero row (mission status + upload)
  const hero = el('div', { class: 'hero' });
  colMid.appendChild(hero);
  const heroLeft = el('div', { class: 'hero__left' });
  const heroRight = el('div', { class: 'hero__right' });
  hero.appendChild(heroLeft);
  hero.appendChild(heroRight);

  mountMissionControlHeader(heroLeft);
  const upload = mountUploadPanel(heroRight);

  // Processing monitor + Before/After slider side-by-side
  const subrow = el('div', { class: 'hero', style: { gridTemplateColumns: '1fr 1fr' } });
  colMid.appendChild(subrow);
  const subLeft = el('div', { id: 'section-processing' }); 
  const subRight = el('div', { id: 'section-comparison' });
  subrow.appendChild(subLeft); subrow.appendChild(subRight);
  mountProcessingMonitor(subLeft);
  mountBeforeAfterSlider(subRight);

  // Mission timeline (full-width in the workspace area)
  const timelineWrap = el('div', { id: 'section-timeline' });
  colMid.appendChild(timelineWrap);
  mountMissionTimeline(timelineWrap);

  // Semantic Intelligence
  const semanticWrap = el('div', { id: 'section-semantic' });
  colMid.appendChild(semanticWrap);
  mountSemanticIntelligence(semanticWrap);

  // Earth Intelligence Report
  const reportWrap = el('div', { id: 'section-report' });
  colMid.appendChild(reportWrap);
  mountEarthIntelligenceReport(reportWrap);

  // Architecture Visualization
  const archWrap = el('div', { id: 'section-architecture' });
  colMid.appendChild(archWrap);
  mountArchitectureViz(archWrap);

  // Left column — system panels
  mountTelemetryPanel(colLeft);

  const consoleWrap = el('div', { id: 'section-console' });
  colLeft.appendChild(consoleWrap);
  mountCommandConsole(consoleWrap);

  // Footer
  const footer = el('footer', { class: 'footer' });
  footer.appendChild(el('div', { class: 'footer__left' }, [
    el('span', { class: 'mission-tag__dot' }),
    el('span', { textContent: 'AAKASHAYA Mission Control' }),
    el('span', { textContent: '·' }),
    el('span', { textContent: 'AAK-2026-06' }),
  ]));
  footer.appendChild(el('div', { class: 'footer__right' }, [
    el('span', { textContent: 'Build: stable · v1.0.0' }),
    el('span', { textContent: '·' }),
    el('span', { textContent: 'Press ? for keyboard shortcuts' }),
  ]));
  content.appendChild(footer);

  // Wire keyboard shortcuts
  mountKeyboardShortcuts();

  // Wire upload event → pipeline trigger
  bus.on('ui:startProcessing', async () => {
    if (!state.upload.file) return;
    document.dispatchEvent(new CustomEvent('aak:uploadPreviewChanged'));
    document.dispatchEvent(new CustomEvent('aak:pipelineStart'));
    try {
      await startProcessing(state.upload.file, {});
    } catch (err) {
      console.error('[AAKASHAYA] pipeline failed', err);
      bus.emit(Events.CONSOLE_APPEND, { level: 'ERROR', source: 'API', message: `Pipeline error: ${err.message}` });
    }
    document.dispatchEvent(new CustomEvent('aak:pipelineComplete'));
  });

  bus.on(Events.UPLOAD_RECEIVED, () => {
    document.dispatchEvent(new CustomEvent('aak:uploadPreviewChanged'));
  });

  // Mount entrance animation
  requestAnimationFrame(() => {
    root.classList.add('is-ready');
  });

  state.ui.dashboardMounted = true;
  bus.emit(Events.SPLASH_DONE, {});
}