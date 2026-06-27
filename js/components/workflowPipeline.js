// Workflow pipeline component — cinematic 8-stage visualization
// Hidden until upload, reveals with animation, animated icons per stage
import { el } from '../utils/dom.js';
import { bus, Events } from '../eventBus.js';
import { state } from '../state.js';
import { PIPELINE_STAGES } from '../api/pipelineStages.js';

// ─── Stage Icons (animated SVGs) ────────────────────────────
const STAGE_ICONS = {
  acquire: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
    <circle cx="20" cy="20" r="9" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
    <circle cx="20" cy="20" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="20" cy="20" r="2" fill="currentColor" class="wf-icon-dot"/>
    <path d="M20 6 L20 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M20 38 L20 34" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M6 20 L2 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M38 20 L34 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,

  preprocess: `<svg viewBox="0 0 40 40"><polyline points="4,28 10,18 16,22 22,10 28,16 34,8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="wf-icon-wave"/>
    <line x1="4" y1="32" x2="36" y2="32" stroke="currentColor" stroke-width="1" opacity="0.3"/>
    <circle cx="10" cy="18" r="2" fill="currentColor" opacity="0.6"/>
    <circle cx="22" cy="10" r="2" fill="currentColor" opacity="0.6"/>
    <circle cx="34" cy="8" r="2" fill="currentColor"/></svg>`,

  enhance: `<svg viewBox="0 0 40 40"><rect x="8" y="8" width="24" height="24" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <path d="M14 26 L18 18 L22 22 L26 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="16" cy="14" r="2.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <path d="M34 20 L38 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="wf-icon-ray"/>
    <path d="M2 20 L6 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="wf-icon-ray"/>
    <path d="M20 2 L20 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="wf-icon-ray"/>
    <path d="M20 34 L20 38" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="wf-icon-ray"/></svg>`,

  superres: `<svg viewBox="0 0 40 40"><rect x="6" y="6" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.4"/>
    <rect x="4" y="4" width="32" height="32" rx="3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 2"/>
    <path d="M24 14 L30 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M27 8 L30 8 L30 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="13" y="24" font-size="10" fill="currentColor" font-family="Orbitron" font-weight="700" text-anchor="middle">4×</text></svg>`,

  colorize: `<svg viewBox="0 0 40 40"><circle cx="16" cy="16" r="8" fill="none" stroke="currentColor" stroke-width="1.5" class="wf-icon-color-r"/>
    <circle cx="24" cy="16" r="8" fill="none" stroke="currentColor" stroke-width="1.5" class="wf-icon-color-g"/>
    <circle cx="20" cy="23" r="8" fill="none" stroke="currentColor" stroke-width="1.5" class="wf-icon-color-b"/></svg>`,

  segment: `<svg viewBox="0 0 40 40"><rect x="4" y="4" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <rect x="22" y="4" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <rect x="4" y="22" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <rect x="22" y="22" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="11" cy="11" r="3" fill="currentColor" opacity="0.4"/>
    <circle cx="29" cy="11" r="3" fill="currentColor" opacity="0.6"/>
    <circle cx="11" cy="29" r="3" fill="currentColor" opacity="0.8"/>
    <circle cx="29" cy="29" r="3" fill="currentColor"/></svg>`,

  detect: `<svg viewBox="0 0 40 40"><rect x="6" y="6" width="28" height="28" rx="3" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
    <rect x="12" y="10" width="16" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8" class="wf-icon-bbox"/>
    <path d="M6 6 L12 10" stroke="currentColor" stroke-width="1" opacity="0.5" stroke-dasharray="2 2"/>
    <path d="M34 6 L28 10" stroke="currentColor" stroke-width="1" opacity="0.5" stroke-dasharray="2 2"/>
    <path d="M6 34 L12 24" stroke="currentColor" stroke-width="1" opacity="0.5" stroke-dasharray="2 2"/>
    <path d="M34 34 L28 24" stroke="currentColor" stroke-width="1" opacity="0.5" stroke-dasharray="2 2"/>
    <circle cx="20" cy="17" r="3" fill="currentColor" opacity="0.6"/></svg>`,

  report: `<svg viewBox="0 0 40 40"><path d="M10 4 L26 4 L32 10 L32 36 L10 36 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <path d="M26 4 L26 10 L32 10" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <line x1="15" y1="16" x2="27" y2="16" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
    <line x1="15" y1="20" x2="27" y2="20" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
    <line x1="15" y1="24" x2="22" y2="24" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
    <circle cx="20" cy="30" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <path d="M20 28 L20 32" stroke="currentColor" stroke-width="1"/>
    <path d="M18 30 L22 30" stroke="currentColor" stroke-width="1"/></svg>`,
};

