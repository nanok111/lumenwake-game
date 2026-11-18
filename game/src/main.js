import { Soundscape } from './audio.js';
import { Controls } from './input.js';
import { Renderer } from './render.js';
import { createWorld, SIZE, updateWorld } from './world.js';

const canvas = document.querySelector('#game');
const status = document.querySelector('#status');
const soundButton = document.querySelector('#sound');
const renderer = new Renderer(canvas);
const sound = new Soundscape();
let state = 'title';
let world = null;
let outcome = null;
let previous = performance.now();
let frame = 0;
let best = Number(localStorage.getItem('lumenwake-best') || 0);

function announce(message) { status.textContent = message; }

function startRun() {
  world = createWorld((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
  state = 'playing';
  outcome = null;
  sound.unlock();
  sound.begin();
  announce('The current begins. Gather twelve lights.');
}

function finishRun(reason) {
  state = 'results';
  outcome = reason;
  best = Math.max(best, world.score);
  localStorage.setItem('lumenwake-best', String(best));
  announce(`Run finished. Score ${world.score}. ${world.collected} lights gathered. Press Enter to ride again.`);
}

function action(code) {
  sound.unlock();
  if (state === 'title' || state === 'results') { startRun(); return; }
  if (state === 'paused') { state = 'playing'; previous = performance.now(); return; }
  if (state === 'playing' && code === 'KeyR') startRun();
}

function togglePause() {
  if (state === 'playing') { state = 'paused'; announce('Paused. Press Escape or Enter to continue.'); }
  else if (state === 'paused') { state = 'playing'; previous = performance.now(); announce('Back into the current.'); }
}

const controls = new Controls(canvas, { action, pause: togglePause, size: SIZE });
soundButton.addEventListener('click', () => {
  sound.enabled = !sound.enabled;
  soundButton.textContent = sound.enabled ? 'Sound on' : 'Sound off';
  soundButton.setAttribute('aria-label', sound.enabled ? 'Turn sound off' : 'Turn sound on');
  if (sound.enabled) { sound.unlock(); sound.tone(600, 0.1, 'sine', 0.035, 120); }
});

function tick(nowMs) {
  const now = nowMs / 1000;
  const delta = Math.min((nowMs - previous) / 1000, 0.06);
  previous = nowMs;
  if (state === 'playing' && world) {
    const result = updateWorld(world, { ...controls.input, dash: controls.consumeDash() }, delta, now, sound);
    if (world.collected >= 12) finishRun('won');
    else if (result) finishRun(result);
    frame += delta;
    if (frame > 0.65) {
      frame = 0;
      announce(`${world.collected} of 12 lights. Score ${world.score}. ${world.lives} lives left.`);
    }
  }
  renderer.draw(state, world, now, best, outcome);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
