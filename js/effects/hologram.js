// Hologram shimmer overlay — adds a class to a node
export function applyHologramShimmer(node) {
  const overlay = document.createElement('div');
  overlay.className = 'holo-overlay';
  node.style.position = node.style.position || 'relative';
  node.appendChild(overlay);
  return overlay;
}