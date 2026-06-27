// Mock API — async backend stub that runs in the browser
import { PIPELINE_STAGES } from './pipelineStages.js';
import { generateReport } from './reportGenerator.js';
import { sleep } from '../utils/animation.js';
import { randInt } from '../utils/format.js';
import { bus, Events } from '../eventBus.js';
import { state } from '../state.js';

function jitter(base, ratio = 0.2) { return base + (Math.random() - 0.5) * 2 * base * ratio; }

async function simulateLatency(min = 80, max = 400) {
  await sleep(randInt(min, max));
}

export async function startProcessing(file, { onProgress } = {}) {
  await simulateLatency(120, 280);
  bus.emit(Events.PIPELINE_START, { file });

  state.pipeline.running = true;
  state.pipeline.startedAt = Date.now();
  state.pipeline.totalProgress = 0;
  state.pipeline.currentStage = 0;
  state.pipeline.stages = PIPELINE_STAGES.map((s) => ({
    id: s.id, label: s.label, model: s.model, status: 'pending', progress: 0, message: s.events[0],
  }));

  bus.emit(Events.CONSOLE_APPEND, {
    level: 'INFO', source: 'API',
    message: `Acquired file "${file?.name || 'sample'}" (${(file?.size || 0) / 1024 | 0} KB) — beginning inference pipeline`,
  });

  const stageTimings = [];
  for (let i = 0; i < PIPELINE_STAGES.length; i++) {
    const cfg = PIPELINE_STAGES[i];
    const duration = jitter(cfg.durationMs, 0.12);
    state.pipeline.currentStage = i;
    const stage = state.pipeline.stages[i];
    stage.status = 'running';
    stage.startedAt = Date.now();
    bus.emit(Events.PIPELINE_STAGE_START, { stage, index: i });
    bus.emit(Events.CONSOLE_APPEND, {
      level: 'INFO', source: 'AI',
      message: `[${i + 1}/${PIPELINE_STAGES.length}] ${cfg.label} — ${cfg.model}`,
    });

    // Sub-progress ticks
    const ticks = 6;
    const tickMs = duration / ticks;
    for (let t = 1; t <= ticks; t++) {
      const p = t / ticks;
      stage.progress = p;
      stage.message = cfg.events[Math.min(t - 1, cfg.events.length - 1)];
      state.pipeline.totalProgress = (i + p) / PIPELINE_STAGES.length;
      bus.emit(Events.PIPELINE_STAGE_PROGRESS, { stage, index: i, progress: p, totalProgress: state.pipeline.totalProgress });
      onProgress?.({ stageId: cfg.id, progress: p, message: stage.message, totalProgress: state.pipeline.totalProgress });
      await sleep(tickMs);
    }

    stage.status = 'complete';
    stage.completedAt = Date.now();
    stage.durationMs = duration;
    stageTimings.push(duration);
    bus.emit(Events.PIPELINE_STAGE_COMPLETE, { stage, index: i, duration });
    bus.emit(Events.CONSOLE_APPEND, {
      level: 'SUCCESS', source: 'AI',
      message: `${cfg.label} complete in ${(duration / 1000).toFixed(2)}s`,
    });

    // Occasional warnings to feel real
    if (Math.random() < 0.12) {
      bus.emit(Events.CONSOLE_APPEND, {
        level: 'WARN', source: 'AI',
        message: `Thermal noise spike detected — applying median filter (Δt ${randInt(40, 120)}ms)`,
      });
    }
  }

  await simulateLatency(200, 400);
  const report = generateReport({ fileMeta: file, stageTimings });
  state.report = report;
  state.pipeline.running = false;
  state.pipeline.completedAt = Date.now();
  bus.emit(Events.CONSOLE_APPEND, {
    level: 'SUCCESS', source: 'API',
    message: `Mission report ${report.id} generated — confidence ${(report.confidence * 100).toFixed(1)}%`,
  });
  bus.emit(Events.REPORT_READY, { report });
  bus.emit(Events.PIPELINE_COMPLETE, { report });
  return report;
}

export async function pingSatellite(id) {
  await simulateLatency(60, 180);
  return { id, latencyMs: randInt(80, 240), status: 'ONLINE', timestamp: Date.now() };
}

export async function fetchCoverageRegion() {
  await simulateLatency(120, 280);
  return { region: 'South Asia', bbox: { minLat: 6, maxLat: 38, minLon: 68, maxLon: 98 }, updatedAt: Date.now() };
}

export async function getSystemHealth() {
  await simulateLatency(60, 180);
  return {
    cpu: 0.32 + Math.random() * 0.2,
    mem: 0.48 + Math.random() * 0.15,
    gpu: 0.61 + Math.random() * 0.18,
    disk: 0.21 + Math.random() * 0.1,
    network: 0.78 + Math.random() * 0.15,
  };
}