// Tiny pub/sub event bus
const handlers = new Map();

export const bus = {
  on(event, fn) {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event).add(fn);
    return () => bus.off(event, fn);
  },
  off(event, fn) {
    handlers.get(event)?.delete(fn);
  },
  emit(event, payload) {
    handlers.get(event)?.forEach((fn) => {
      try { fn(payload); } catch (err) { console.error(`[bus] ${event} handler failed`, err); }
    });
  },
  clear() { handlers.clear(); },
};

export const Events = {
  SPLASH_PHASE: 'splash:phase',
  SPLASH_DONE: 'splash:done',
  UPLOAD_RECEIVED: 'upload:received',
  UPLOAD_CLEAR: 'upload:clear',
  PIPELINE_START: 'pipeline:start',
  PIPELINE_STAGE_START: 'pipeline:stageStart',
  PIPELINE_STAGE_PROGRESS: 'pipeline:stageProgress',
  PIPELINE_STAGE_COMPLETE: 'pipeline:stageComplete',
  PIPELINE_COMPLETE: 'pipeline:complete',
  REPORT_READY: 'report:ready',
  CONSOLE_APPEND: 'console:append',
  TELEMETRY_TICK: 'telemetry:tick',
  THREE_READY: 'three:ready',
  TOAST: 'toast',
};