const STAGE_COLORS = ['#00f0ff', '#3ad6ff', '#7a5cff', '#ff00ea', '#ffb800', '#00ff88', '#ff3860', '#00f0ff'];

const CHECKMARK_SVG = `<svg viewBox="0 0 40 40" class="wf-checkmark"><circle cx="20" cy="20" r="16" fill="none" stroke="var(--c-green)" stroke-width="2" class="wf-check-circle"/><polyline points="13,20 18,26 28,14" fill="none" stroke="var(--c-green)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="wf-check-tick"/></svg>`;

// ─── Build one stage card ───────────────────────────────────
function buildStageCard(stage, index) {
  const color = STAGE_COLORS[index] || '#00f0ff';
  const iconKey = stage.id;
  const iconSvg = STAGE_ICONS[iconKey] || STAGE_ICONS.acquire;

  const card = el('div', {
    class: 'wf-card',
    'data-stage-id': stage.id,
    'data-index': String(index),
    style: { '--stage-color': color, '--stage-delay': `${index * 0.08}s` },
  });

  // Icon container (holds animated icon + checkmark overlay)
  const iconWrap = el('div', { class: 'wf-card__icon', html: iconSvg });
  card.appendChild(iconWrap);

  // Glow ring behind icon when active
  const glowRing = el('div', { class: 'wf-card__glow' });
  card.appendChild(glowRing);

  // Step number
  const num = el('div', { class: 'wf-card__num', textContent: String(index + 1).padStart(2, '0') });
  card.appendChild(num);

  // Label + model
  const label = el('div', { class: 'wf-card__label', textContent: stage.label });
  const model = el('div', { class: 'wf-card__model', textContent: stage.model });
  card.appendChild(label);
  card.appendChild(model);

  // Status message (typed out)
  const msg = el('div', { class: 'wf-card__msg', textContent: '' });
  card.appendChild(msg);

  // Progress bar
  const barWrap = el('div', { class: 'wf-card__bar' });
  const barFill = el('div', { class: 'wf-card__bar-fill' });
  barWrap.appendChild(barFill);
  card.appendChild(barWrap);

  // Badge
  const badge = el('div', { class: 'wf-card__badge', textContent: 'STANDBY' });
  card.appendChild(badge);

  return { card, iconWrap, glowRing, num, label, msg, barFill, badge };
}

// ─── Typewriter effect ──────────────────────────────────────
function typeText(el, text, speed = 30) {
  el.textContent = '';
  let i = 0;
  const id = setInterval(() => {
    if (i < text.length) { el.textContent += text[i]; i++; }
    else clearInterval(id);
  }, speed);
  return id;
}

  // ─── Main mount ─────────────────────────────────────────────
