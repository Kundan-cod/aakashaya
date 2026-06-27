// Shared DOM reference cache
const cache = new Map();
export const dom = {
  get(id) {
    if (cache.has(id)) return cache.get(id);
    const el = document.getElementById(id);
    if (el) cache.set(id, el);
    return el;
  },
  put(id, el) { cache.set(id, el); return el; },
  clear() { cache.clear(); },
};
