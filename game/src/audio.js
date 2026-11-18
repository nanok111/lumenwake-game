export class Soundscape {
  constructor() {
    this.context = null;
    this.enabled = true;
  }

  unlock() {
    if (!this.enabled) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!this.context) this.context = new AudioContext();
    if (this.context.state === 'suspended') this.context.resume();
  }

  tone(frequency, duration = 0.13, shape = 'sine', volume = 0.035, bend = 0) {
    if (!this.enabled || !this.context) return;
    const start = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency + bend), start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }

  collect(chain) {
    this.tone(510 + Math.min(chain, 9) * 58, 0.2, 'sine', 0.045, 240);
    if (chain >= 4) this.tone(920, 0.28, 'triangle', 0.022, -180);
  }

  dash() { this.tone(230, 0.22, 'triangle', 0.045, 510); }
  hit() { this.tone(170, 0.35, 'sawtooth', 0.045, -100); }
  begin() { this.tone(360, 0.35, 'sine', 0.04, 400); }
}
