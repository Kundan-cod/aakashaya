// Formatting utilities
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0; let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 10 ? 0 : 1)} ${units[i]}`;
}

export function formatUptime(seconds) {
  seconds = Math.max(0, Math.floor(seconds));
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return d > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatTimestamp(d = new Date()) {
  return d.toISOString().replace('T', ' ').replace('Z', 'Z');
}

export function formatHMS(d = new Date()) {
  return d.toTimeString().slice(0, 8);
}

export function formatPercent(n, digits = 1) { return `${(n * 100).toFixed(digits)}%`; }
export function formatFixed(n, digits = 2) { return Number(n).toFixed(digits); }
export function formatCoord(lat, lon) { return `${lat.toFixed(2)}°${lat >= 0 ? 'N' : 'S'} ${lon.toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`; }
export function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function rand(min, max) { return min + Math.random() * (max - min); }
export function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
