// Deterministic report generator — produces realistic AI outputs from a seed
import { mulberry32, seedFromString } from '../utils/prng.js';
import { SATELLITES } from '../config.js';
import { rand, randInt, clamp, formatFixed } from '../utils/format.js';

const LAND_COVER_CLASSES = [
  { class: 'Forest Region',    color: '#00ff88' },
  { class: 'Urban Area',       color: '#ff00ea' },
  { class: 'Water Bodies',     color: '#00f0ff' },
  { class: 'Agricultural Land',color: '#ffb800' },
  { class: 'Bare Soil',        color: '#a35c2a' },
  { class: 'Snow / Ice',       color: '#cce0ff' },
  { class: 'Road Network',     color: '#7a5cff' },
];

const DETECTION_TYPES = [
  { type: 'Industrial Facility', minC: 0.85 },
  { type: 'Solar Farm',          minC: 0.80 },
  { type: 'Road Network',        minC: 0.72 },
  { type: 'Airstrip',            minC: 0.78 },
  { type: 'Bridge',              minC: 0.70 },
  { type: 'Vehicle Cluster',     minC: 0.65 },
  { type: 'Building Footprint',  minC: 0.74 },
  { type: 'Field Boundary',      minC: 0.68 },
];

const INTERPRETATION_TEMPLATES = [
  ({ dominant, second, third, region }) =>
    `Thermal infrared analysis of the ${region} region reveals a heterogeneous landscape dominated by ${dominant.class.toLowerCase()} (${dominant.percent.toFixed(1)}%), interspersed with ${second.class.toLowerCase()} (${second.percent.toFixed(1)}%) and ${third.class.toLowerCase()} (${third.percent.toFixed(1)}%). Surface temperature gradients indicate active diurnal heating patterns consistent with mid-morning acquisition.`,
  ({ dominant, second, third, region, detections }) =>
    `Mission analysis of ${region} identifies ${dominant.class.toLowerCase()} as the dominant land cover (${dominant.percent.toFixed(1)}%), with ${second.class.toLowerCase()} accounting for ${second.percent.toFixed(1)}%. ${detections.length} high-confidence features were detected including ${detections.slice(0, 2).map((d) => d.type.toLowerCase()).join(' and ')}, suggesting ${detections.length >= 4 ? 'significant' : 'moderate'} human activity.`,
  ({ dominant, second, region, confidence }) =>
    `Spectral and thermal analysis of the ${region} sector classifies ${dominant.percent.toFixed(1)}% of the region as ${dominant.class.toLowerCase()}, with ${second.percent.toFixed(1)}% secondary cover. Overall AI confidence stands at ${(confidence * 100).toFixed(1)}% with cross-validated metrics within acceptable operational thresholds.`,
];

function normalizeWeights(weights, rng) {
  // Apply small jitter to each weight
  const jittered = weights.map((w) => w * (0.85 + rng() * 0.3));
  const total = jittered.reduce((a, b) => a + b, 0);
  return jittered.map((w) => (w / total) * 100);
}

function pickLocation(rng) {
  // Choose from a list of real regions to add authenticity
  const regions = [
    { region: 'Mumbai Metro',         lat: 19.076, lon: 72.877 },
    { region: 'Delhi NCR',            lat: 28.613, lon: 77.209 },
    { region: 'Bengaluru Urban',      lat: 12.971, lon: 77.594 },
    { region: 'Chennai Coastal',      lat: 13.082, lon: 80.270 },
    { region: 'Kolkata Delta',        lat: 22.572, lon: 88.363 },
    { region: 'Hyderabad Outskirts',  lat: 17.385, lon: 78.486 },
    { region: 'Pune Valley',          lat: 18.520, lon: 73.856 },
    { region: 'Ahmedabad Plains',     lat: 23.022, lon: 72.571 },
  ];
  return regions[Math.floor(rng() * regions.length)];
}

function pickLandCover(rng, region) {
  // Reasonable priors by region
  const weights = [25, 22, 18, 15, 12, 5, 3]; // forest, urban, water, agri, bare, snow, roads
  const adjusted = region.includes('Coastal') || region.includes('Delta')
    ? [10, 18, 45, 12, 8, 5, 2]
    : region.includes('Metro') || region.includes('Urban') || region.includes('NCR')
      ? [12, 55, 8, 12, 10, 1, 2]
      : region.includes('Plains') || region.includes('Valley')
        ? [20, 28, 10, 32, 8, 1, 1]
        : weights;
  const percents = normalizeWeights(adjusted, rng);
  return LAND_COVER_CLASSES.map((cls, i) => ({ ...cls, percent: percents[i] })).sort((a, b) => b.percent - a.percent);
}

function pickDetections(rng, landCover) {
  const count = randInt(2, 7);
  const detections = [];
  const shuffled = [...DETECTION_TYPES].sort(() => rng() - 0.5);
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const d = shuffled[i];
    detections.push({
      type: d.type,
      confidence: clamp(d.minC + rng() * (1 - d.minC), 0, 0.99),
      bbox: [randInt(0, 800), randInt(0, 600), randInt(80, 300), randInt(60, 240)],
    });
  }
  // urban-heavy regions detect more
  return detections.sort((a, b) => b.confidence - a.confidence);
}

export function generateReport({ fileMeta, stageTimings = [] }) {
  const seedStr = `${fileMeta?.name || 'sample'}|${fileMeta?.size || 0}|${Math.floor(Date.now() / 60000)}`;
  const rng = mulberry32(seedFromString(seedStr));
  const location = pickLocation(rng);
  const landCover = pickLandCover(rng, location.region);
  const detections = pickDetections(rng, landCover);
  const processingTime = stageTimings.reduce((a, b) => a + b, 0) / 1000 || 7.2;

  const psnr = clamp(32 + rng() * 6, 32, 38);
  const ssim = clamp(0.86 + rng() * 0.1, 0.85, 0.96);
  const fid = clamp(12 + rng() * 14, 12, 26);
  const confidence = clamp(0.82 + rng() * 0.14, 0.78, 0.97);

  const satellite = SATELLITES[Math.floor(rng() * SATELLITES.length)];

  const sorted = [...landCover].sort((a, b) => b.percent - a.percent);
  const interpretation = INTERPRETATION_TEMPLATES[Math.floor(rng() * INTERPRETATION_TEMPLATES.length)]({
    dominant: sorted[0], second: sorted[1], third: sorted[2], region: location.region, confidence, detections,
  });

  const reportId = `RPT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(rng() * 900 + 100)}`;

  return {
    id: reportId,
    generatedAt: new Date().toISOString(),
    metadata: {
      mission: 'AAKASHAYA',
      satellite: satellite.name,
      satelliteId: satellite.id,
      sensor: satellite.type,
      orbit: satellite.orbit,
      coordinates: { lat: location.lat, lon: location.lon, region: location.region },
      captureTime: new Date(Date.now() - Math.floor(rng() * 600000)).toISOString(),
      processingTime: parseFloat(processingTime.toFixed(2)),
      inputFile: { name: fileMeta?.name || 'sample-ir.jpg', size: fileMeta?.size || 0, type: fileMeta?.type || 'image/jpeg' },
    },
    quality: {
      psnr: parseFloat(psnr.toFixed(2)),
      ssim: parseFloat(ssim.toFixed(3)),
      fid: parseFloat(fid.toFixed(1)),
      inferenceTimeMs: Math.floor(processingTime * 1000),
    },
    landCover,
    detections,
    confidence: parseFloat(confidence.toFixed(3)),
    interpretation,
  };
}

export function generateReportId() {
  return `RPT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`;
}