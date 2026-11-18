import { SIZE, worldField } from './world.js';
import { clamp } from './math.js';

const COLORS = {
  ink: '#09172a', inkSoft: '#10263a', inkLine: '#234054',
  paper: '#f2ecd5', muted: '#91a9aa', mint: '#9ce6ce', gold: '#f3ce86',
  coral: '#f18d78', blue: '#73c8e5',
};

function roundedRect(ctx, x, y, width, height, radius, fill, stroke = null, line = 1) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke(); }
}

function text(ctx, value, x, y, size, color, font = '600', align = 'left') {
  ctx.font = `${font} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function drawBackdrop(ctx, now) {
  const wash = ctx.createLinearGradient(0, 0, SIZE.width, SIZE.height);
  wash.addColorStop(0, '#0a1a2c');
  wash.addColorStop(0.56, '#0b2032');
  wash.addColorStop(1, '#111c32');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, SIZE.width, SIZE.height);

  ctx.save();
  for (let i = 0; i < 110; i += 1) {
    const x = (i * 173.7 + Math.sin(i * 9.1) * 23) % SIZE.width;
    const y = (i * 97.3 + Math.cos(i * 2.7) * 17) % SIZE.height;
    const pulse = 0.28 + (Math.sin(now * (0.35 + (i % 4) * 0.12) + i * 1.7) + 1) * 0.18;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = i % 8 === 0 ? '#f1cd84' : '#a8d5ca';
    ctx.beginPath();
    ctx.arc(x, y, i % 13 === 0 ? 1.8 : 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = '#87b8b2';
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i += 1) {
    const x = 40 + i * 164 + Math.sin(now * 0.12 + i) * 12;
    ctx.beginPath();
    ctx.moveTo(x, 690);
    ctx.bezierCurveTo(x - 56, 548, x + 68, 408, x + 8, 280);
    ctx.bezierCurveTo(x - 44, 185, x + 41, 104, x + 24, 22);
    ctx.stroke();
    for (let leaf = 0; leaf < 5; leaf += 1) {
      const y = 600 - leaf * 105;
      ctx.beginPath();
      ctx.ellipse(x + (leaf % 2 ? 12 : -9), y, 11, 4, leaf % 2 ? 0.5 : -0.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawField(ctx) {
  const field = worldField();
  roundedRect(ctx, field.left, field.top, field.right - field.left, field.bottom - field.top, 22, 'rgba(6,17,30,.32)', 'rgba(112,158,164,.3)', 1.2);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(field.left, field.top, field.right - field.left, field.bottom - field.top, 22);
  ctx.clip();
  ctx.strokeStyle = 'rgba(115,160,162,.1)';
  ctx.lineWidth = 1;
  for (let x = field.left + 38; x < field.right; x += 54) {
    ctx.beginPath(); ctx.moveTo(x, field.top); ctx.lineTo(x, field.bottom); ctx.stroke();
  }
  for (let y = field.top + 30; y < field.bottom; y += 54) {
    ctx.beginPath(); ctx.moveTo(field.left, y); ctx.lineTo(field.right, y); ctx.stroke();
  }
  ctx.restore();
}

function drawHud(ctx, world) {
  text(ctx, 'LUMENWAKE', 88, 43, 14, COLORS.mint, '700');
  text(ctx, 'A small light can change the whole tide.', 88, 69, 13, COLORS.muted, '400');

  text(ctx, String(world.score).padStart(5, '0'), 540, 38, 31, COLORS.paper, '700', 'center');
  text(ctx, 'LIGHT GATHERED', 540, 66, 10, COLORS.muted, '700', 'center');

  text(ctx, 'SEASON', 790, 34, 10, COLORS.muted, '700');
  text(ctx, String(world.stage).padStart(2, '0'), 790, 56, 22, COLORS.gold, '700');
  text(ctx, 'LIVES', 898, 34, 10, COLORS.muted, '700');
  for (let index = 0; index < 3; index += 1) {
    text(ctx, '✦', 904 + index * 22, 59, 17, index < world.lives ? COLORS.coral : '#344555', '700');
  }

  const barX = 88, barY = 91, barWidth = 254;
  roundedRect(ctx, barX, barY, barWidth, 4, 2, '#24394a');
  roundedRect(ctx, barX, barY, barWidth * (world.dashCooldown > 0 ? 1 - world.dashCooldown / 2.2 : 1), 4, 2, COLORS.mint);
  text(ctx, world.dashCooldown > 0 ? 'PULSE RECHARGING' : 'PULSE READY', barX, 107, 9, COLORS.muted, '700');
  text(ctx, `FLOW ×${world.multiplier}`, 1011, 99, 11, world.multiplier > 1 ? COLORS.gold : COLORS.muted, '700', 'right');
}

function drawMote(ctx, mote, now) {
  const pulse = 1 + Math.sin(now * 3.4 + mote.phase) * 0.13;
  const radius = mote.radius * pulse;
  const tint = mote.value > 1 ? COLORS.coral : COLORS.gold;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(mote.x, mote.y, 1, mote.x, mote.y, radius * 3.5);
  glow.addColorStop(0, mote.value > 1 ? 'rgba(241,141,120,.38)' : 'rgba(243,206,134,.35)');
  glow.addColorStop(1, 'rgba(243,206,134,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(mote.x, mote.y, radius * 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.translate(mote.x, mote.y);
  ctx.rotate(now * 0.55 * mote.spin + mote.phase);
  ctx.fillStyle = tint;
  ctx.beginPath();
  ctx.moveTo(0, -radius * 1.4);
  ctx.quadraticCurveTo(radius * 1.1, -radius * 0.5, radius * 0.62, radius * 0.9);
  ctx.quadraticCurveTo(0, radius * 1.35, -radius * 0.62, radius * 0.9);
  ctx.quadraticCurveTo(-radius * 1.1, -radius * 0.5, 0, -radius * 1.4);
  ctx.fill();
  ctx.restore();
}

function drawHazard(ctx, hazard, now) {
  const pulse = 1 + Math.sin(now * 4 + hazard.phase) * 0.075;
  const radius = hazard.radius * pulse;
  ctx.save();
  ctx.translate(hazard.x, hazard.y);
  if (hazard.kind === 'thorn') {
    ctx.rotate(hazard.phase * 0.32);
    ctx.fillStyle = 'rgba(232,121,108,.16)';
    ctx.strokeStyle = COLORS.coral;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let point = 0; point < 12; point += 1) {
      const angle = point / 12 * Math.PI * 2;
      const length = radius * (point % 2 === 0 ? 1.3 : 0.82);
      if (point === 0) ctx.moveTo(Math.cos(angle) * length, Math.sin(angle) * length);
      else ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2); ctx.stroke();
  } else {
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, radius * 2.1);
    glow.addColorStop(0, 'rgba(241,141,120,.46)');
    glow.addColorStop(1, 'rgba(241,141,120,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, radius * 2.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f18d78';
    ctx.beginPath(); ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(241,141,120,.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, radius, now * 0.6, now * 0.6 + Math.PI * 1.55); ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer(ctx, world, now) {
  const player = world.player;
  if (player.invulnerable > 0 && Math.floor(now * 16) % 2 === 0) return;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 36);
  glow.addColorStop(0, 'rgba(156,230,206,.48)');
  glow.addColorStop(1, 'rgba(156,230,206,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#f2ecd5';
  ctx.strokeStyle = '#9ce6ce';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.quadraticCurveTo(9, -4, -7, -13);
  ctx.quadraticCurveTo(-5, -5, -12, 0);
  ctx.quadraticCurveTo(-5, 5, -7, 13);
  ctx.quadraticCurveTo(9, 4, 18, 0);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = world.dashFlash > 0 ? COLORS.blue : COLORS.gold;
  ctx.beginPath(); ctx.arc(-3, 0, 3.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawEffects(ctx, world) {
  for (const ring of world.rings) {
    ctx.globalAlpha = clamp(ring.life / ring.fullLife, 0, 1) * 0.78;
    ctx.strokeStyle = ring.tint;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2); ctx.stroke();
  }
  for (const particle of world.particles) {
    ctx.globalAlpha = clamp(particle.life, 0, 1);
    ctx.fillStyle = particle.tint;
    ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.radius * Math.min(1, particle.life * 2), 0, Math.PI * 2); ctx.fill();
    if (particle.sparkle) {
      ctx.fillRect(particle.x - particle.radius * 1.7, particle.y - 0.6, particle.radius * 3.4, 1.2);
      ctx.fillRect(particle.x - 0.6, particle.y - particle.radius * 1.7, 1.2, particle.radius * 3.4);
    }
  }
  ctx.globalAlpha = 1;
}

function drawStageBanner(ctx, world) {
  if (world.stageMessage <= 0) return;
  const opacity = Math.min(1, world.stageMessage * 1.4);
  ctx.globalAlpha = opacity;
  text(ctx, `SEASON ${String(world.stage).padStart(2, '0')} · THE CURRENT TURNS`, SIZE.width / 2, 145, 16, COLORS.mint, '700', 'center');
  ctx.globalAlpha = 1;
}

function drawTitle(ctx, now, best) {
  drawField(ctx);
  const bloom = 0.68 + Math.sin(now * 1.1) * 0.06;
  ctx.save(); ctx.globalAlpha = bloom;
  text(ctx, 'A FIELD GUIDE TO THE AFTERGLOW', SIZE.width / 2, 210, 11, COLORS.mint, '700', 'center');
  ctx.restore();
  text(ctx, 'Lumenwake', SIZE.width / 2, 286, 70, COLORS.paper, '700', 'center');
  text(ctx, 'Keep the little lights moving.', SIZE.width / 2, 336, 20, COLORS.gold, '400', 'center');

  const hero = { x: SIZE.width / 2, y: 435, angle: now * 0.4 - Math.PI / 2, radius: 13, invulnerable: 0, dashFlash: 0 };
  drawPlayer(ctx, { player: hero, dashFlash: 0 }, now);
  for (let i = 0; i < 5; i += 1) {
    const angle = now * 0.32 + i / 5 * Math.PI * 2;
    drawMote(ctx, { x: hero.x + Math.cos(angle) * 64, y: hero.y + Math.sin(angle) * 33, phase: i, spin: i % 2 ? 1 : -1, radius: i === 2 ? 10 : 7, value: 1 }, now);
  }
  text(ctx, 'GATHER 12 LIGHTS BEFORE THE NIGHT FALLS', SIZE.width / 2, 504, 14, COLORS.paper, '700', 'center');
  text(ctx, 'WASD / ARROWS steer     MOUSE aims     SPACE / CLICK pulses', SIZE.width / 2, 540, 12, COLORS.muted, '400', 'center');
  roundedRect(ctx, 422, 576, 256, 52, 26, '#153c48', '#71baaa', 1.2);
  text(ctx, 'PRESS ENTER TO DRIFT', SIZE.width / 2, 602, 13, COLORS.mint, '700', 'center');
  text(ctx, best > 0 ? `YOUR LONGEST TIDE  ${String(best).padStart(5, '0')}` : 'A NEW NIGHT, A NEW CURRENT', SIZE.width / 2, 665, 10, COLORS.muted, '600', 'center');
}

function drawPlaying(ctx, world, now, best) {
  drawField(ctx);
  drawHud(ctx, world);
  for (const mote of world.motes) drawMote(ctx, mote, now);
  for (const hazard of world.hazards) drawHazard(ctx, hazard, now);
  drawEffects(ctx, world);
  drawPlayer(ctx, world, now);
  drawStageBanner(ctx, world);

  if (world.chain >= 2 && world.comboTimer > 0) {
    const alpha = Math.min(1, world.comboTimer);
    ctx.globalAlpha = alpha;
    text(ctx, `${world.chain} IN FLOW`, world.player.x, world.player.y - 33, 12, COLORS.gold, '700', 'center');
    ctx.globalAlpha = 1;
  }
  text(ctx, `${Math.ceil(world.duration - world.elapsed)}s`, 1012, 69, 13, COLORS.paper, '700', 'right');
  if (best > 0) text(ctx, `BEST ${String(best).padStart(5, '0')}`, 1010, 47, 9, COLORS.muted, '600', 'right');
  text(ctx, 'ESC  PAUSE', 1010, 713, 9, COLORS.muted, '600', 'right');
}

function drawPause(ctx, world) {
  ctx.fillStyle = 'rgba(5,14,25,.68)'; ctx.fillRect(0, 0, SIZE.width, SIZE.height);
  roundedRect(ctx, 345, 292, 410, 176, 20, '#0e2638', '#47716f', 1.2);
  text(ctx, 'THE TIDE IS RESTING', SIZE.width / 2, 346, 25, COLORS.paper, '700', 'center');
  text(ctx, 'Press Enter or Escape to return to the current.', SIZE.width / 2, 393, 13, COLORS.muted, '400', 'center');
  text(ctx, 'R restarts this run', SIZE.width / 2, 430, 11, COLORS.mint, '600', 'center');
}

function drawResults(ctx, world, now, best, outcome) {
  drawField(ctx);
  for (const mote of world.motes) drawMote(ctx, mote, now);
  for (const hazard of world.hazards) drawHazard(ctx, hazard, now);
  drawEffects(ctx, world);
  const won = world.collected >= 12;
  text(ctx, won ? 'THE CURRENT REMEMBERS' : outcome === 'time' ? 'NIGHT HAS SETTLED' : 'THE TIDE LETS GO', SIZE.width / 2, 208, 12, COLORS.mint, '700', 'center');
  text(ctx, won ? 'What a lovely wake.' : 'There is always another light.', SIZE.width / 2, 273, 39, COLORS.paper, '700', 'center');
  text(ctx, String(world.score).padStart(5, '0'), SIZE.width / 2, 359, 54, COLORS.gold, '700', 'center');
  text(ctx, 'LIGHT SCORE', SIZE.width / 2, 403, 10, COLORS.muted, '700', 'center');

  roundedRect(ctx, 336, 454, 428, 78, 14, 'rgba(13,34,51,.82)', 'rgba(102,146,148,.35)', 1);
  text(ctx, `LIGHTS  ${String(world.collected).padStart(2, '0')} / 12`, 390, 482, 12, COLORS.paper, '700');
  text(ctx, `BEST FLOW  ×${world.bestChain}`, 710, 482, 12, COLORS.mint, '700', 'right');
  text(ctx, `SEASONS  ${String(world.stage).padStart(2, '0')}`, 390, 508, 11, COLORS.muted, '600');
  text(ctx, `BEST  ${String(best).padStart(5, '0')}`, 710, 508, 11, COLORS.muted, '600', 'right');

  roundedRect(ctx, 420, 568, 260, 52, 26, '#153c48', '#71baaa', 1.2);
  text(ctx, 'ENTER  ·  RIDE AGAIN', SIZE.width / 2, 594, 13, COLORS.mint, '700', 'center');
  text(ctx, 'Your next wake starts fresh.', SIZE.width / 2, 662, 11, COLORS.muted, '400', 'center');
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d', { alpha: false });
    this.width = 0;
    this.height = 0;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(window.innerWidth * ratio);
    this.canvas.height = Math.round(window.innerHeight * ratio);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.scale = Math.min(this.width / SIZE.width, this.height / SIZE.height);
    this.offsetX = (this.width - SIZE.width * this.scale) / 2;
    this.offsetY = (this.height - SIZE.height * this.scale) / 2;
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  draw(state, world, now, best, outcome) {
    const ctx = this.context;
    ctx.setTransform(window.devicePixelRatio > 1 ? Math.min(window.devicePixelRatio, 2) : 1, 0, 0, window.devicePixelRatio > 1 ? Math.min(window.devicePixelRatio, 2) : 1, 0, 0);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);
    if (world?.shake > 0 && state === 'playing') ctx.translate(Math.sin(now * 61) * world.shake, Math.cos(now * 49) * world.shake * 0.55);
    drawBackdrop(ctx, now);
    if (state === 'title') drawTitle(ctx, now, best);
    if (state === 'playing' || state === 'paused') {
      drawPlaying(ctx, world, now, best);
      if (state === 'paused') drawPause(ctx, world);
    }
    if (state === 'results') drawResults(ctx, world, now, best, outcome);
    ctx.restore();
  }
}
