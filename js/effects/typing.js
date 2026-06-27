// Typing animation — reveal text char by char
import { sleep } from '../utils/animation.js';

export async function typeText(node, text, { speed = 22, cursor = true, onDone } = {}) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { node.textContent = text; onDone?.(); return; }
  node.textContent = '';
  if (cursor) {
    const c = document.createElement('span');
    c.className = 'console__cursor';
    node.appendChild(c);
  }
  const target = text;
  for (let i = 0; i < target.length; i++) {
    const ch = target[i];
    const lastChild = node.lastChild;
    if (cursor && lastChild?.classList?.contains('console__cursor')) {
      node.insertBefore(document.createTextNode(ch), lastChild);
    } else {
      node.appendChild(document.createTextNode(ch));
    }
    await sleep(speed + Math.random() * 12);
  }
  onDone?.();
}