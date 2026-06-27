// ID generation
let counter = 0;
export function uid(prefix = 'id') {
  counter = (counter + 1) % 1e6;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}
