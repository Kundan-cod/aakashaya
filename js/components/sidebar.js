// Sidebar component — collapsible navigation panel with theme toggle
import { el } from '../utils/dom.js';
import { bus } from '../eventBus.js';

const NAV_ITEMS = [
  {
    group: 'Mission Control',
    items: [
      { id: 'nav-dashboard',   icon: 'grid',      label: 'Dashboard',          section: 'main-content' },
      { id: 'nav-upload',     icon: 'upload',     label: 'Upload IR Image',    section: 'section-upload' },
    ],
  },
  {
    group: 'Analysis',
    items: [
      { id: 'nav-processing', icon: 'cpu',        label: 'Processing Monitor', section: 'section-processing' },
      { id: 'nav-comparison', icon: 'layers',     label: 'Visual Comparison',  section: 'section-comparison' },
      { id: 'nav-semantic',   icon: 'brain',      label: 'Semantic Intel',     section: 'section-semantic' },
    ],
  },
  {
    group: 'Intelligence',
    items: [
      { id: 'nav-report',    icon: 'file-text',  label: 'Earth Report',       section: 'section-report' },
      { id: 'nav-arch',      icon: 'network',    label: 'Architecture',       section: 'section-architecture' },
    ],
  },
  {
    group: 'Systems',
    items: [
      { id: 'nav-telemetry', icon: 'activity',   label: 'Telemetry',          section: 'section-telemetry' },
      { id: 'nav-console',   icon: 'terminal',   label: 'Command Console',    section: 'section-console' },
      { id: 'nav-timeline',  icon: 'clock',      label: 'Mission Timeline',   section: 'section-timeline' },
    ],
  },
];

const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  brain: '<path d="M12 2a4 4 0 0 1 4 4c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2a4 4 0 0 1 4-4z"/><path d="M8 8v2a4 4 0 0 0 8 0V8"/><line x1="12" y1="14" x2="12" y2="22"/><path d="M8 18h8"/>',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
  network: '<rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M12 8v4m-5 4l5-4 5 4"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  chevron: '<polyline points="15 18 9 12 15 6"/>',
  sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
};

function icon(name) {
  return `<svg class="sidebar__link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

function themeIcon(name) {
  return `<svg class="sidebar__theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

// ─── Theme management ─────────────────────────────────────
function getTheme() {
  return localStorage.getItem('aak-theme') || 'dark';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('aak-theme', theme);
  // Update the meta theme-color for mobile browsers
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme === 'dark' ? '#020617' : '#f0f4f8');
  }
  bus.emit('theme:changed', { theme });
}

export function mountSidebar(root) {
  const sidebar = el('aside', { class: 'sidebar', 'aria-label': 'Navigation sidebar' });

  // Toggle button
  const toggle = el('button', {
    class: 'sidebar__toggle',
    'aria-label': 'Toggle sidebar',
    html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS.chevron}</svg>`,
  });
  sidebar.appendChild(toggle);

  // Header with logo
  const header = el('div', { class: 'sidebar__header' });
  header.innerHTML = `
    <div class="sidebar__logo">
      <span class="orbit o1"></span>
      <span class="orbit o2"></span>
      <span class="dot"></span>
    </div>
    <div class="sidebar__brand-text">
      <span class="sidebar__brand-name">AAKASHAYA</span>
      <span class="sidebar__brand-sub">IR Satellite Intel</span>
    </div>
  `;
  sidebar.appendChild(header);

  // Navigation
  const nav = el('nav', { class: 'sidebar__nav' });
  const linkEls = [];

  NAV_ITEMS.forEach((group) => {
    const grp = el('div', { class: 'sidebar__group' });
    grp.appendChild(el('div', { class: 'sidebar__group-label', textContent: group.group }));

    group.items.forEach((item) => {
      const link = el('a', {
        class: 'sidebar__link',
        'data-section': item.section,
        'data-tooltip': item.label,
        html: `${icon(item.icon)}<span class="sidebar__link-text">${item.label}</span>`,
      });

      link.addEventListener('click', (e) => {
        e.preventDefault();
        linkEls.forEach((l) => l.classList.remove('is-active'));
        link.classList.add('is-active');
        const target = document.getElementById(item.section);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      linkEls.push(link);
      grp.appendChild(link);
    });

    nav.appendChild(grp);
  });

  if (linkEls.length > 0) linkEls[0].classList.add('is-active');
  sidebar.appendChild(nav);

  // ─── Theme Toggle ───────────────────────────────────────
  const currentTheme = getTheme();
  setTheme(currentTheme); // Apply saved theme on mount

  const themeRow = el('div', { class: 'sidebar__theme-toggle' });
  const isDark = currentTheme === 'dark';
  themeRow.innerHTML = `
    ${isDark ? themeIcon('moon') : themeIcon('sun')}
    <span class="sidebar__theme-label">${isDark ? 'DARK MODE' : 'LIGHT MODE'}</span>
    <button class="sidebar__theme-switch" aria-label="Toggle dark/light mode" style="margin-left:auto;"></button>
  `;
  sidebar.appendChild(themeRow);

  const themeSwitch = themeRow.querySelector('.sidebar__theme-switch');
  const themeLabel = themeRow.querySelector('.sidebar__theme-label');

  themeSwitch.addEventListener('click', (e) => {
    e.stopPropagation();
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    themeLabel.textContent = next === 'dark' ? 'DARK MODE' : 'LIGHT MODE';
    // Update the icon
    const iconContainer = themeRow.querySelector('.sidebar__theme-icon');
    if (iconContainer) {
      iconContainer.outerHTML = next === 'dark' ? themeIcon('moon') : themeIcon('sun');
    }
  });

  themeRow.addEventListener('click', () => {
    themeSwitch.click();
  });

  // Footer
  const footer = el('div', { class: 'sidebar__footer' });
  footer.innerHTML = `
    <span class="sidebar__footer-dot"></span>
    <span>SYSTEM ONLINE</span>
  `;
  sidebar.appendChild(footer);

  root.appendChild(sidebar);

  // Toggle logic
  let collapsed = false;
  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    sidebar.classList.toggle('is-collapsed', collapsed);
    bus.emit('sidebar:toggle', { collapsed });
  });

  // Intersection observer for active link highlighting
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          linkEls.forEach((l) => {
            l.classList.toggle('is-active', l.dataset.section === id);
          });
        }
      });
    },
    { threshold: 0.3 }
  );

  // Observe sections after a tick (they need to be mounted first)
  requestAnimationFrame(() => {
    NAV_ITEMS.forEach((group) => {
      group.items.forEach((item) => {
        const section = document.getElementById(item.section);
        if (section) observer.observe(section);
      });
    });
  });

  return { sidebar, toggle };
}
