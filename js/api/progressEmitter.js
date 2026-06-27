// Progress emitter — simple EventTarget wrapper
export class ProgressEmitter extends EventTarget {
  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
  on(type, fn) {
    const handler = (e) => fn(e.detail);
    this.addEventListener(type, handler);
    return () => this.removeEventListener(type, handler);
  }
}