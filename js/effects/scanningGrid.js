// Scanning grid overlay — pure CSS class, but builds the element here
export function createScanningGrid(container) {
  const grid = document.createElement('div');
  grid.className = 'scan-grid';
  container.appendChild(grid);
  return grid;
}