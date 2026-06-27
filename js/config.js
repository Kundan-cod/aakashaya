// AAKASHAYA configuration constants
export const MISSION = {
  id: 'AAK-2026-06',
  name: 'AAKASHAYA',
  fullName: 'AAKASHAYA – Infrared Satellite Intelligence System',
  operator: 'AAKASHAYA Mission Control',
  launchDate: '2024-11-12',
  status: 'ACTIVE',
  healthScore: 1.0,
};

export const SATELLITES = [
  { id: 'SAT-AAROHI-1', name: 'Aarohi-1', type: 'INFRARED-MWIR', orbit: 'LEO-450', inclination: 97.6, status: 'ONLINE', healthScore: 0.98, dataRateMbps: 1.8 },
  { id: 'SAT-VAYU-2',   name: 'Vayu-2',   type: 'INFRARED-LWIR', orbit: 'LEO-512', inclination: 97.4, status: 'ONLINE', healthScore: 0.96, dataRateMbps: 1.6 },
  { id: 'SAT-PRITHVI-3',name: 'Prithvi-3',type: 'INFRARED-SWIR', orbit: 'LEO-450', inclination: 97.6, status: 'STANDBY', healthScore: 0.92, dataRateMbps: 1.4 },
  { id: 'SAT-AGNI-4',   name: 'Agni-4',   type: 'MULTISPECTRAL', orbit: 'SSO-561', inclination: 97.8, status: 'ONLINE', healthScore: 0.99, dataRateMbps: 2.2 },
];

export const STAGES = [
  { id: 'acquire',    label: 'Infrared Acquisition',  model: 'Sensor Driver', durationMs: 700,  weight: 0.08 },
  { id: 'preprocess', label: 'Signal Processing',     model: 'Calibration Pipeline', durationMs: 900, weight: 0.10 },
  { id: 'enhance',    label: 'Image Enhancement',     model: 'SwinIR-M', durationMs: 1500, weight: 0.20 },
  { id: 'superres',   label: 'Super Resolution',      model: 'SwinIR-SR', durationMs: 1200, weight: 0.15 },
  { id: 'colorize',   label: 'RGB Colorization',      model: 'Pix2Pix-IR', durationMs: 1300, weight: 0.16 },
  { id: 'segment',    label: 'Semantic Intelligence', model: 'SegFormer-B4', durationMs: 1100, weight: 0.14 },
  { id: 'detect',     label: 'Object Interpretation', model: 'YOLOv8-L',  durationMs: 800,  weight: 0.10 },
  { id: 'report',     label: 'Earth Intelligence Report', model: 'CLIP-Vision + Synthesizer', durationMs: 600, weight: 0.07 },
];

export const AI_ENGINES = [
  { id: 'swinir',    label: 'SwinIR Enhancement Engine',  status: 'ONLINE' },
  { id: 'pix2pix',   label: 'Colorization Network',       status: 'ONLINE' },
  { id: 'segformer', label: 'Semantic Intelligence System',status: 'ONLINE' },
  { id: 'yolo',      label: 'Object Detection System',     status: 'ONLINE' },
  { id: 'clip',      label: 'Vision-Language Reasoner',    status: 'ONLINE' },
  { id: 'inference', label: 'Inference Core',              status: 'ONLINE' },
];

export const CDN_URLS = {
  three: 'https://esm.sh/three@0.160.0',
  fonts: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap',
};

export const FEATURE_FLAGS = {
  three: true,
  magnetic: true,
  tilt: true,
  console: true,
  exports: { pdf: true, png: true, csv: true },
};

export const COLORS = {
  cyan: '#00f0ff',
  magenta: '#ff00ea',
  gold: '#ffb800',
  green: '#00ff88',
  violet: '#7a5cff',
};
