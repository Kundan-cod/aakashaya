// Keyboard shortcuts — U/P/R/T/Esc/? global handlers
import { bus, Events } from '../eventBus.js';
import { state } from '../state.js';
import { el, empty } from '../utils/dom.js';
import { dom } from '../utils/domCache.js';
import { toast } from './toastManager.js';

const SHORTCUTS = [
  { key: 'u', label: 'Focus upload zone', action: () => focusUpload() },
  { key: 'p', label: 'Initiate processing', action: () => triggerProcessing() },
  { key: 'r', label: 'Scroll to report', action: () => scrollToSection('report') },
  { key: 't', label: 'Toggle command console', action: () => toggleConsole() },
  { key: 'a', label: 'Scroll to architecture', action: () => scrollToSection('architecture') },
  { key: 's', label: 'Scroll to semantic analysis', action: () => scrollToSection('semantic') },
  { key: 'w', label: 'Scroll to workflow', action: () => scrollToSection('workflow') },
  { key: 'escape', label: 'Close overlays', action: () => closeOverlays() },
  { key: '?', label: 'Toggle keyboard help', action: () => toggleHelp() },
];

let helpOpen = false;

function focusUpload() {
  const z = document.querySelector('.upload-zone');
  if (z) { z.scrollIntoView({ behavior: 'smooth', block: 'center' }); z.classList.add('anim-pulse'); setTimeout(() => z.classList.remove('anim-pulse'), 1200); }
}

function triggerProcessing() {
  if (state.upload.file && !state.pipeline.running) {
    bus.emit('ui:startProcessing', {});
  } else if (state.pipeline.running) {
    toast.warn('Pipeline already running');
  } else {
    toast.info('Upload an image first (drag-drop or click)');
  }
}

function scrollToSection(id) {
  const node = document.getElementById(`section-${id}`);
  if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleConsole() {
  const c = document.getElementById('section-console');
  if (c) c.classList.toggle('is-collapsed');
}

function closeOverlays() {
  const overlay = document.querySelector('.help-overlay');
  if (overlay) overlay.remove();
  helpOpen = false;
}

function toggleHelp() {
  if (helpOpen) { closeOverlays(); return; }
  helpOpen = true;
  const overlay = el('div', { class: 'help-overlay', role: 'dialog', 'aria-label': 'Keyboard shortcuts' });
  const panel = el('div', { class: 'help-overlay__panel' });
  panel.appendChild(el('div', { class: 'help-overlay__title', textContent: 'Mission Control · Keyboard' }));
  const list = el('div', { class: 'help-overlay__list' });
  SHORTCUTS.forEach((s) => {
    list.appendChild(el('div', { class: 'help-overlay__key', textContent: s.key.toUpperCase() }));
    list.appendChild(el('div', { textContent: s.label, style: { fontFamily: 'var(--ff-mono)', fontSize: 'var(--fs-12)', color: 'var(--c-text-secondary)' } }));
  });
  panel.appendChild(list);
  panel.appendChild(el('div', { class: 'muted', style: { marginTop: 'var(--s-4)', fontFamily: 'var(--ff-mono)', fontSize: 'var(--fs-11)' }, textContent: 'Press ESC to close this overlay.' }));
  overlay.appendChild(panel);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlays(); });
  dom.get('app').appendChild(overlay);
}

function onKey(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  const k = e.key.toLowerCase();
  const found = SHORTCUTS.find((s) => s.key === k);
  if (found) { e.preventDefault(); found.action(); }
}

export function mountKeyboardShortcuts() {
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}