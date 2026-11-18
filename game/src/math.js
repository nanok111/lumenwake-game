export const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const lerp = (a, b, t) => a + (b - a) * t;

export function random(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

export function pointOnCanvas(event, canvas, view) {
  const bounds = canvas.getBoundingClientRect();
  const factor = Math.min(bounds.width / view.width, bounds.height / view.height);
  return {
    x: (event.clientX - bounds.left - (bounds.width - view.width * factor) / 2) / factor,
    y: (event.clientY - bounds.top - (bounds.height - view.height * factor) / 2) / factor,
  };
}
