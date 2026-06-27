// Technical Architecture Visualization — animated SVG diagram
import { el } from '../utils/dom.js';
import { bus, Events } from '../eventBus.js';
import { state } from '../state.js';
import { createNeuralNet } from '../effects/neuralNetwork.js';

const NODES = [
  { id: 'ir',     label: 'Infrared Image',         model: 'IR-MWIR Sensor',     x: 60,  y: 100, color: '#ff00ea' },
  { id: 'swinir', label: 'SwinIR Enhancement',      model: 'SwinIR-M + SR',      x: 260, y: 60,  color: '#00f0ff' },
  { id: 'sr',     label: 'Super Resolution',       model: '4× Upscale',         x: 260, y: 160, color: '#00f0ff' },
  { id: 'pix2pix',label: 'Pix2Pix Colorization',   model: 'IR → RGB',           x: 460, y: 60,  color: '#7a5cff' },
  { id: 'seg',    label: 'Semantic Segmentation',  model: 'SegFormer-B4',       x: 460, y: 160, color: '#ffb800' },
  { id: 'yolo',   label: 'Object Detection',       model: 'YOLOv8-L',           x: 660, y: 110, color: '#00ff88' },
  { id: 'output', label: 'Earth Intelligence',     model: 'Synthesized Report', x: 860, y: 110, color: '#ff00ea' },
];

const CONNECTORS = [
  { from: 'ir',      to: 'swinir',  color: '#00f0ff' },
  { from: 'ir',      to: 'sr',      color: '#00f0ff' },
  { from: 'swinir',  to: 'pix2pix', color: '#7a5cff' },
  { from: 'sr',      to: 'pix2pix', color: '#7a5cff' },
  { from: 'pix2pix', to: 'seg',     color: '#ffb800' },
  { from: 'pix2pix', to: 'yolo',    color: '#00ff88' },
  { from: 'seg',     to: 'output',  color: '#ff00ea' },
  { from: 'yolo',    to: 'output',  color: '#ff00ea' },
];

function nodeAt(id) { return NODES.find((n) => n.id === id); }

export function mountArchitectureViz(root) {
  const panel = el('section', { class: 'panel', id: 'section-architecture', 'aria-label': 'Technical architecture' }, [
    el('header', { class: 'panel__header' }, [
      el('span', { class: 'panel__led panel__led--cyan' }),
      el('h2', { class: 'panel__title', textContent: 'Technical Architecture' }),
      el('span', { class: 'panel__subtitle', textContent: 'AI PIPELINE' }),
    ]),
  ]);

  const body = el('div', { class: 'panel__body' });
  panel.appendChild(body);

  const wrap = el('div', { class: 'architecture', style: { position: 'relative' } });
  body.appendChild(wrap);

  // Background neural net
  const bgWrap = document.createElement('div');
  bgWrap.style.cssText = 'position:absolute; inset:0; opacity:0.3;';
  wrap.appendChild(bgWrap);
  const fx = createNeuralNet(bgWrap, { nodes: 32, connectionDist: 90 });

  // SVG diagram
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'architecture__svg');
  svg.setAttribute('viewBox', '0 0 920 220');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  // Connectors first (under nodes)
  const connGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  svg.appendChild(connGroup);
  CONNECTORS.forEach((c) => {
    const a = nodeAt(c.from); const b = nodeAt(c.to);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const cx = (a.x + b.x) / 2;
    line.setAttribute('d', `M${a.x + 90},${a.y + 22} C${cx},${a.y + 22} ${cx},${b.y + 22} ${b.x},${b.y + 22}`);
    line.setAttribute('class', 'architecture__connector');
    line.setAttribute('stroke', c.color);
    connGroup.appendChild(line);

    // Animated dot
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '3');
    dot.setAttribute('class', 'architecture__dot');
    dot.setAttribute('fill', c.color);
    dot.innerHTML = `<animateMotion dur="2.4s" repeatCount="indefinite" path="M${a.x + 90},${a.y + 22} C${cx},${a.y + 22} ${cx},${b.y + 22} ${b.x},${b.y + 22}" />`;
    connGroup.appendChild(dot);
  });

  // Nodes
  const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  svg.appendChild(nodeGroup);
  NODES.forEach((n) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${n.x}, ${n.y})`);
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '90'); rect.setAttribute('height', '44');
    rect.setAttribute('class', 'architecture__node architecture__node-rect');
    rect.setAttribute('stroke', n.color);
    g.appendChild(rect);
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', '45'); label.setAttribute('y', '20');
    label.setAttribute('class', 'architecture__node-label');
    label.textContent = n.label;
    g.appendChild(label);
    const model = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    model.setAttribute('x', '45'); model.setAttribute('y', '34');
    model.setAttribute('class', 'architecture__node-model');
    model.textContent = n.model;
    g.appendChild(model);
    nodeGroup.appendChild(g);
  });

  wrap.appendChild(svg);

  // Caption
  const caption = el('div', { style: { marginTop: 'var(--s-3)', fontFamily: 'var(--ff-mono)', fontSize: 'var(--fs-11)', color: 'var(--c-text-muted)', letterSpacing: '0.06em' }, textContent: 'IR Input → SwinIR Enhancement → Super Resolution → Pix2Pix Colorization → SegFormer + YOLOv8 → Earth Intelligence Output' });
  body.appendChild(caption);

  root.appendChild(panel);

  // Highlight during pipeline
  const nodeEls = nodeGroup.querySelectorAll('g');
  function highlight(activeIds = [], completeIds = []) {
    nodeEls.forEach((g, i) => {
      const id = NODES[i].id;
      const rect = g.querySelector('rect');
      rect.classList.remove('is-active', 'is-complete');
      if (activeIds.includes(id)) rect.classList.add('is-active');
      if (completeIds.includes(id)) rect.classList.add('is-complete');
    });
  }

  bus.on(Events.PIPELINE_STAGE_START, ({ index }) => {
    const map = [
      ['ir'], ['ir'], ['swinir', 'sr'], ['sr'], ['pix2pix'], ['seg'], ['yolo'], ['output'],
    ];
    highlight(map[index] || [], []);
  });
  bus.on(Events.PIPELINE_STAGE_COMPLETE, ({ index }) => {
    const map = [
      ['ir'], ['ir'], ['swinir', 'sr'], ['sr'], ['pix2pix'], ['seg'], ['yolo'], ['output'],
    ];
    const done = map.slice(0, index + 1).flat();
    highlight([], done);
  });
  bus.on(Events.PIPELINE_COMPLETE, () => highlight([], NODES.map((n) => n.id)));

  return { panel, destroy() { fx.destroy(); } };
}