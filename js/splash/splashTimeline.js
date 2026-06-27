// Splash phase timeline — 12 phases, ~12 seconds total
export const SPLASH_PHASES = [
  { id: 0, durationMs: 350,  label: 'Acquiring satellite signal' },
  { id: 1, durationMs: 350,  label: 'Establishing signal lock' },
  { id: 2, durationMs: 700,  label: 'Initializing Earth Observation Systems' },
  { id: 3, durationMs: 700,  label: 'Loading Satellite Assets' },
  { id: 4, durationMs: 700,  label: 'Drawing orbital trajectories' },
  { id: 5, durationMs: 700,  label: 'Activating starfield and telemetry' },
  { id: 6, durationMs: 700,  label: 'Booting holographic interface' },
  { id: 7, durationMs: 700,  label: 'Connecting AI Processing Network' },
  { id: 8, durationMs: 600,  label: 'Running system diagnostics' },
  { id: 9, durationMs: 900,  label: 'Revealing mission signature' },
  { id: 10, durationMs: 700,  label: 'Launching Intelligence Platform' },
  { id: 11, durationMs: 900,  label: 'All systems nominal — entering mission control' },
];

export const FAST_PHASES = [
  { id: 11, durationMs: 600, label: 'All systems nominal' },
];