// Ambient effect orchestrator — applies per-section backgrounds
import { createNeuralNet } from './neuralNetwork.js';
import { createScanningGrid } from './scanningGrid.js';
import { applyHologramShimmer } from './hologram.js';

export function mountAmbientEffects(panel, { kind = 'neural' } = {}) {
  const effects = [];
  if (kind === 'neural') effects.push(createNeuralNet(panel));
  if (kind === 'scan') effects.push(createScanningGrid(panel));
  effects.push(applyHologramShimmer(panel));
  return {
    destroy() { effects.forEach((e) => e?.destroy?.()); },
  };
}