export function mountWorkflowPipeline(root) {
  // Modal overlay — starts hidden
  const wrapper = el('div', { class: 'wf-modal wf-modal--hidden', id: 'section-workflow' });
  const backdrop = el('div', { class: 'wf-modal__backdrop' });
  wrapper.appendChild(backdrop);

  // Pipeline panel (centered in modal)
  const panel = el('div', { class: 'wf-panel' });

  // Header
  const header = el('div', { class: 'wf-panel__header' });
  header.innerHTML = `
    <div class="wf-panel__header-left">
      <div class="wf-panel__led"></div>
      <h2 class="wf-panel__title">EARTH OBSERVATION WORKFLOW</h2>
      <span class="wf-panel__subtitle">8-STAGE AI PIPELINE</span>
    </div>
    <div class="wf-panel__header-right">
      <div class="wf-panel__total-progress">
        <span class="wf-panel__total-label">TOTAL</span>
        <span class="wf-panel__total-pct">0%</span>
      </div>
      <div class="wf-panel__total-bar"><div class="wf-panel__total-bar-fill"></div></div>
    </div>
  `;
  panel.appendChild(header);

  // Cards container
  const cardsWrap = el('div', { class: 'wf-cards' });
  const stageCards = [];

  PIPELINE_STAGES.forEach((s, i) => {
    const card = buildStageCard(s, i);
    stageCards.push(card);
    cardsWrap.appendChild(card.card);

    // Connector arrow between cards
    if (i < PIPELINE_STAGES.length - 1) {
      const conn = el('div', { class: 'wf-connector' });
      conn.innerHTML = `<svg viewBox="0 0 24 12"><path d="M0,6 L18,6" stroke="var(--c-border-mid)" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M16,2 L22,6 L16,10" fill="none" stroke="var(--c-cyan)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/></svg>`;
      cardsWrap.appendChild(conn);
    }
  });

  panel.appendChild(cardsWrap);

  // Footer / Close button
  const footer = el('div', { class: 'wf-panel__footer' });
  const closeBtn = el('button', { class: 'btn btn--primary wf-panel__close', textContent: 'VIEW INTELLIGENCE REPORT', style: { display: 'none', margin: '0 auto' } });
  footer.appendChild(closeBtn);
  panel.appendChild(footer);

  wrapper.appendChild(panel);
  root.appendChild(wrapper);

  // ─── State refs ───
  const totalPct = panel.querySelector('.wf-panel__total-pct');
  const totalBarFill = panel.querySelector('.wf-panel__total-bar-fill');
  let typewriterIds = [];
  let revealed = false;

  // ─── Close handler ───
  closeBtn.addEventListener('click', () => {
    wrapper.classList.remove('wf-modal--revealed');
    wrapper.classList.add('wf-modal--hidden');
    // Give time for fade out
    setTimeout(() => {
      wrapper.style.display = 'none';
      revealed = false; // Reset so it can be opened again
      wrapper.classList.remove('wf-modal--done');
      closeBtn.style.display = 'none';
      document.querySelector('#section-report')?.scrollIntoView({ behavior: 'smooth' });
    }, 400);
  });

  // ─── Reveal animation ─────────────────────────────────────
  function revealPipeline() {
    if (revealed) return;
    revealed = true;
    wrapper.style.display = 'flex';
    // Small delay to allow display block to take effect before animating opacity
    requestAnimationFrame(() => {
      wrapper.classList.remove('wf-modal--hidden');
      wrapper.classList.add('wf-modal--revealed');

      // Stagger card entrance
      stageCards.forEach(({ card }, i) => {
        setTimeout(() => {
          card.classList.add('wf-card--enter');
        }, 300 + i * 80); // Wait for modal to pop a bit
      });
    });
  }

  // ─── Set stage state ──────────────────────────────────────
  function setStageState(index, status, progress = 0, message = '') {
    const c = stageCards[index];
    if (!c) return;

    const { card, iconWrap, glowRing, msg, barFill, badge } = c;

    // Clear all state classes
    card.classList.remove('wf-card--active', 'wf-card--complete', 'wf-card--pending');

    if (status === 'running') {
      card.classList.add('wf-card--active');
      badge.textContent = `${Math.round(progress * 100)}%`;
      badge.className = 'wf-card__badge wf-card__badge--processing';
      barFill.style.width = `${progress * 100}%`;
      glowRing.classList.add('wf-card__glow--active');

      // Typewriter message
      if (message && msg.textContent !== message) {
        typewriterIds.forEach(clearInterval);
        typewriterIds = [];
        typewriterIds.push(typeText(msg, message, 25));
      }

    } else if (status === 'complete') {
      card.classList.add('wf-card--complete');
      badge.textContent = 'DONE';
      badge.className = 'wf-card__badge wf-card__badge--complete';
      barFill.style.width = '100%';
      glowRing.classList.remove('wf-card__glow--active');
      msg.textContent = '✓ Complete';

      // Morph icon to checkmark
      iconWrap.classList.add('wf-card__icon--complete');

    } else {
      card.classList.add('wf-card--pending');
      badge.textContent = 'STANDBY';
      badge.className = 'wf-card__badge';
      barFill.style.width = '0%';
      glowRing.classList.remove('wf-card__glow--active');
      msg.textContent = '';
    }
  }

  // ─── Event bindings ───────────────────────────────────────
  // (Removed UPLOAD_RECEIVED binding so modal only opens on PIPELINE_START)

  bus.on(Events.PIPELINE_START, () => {
    revealPipeline();
    stageCards.forEach((_, i) => setStageState(i, 'pending', 0));
  });

  bus.on(Events.PIPELINE_STAGE_START, ({ index }) => {
    stageCards.forEach((_, i) => {
      if (i < index) setStageState(i, 'complete', 1);
      else if (i === index) setStageState(i, 'running', 0);
      else setStageState(i, 'pending', 0);
    });
  });

  bus.on(Events.PIPELINE_STAGE_PROGRESS, ({ index, progress, totalProgress }) => {
    const stage = state.pipeline.stages?.[index];
    setStageState(index, 'running', progress, stage?.message || '');
    if (totalPct) totalPct.textContent = `${Math.round((totalProgress || 0) * 100)}%`;
    if (totalBarFill) totalBarFill.style.width = `${(totalProgress || 0) * 100}%`;
  });

  bus.on(Events.PIPELINE_STAGE_COMPLETE, ({ index }) => {
    setStageState(index, 'complete', 1);
  });

  bus.on(Events.PIPELINE_COMPLETE, () => {
    stageCards.forEach((_, i) => setStageState(i, 'complete', 1));
    if (totalPct) totalPct.textContent = '100%';
    if (totalBarFill) totalBarFill.style.width = '100%';
    wrapper.classList.add('wf-modal--done');
    closeBtn.style.display = 'block';
  });

  return wrapper;
}