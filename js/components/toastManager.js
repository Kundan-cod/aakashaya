// Toast manager — top-right stack
import { el } from '../utils/dom.js';
import { uid } from '../utils/id.js';

const root = () => document.getElementById('toast-root');

const ICONS = {
  info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
  warn: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
};

export const toast = {
  show(message, type = 'info', duration = 4000) {
    const r = root();
    if (!r) return;
    const node = el('div', {
      class: `toast toast--${type}`,
      role: 'status',
      id: uid('toast'),
      html: `<span class="toast__icon" style="color: var(--c-cyan); display:flex; align-items:center;">${ICONS[type] || ICONS.info}</span><span>${message}</span>`,
    });
    r.appendChild(node);
    setTimeout(() => {
      node.classList.add('is-leaving');
      setTimeout(() => node.remove(), 320);
    }, duration);
  },
  info(m, d) { this.show(m, 'info', d); },
  success(m, d) { this.show(m, 'success', d); },
  warn(m, d) { this.show(m, 'warn', d); },
  error(m, d) { this.show(m, 'error', d); },
};