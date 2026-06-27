// Drag-drop handler with visual feedback
import { validateFile } from './fileValidator.js';

export function attachDropZone(element, onFile) {
  let depth = 0;
  function onDragEnter(e) { e.preventDefault(); depth++; element.classList.add('is-hover'); }
  function onDragOver(e) { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; }
  function onDragLeave(e) { e.preventDefault(); depth = Math.max(0, depth - 1); if (depth === 0) element.classList.remove('is-hover'); }
  function onDrop(e) {
    e.preventDefault();
    depth = 0;
    element.classList.remove('is-hover');
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const v = validateFile(file);
    if (!v.ok) { onFile(null, v.error); return; }
    onFile(file, null);
  }
  element.addEventListener('dragenter', onDragEnter);
  element.addEventListener('dragover', onDragOver);
  element.addEventListener('dragleave', onDragLeave);
  element.addEventListener('drop', onDrop);
  return () => {
    element.removeEventListener('dragenter', onDragEnter);
    element.removeEventListener('dragover', onDragOver);
    element.removeEventListener('dragleave', onDragLeave);
    element.removeEventListener('drop', onDrop);
  };
}