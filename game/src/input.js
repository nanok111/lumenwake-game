import { pointOnCanvas } from './math.js';

const MOVEMENT_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD']);

export class Controls {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.keys = new Set();
    this.pointer = null;
    this.input = { left: false, right: false, up: false, down: false, focus: false, dash: false, aim: null };
    window.addEventListener('keydown', event => this.keydown(event));
    window.addEventListener('keyup', event => this.keyup(event));
    canvas.addEventListener('pointermove', event => { this.pointer = pointOnCanvas(event, canvas, callbacks.size); });
    canvas.addEventListener('pointerdown', event => {
      this.pointer = pointOnCanvas(event, canvas, callbacks.size);
      callbacks.action();
      this.input.dash = true;
    });
    window.addEventListener('pointerup', () => { this.input.dash = false; });
    window.addEventListener('blur', () => { this.keys.clear(); this.input.dash = false; });
  }

  keydown(event) {
    if (MOVEMENT_KEYS.has(event.code) || event.code === 'Space' || event.code === 'Enter') event.preventDefault();
    const fresh = !this.keys.has(event.code);
    this.keys.add(event.code);
    if (fresh && (event.code === 'Enter' || event.code === 'Space')) this.callbacks.action(event.code);
    if (fresh && event.code === 'KeyR') this.callbacks.action(event.code);
    if (fresh && event.code === 'Escape') this.callbacks.pause();
    this.refresh();
  }

  keyup(event) { this.keys.delete(event.code); this.refresh(); }

  refresh() {
    const has = (...codes) => codes.some(code => this.keys.has(code));
    this.input.left = has('ArrowLeft', 'KeyA');
    this.input.right = has('ArrowRight', 'KeyD');
    this.input.up = has('ArrowUp', 'KeyW');
    this.input.down = has('ArrowDown', 'KeyS');
    this.input.focus = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    this.input.dash = this.input.dash || this.keys.has('Space');
    this.input.aim = this.pointer;
  }

  consumeDash() {
    const active = this.input.dash;
    if (this.keys.has('Space')) return active;
    this.input.dash = false;
    return active;
  }
}
