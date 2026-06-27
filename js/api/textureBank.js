// Deterministic gradient backgrounds — fallback "colorized" output for unknown inputs
import { mulberry32, seedFromString } from '../utils/prng.js';

const PALETTES = [
  ['#062447', '#0e6e7e', '#3ad6ff', '#a7f3d0', '#ffb800'],
  ['#1a0b3a', '#7a5cff', '#ff00ea', '#00f0ff', '#ffffff'],
  ['#3a0b1a', '#ff3860', '#ffb800', '#00ff88', '#0ad6c2'],
  ['#0a1a3a', '#00f0ff', '#7a5cff', '#ff00ea', '#ffb800'],
  ['#1a3a0a', '#00ff88', '#3ad6ff', '#ffffff', '#ffb800'],
];

export function gradientForSeed(seed) {
  const rng = mulberry32(seedFromString(String(seed)));
  const palette = PALETTES[Math.floor(rng() * PALETTES.length)];
  const angle = Math.floor(rng() * 360);
  const stops = palette.map((c, i) => `${c} ${Math.round((i / (palette.length - 1)) * 100)}%`).join(', ');
  return `linear-gradient(${angle}deg, ${stops})`;
}

export function randomPalette(seed) {
  const rng = mulberry32(seedFromString(String(seed)));
  return PALETTES[Math.floor(rng() * PALETTES.length)];
}