// Lightweight reactive store using Proxy
import { bus } from './eventBus.js';

function notifyPath(path) {
  bus.emit('state:change', { path });
}

function makeReactive(target, path = '') {
  return new Proxy(target, {
    set(t, k, v) {
      const old = t[k];
      t[k] = (v && typeof v === 'object' && !Array.isArray(v)) ? makeReactive(v, `${path}.${String(k)}`) : v;
      if (old !== v) {
        bus.emit('state:set', { path: `${path}.${String(k)}`, value: v });
      }
      return true;
    },
    deleteProperty(t, k) {
      delete t[k];
      bus.emit('state:set', { path: `${path}.${String(k)}`, value: undefined });
      return true;
    },
  });
}

export const state = makeReactive({
  boot: { phase: 'idle', progress: 0 },
  mission: { id: 'AAK-2026-06', name: 'AAKASHAYA', status: 'ACTIVE', uptime: 0, healthScore: 1 },
  telemetry: {
    satelliteId: 'SAT-AAROHI-1',
    orbitStatus: 'LEO-450 · 97.6°',
    coverageRegion: '19.07°N 72.87°E · Mumbai Metro',
    dataFeed: { status: 'STREAMING', throughputKbps: 1842, history: Array(30).fill(0).map((_, i) => 1500 + Math.sin(i / 3) * 250) },
    signalStrength: { dbm: -67.4, quality: 0.94, history: Array(30).fill(0).map((_, i) => -68 + Math.cos(i / 2) * 1.5) },
    processingQueue: { count: 7, history: Array(30).fill(0).map(() => 6 + Math.floor(Math.random() * 3)) },
    uptimeSec: 0,
    lastHeartbeat: Date.now(),
  },
  upload: { file: null, previewUrl: null, status: 'idle' },
  pipeline: { running: false, currentStage: -1, stages: [], totalProgress: 0, startedAt: null, completedAt: null },
  report: null,
  console: { lines: [], filter: 'ALL' },
  ui: { splashDone: false, dashboardMounted: false, activeSection: 'overview' },
});

const subscribers = new Map();

export function subscribe(path, fn) {
  if (!subscribers.has(path)) subscribers.set(path, new Set());
  subscribers.get(path).add(fn);
  return () => subscribers.get(path)?.delete(fn);
}

bus.on('state:set', ({ path, value }) => {
  // notify exact path
  subscribers.get(path)?.forEach((fn) => fn(value, path));
  // also notify wildcard prefix matches
  for (const [p, fns] of subscribers) {
    if (p !== path && (p.endsWith('.*') || p === '*')) {
      if (p === '*' || path.startsWith(p.slice(0, -2))) {
        fns.forEach((fn) => fn(value, path));
      }
    }
  }
});

export function update(path, value) {
  // simple dot-path set
  const parts = path.split('.');
  let cursor = state;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cursor[parts[i]] == null) cursor[parts[i]] = {};
    cursor = cursor[parts[i]];
  }
  cursor[parts[parts.length - 1]] = value;
}
