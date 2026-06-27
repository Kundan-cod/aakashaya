// DOM utilities — hyperscript builder + helpers
export function el(tag, props = {}, children = []) {
  const node = tag.includes(':') ? document.createElementNS('http://www.w3.org/2000/svg', tag.split(':')[1]) : document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class' || k === 'className') node.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k === 'dataset' && typeof v === 'object') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'textContent') node.textContent = v;
    else if (k in node && typeof v !== 'string') { try { node[k] = v; } catch { node.setAttribute(k, v); } }
    else node.setAttribute(k, v);
  }
  appendChildren(node, children);
  return node;
}

function appendChildren(node, children) {
  if (children == null || children === false) return;
  if (Array.isArray(children)) { children.forEach((c) => appendChildren(node, c)); return; }
  if (children instanceof Node) { node.appendChild(children); return; }
  node.appendChild(document.createTextNode(String(children)));
}

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export function mount(parent, child) { parent.appendChild(child); return child; }
export function empty(node) { while (node && node.firstChild) node.removeChild(node.firstChild); return node; }
export function setStyle(node, obj) { Object.assign(node.style, obj); return node; }
export function delegate(root, selector, type, fn) {
  root.addEventListener(type, (e) => {
    const match = e.target.closest(selector);
    if (match && root.contains(match)) fn(e, match);
  });
}
export function svgEl(name, attrs = {}, children = []) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  appendChildren(node, children);
  return node;
}
