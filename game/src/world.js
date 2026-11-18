import { clamp, distance, random } from './math.js';

export const SIZE = { width: 1100, height: 760 };
const FIELD = { left: 86, top: 120, right: 1014, bottom: 694 };

function openPoint(rng, player, hazards, minimum = 110) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const point = {
      x: FIELD.left + 42 + rng() * (FIELD.right - FIELD.left - 84),
      y: FIELD.top + 42 + rng() * (FIELD.bottom - FIELD.top - 84),
    };
    if (distance(point, player) > minimum && hazards.every(hazard => distance(point, hazard) > 90)) return point;
  }
  return { x: 820, y: 300 };
}

function makeMote(rng, player, hazards, value = 1) {
  const point = openPoint(rng, player, hazards);
  return { ...point, phase: rng() * Math.PI * 2, spin: rng() * 2 - 1, value, radius: value > 1 ? 12 : 8 };
}

function makeHazards(rng, player, count) {
  return Array.from({ length: count }, () => {
    const point = openPoint(rng, player, []);
    return {
      ...point,
      baseX: point.x,
      baseY: point.y,
      phase: rng() * Math.PI * 2,
      speed: 0.6 + rng() * 0.8,
      range: 30 + rng() * 55,
      radius: 19 + rng() * 7,
      kind: rng() > 0.5 ? 'thorn' : 'wisp',
      warning: 1.8 + rng() * 4,
    };
  });
}

export function createWorld(seed = Date.now()) {
  const rng = random(seed);
  const player = { x: 550, y: 410, vx: 0, vy: 0, angle: -Math.PI / 2, radius: 13, invulnerable: 1.2 };
  const hazards = makeHazards(rng, player, 4);
  return {
    rng, player, hazards,
    motes: Array.from({ length: 8 }, () => makeMote(rng, player, hazards)),
    particles: [], rings: [],
    elapsed: 0, score: 0, collected: 0, lives: 3, chain: 0, bestChain: 0,
    multiplier: 1, dashCooldown: 0, dashFlash: 0, shake: 0, hitFlash: 0,
    stage: 1, stageMessage: 2.2, comboTimer: 0, lastCollect: -10,
    duration: 75, seed,
  };
}

export function addBurst(world, x, y, tint, amount = 12, strength = 1) {
  for (let index = 0; index < amount; index += 1) {
    const angle = world.rng() * Math.PI * 2;
    const speed = (35 + world.rng() * 170) * strength;
    world.particles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: 0.35 + world.rng() * 0.65, fullLife: 1, radius: 1.5 + world.rng() * 3,
      tint, sparkle: world.rng() > 0.72,
    });
  }
}

function updateHazards(world, delta) {
  for (const hazard of world.hazards) {
    hazard.phase += delta * hazard.speed;
    hazard.x = hazard.baseX + Math.cos(hazard.phase * 1.15) * hazard.range;
    hazard.y = hazard.baseY + Math.sin(hazard.phase) * hazard.range * 0.58;
    hazard.warning -= delta;
    if (hazard.warning <= 0) {
      hazard.warning = 3.2 + world.rng() * 3.8;
      hazard.kind = hazard.kind === 'wisp' ? 'thorn' : 'wisp';
    }
  }
}

function collectMote(world, index, now, sound) {
  const mote = world.motes[index];
  const player = world.player;
  const continued = now - world.lastCollect < 2.3;
  world.chain = continued ? world.chain + 1 : 1;
  world.bestChain = Math.max(world.bestChain, world.chain);
  world.comboTimer = 2.3;
  world.lastCollect = now;
  world.multiplier = Math.min(4, 1 + Math.floor((world.chain - 1) / 3));
  world.score += mote.value * 100 * world.multiplier;
  world.collected += mote.value;
  world.rings.push({ x: mote.x, y: mote.y, radius: 7, life: 0.55, fullLife: 0.55, tint: '#f8dc91' });
  addBurst(world, mote.x, mote.y, mote.value > 1 ? '#f59f73' : '#f8dc91', 14, 1.2);
  world.motes.splice(index, 1, makeMote(world.rng, player, world.hazards, world.rng() > 0.91 ? 3 : 1));
  sound?.collect(world.chain);

  if (world.collected % 6 === 0) {
    world.stage += 1;
    world.stageMessage = 2.5;
    world.hazards.push(...makeHazards(world.rng, player, 1));
    world.duration = Math.min(90, world.duration + 4);
    world.rings.push({ x: player.x, y: player.y, radius: 12, life: 1.1, fullLife: 1.1, tint: '#93e6cc' });
  }
}

function damagePlayer(world, sound) {
  const player = world.player;
  if (player.invulnerable > 0) return;
  world.lives -= 1;
  world.chain = 0;
  world.multiplier = 1;
  player.invulnerable = 1.55;
  world.shake = 12;
  world.hitFlash = 0.2;
  addBurst(world, player.x, player.y, '#ef9274', 24, 1.35);
  world.rings.push({ x: player.x, y: player.y, radius: 10, life: 0.8, fullLife: 0.8, tint: '#ef9274' });
  sound?.hit();
}

export function updateWorld(world, input, delta, now, sound) {
  const dt = Math.min(delta, 0.04);
  const player = world.player;
  world.elapsed += dt;
  world.dashCooldown = Math.max(0, world.dashCooldown - dt);
  world.dashFlash = Math.max(0, world.dashFlash - dt);
  world.shake = Math.max(0, world.shake - dt * 30);
  world.hitFlash = Math.max(0, world.hitFlash - dt);
  world.stageMessage = Math.max(0, world.stageMessage - dt);
  world.comboTimer = Math.max(0, world.comboTimer - dt);
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  updateHazards(world, dt);

  let dx = Number(input.right) - Number(input.left);
  let dy = Number(input.down) - Number(input.up);
  const length = Math.hypot(dx, dy);
  if (length > 0) { dx /= length; dy /= length; }
  const acceleration = input.focus ? 930 : 740;
  player.vx += dx * acceleration * dt;
  player.vy += dy * acceleration * dt;
  const drag = Math.pow(input.focus ? 0.09 : 0.22, dt);
  player.vx *= drag;
  player.vy *= drag;
  const speed = Math.hypot(player.vx, player.vy);
  const maximum = input.focus ? 195 : 280;
  if (speed > maximum) { player.vx = player.vx / speed * maximum; player.vy = player.vy / speed * maximum; }
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  const bounds = { left: FIELD.left + 15, right: FIELD.right - 15, top: FIELD.top + 15, bottom: FIELD.bottom - 15 };
  if (player.x < bounds.left || player.x > bounds.right) player.vx *= -0.42;
  if (player.y < bounds.top || player.y > bounds.bottom) player.vy *= -0.42;
  player.x = clamp(player.x, bounds.left, bounds.right);
  player.y = clamp(player.y, bounds.top, bounds.bottom);

  if (input.aim) player.angle = Math.atan2(input.aim.y - player.y, input.aim.x - player.x);
  else if (Math.hypot(player.vx, player.vy) > 18) player.angle = Math.atan2(player.vy, player.vx);

  if (input.dash && world.dashCooldown <= 0) {
    let dashX = dx, dashY = dy;
    if (Math.hypot(dashX, dashY) < 0.2) { dashX = Math.cos(player.angle); dashY = Math.sin(player.angle); }
    const dashLength = Math.hypot(dashX, dashY);
    player.vx = dashX / dashLength * 610;
    player.vy = dashY / dashLength * 610;
    player.invulnerable = Math.max(player.invulnerable, 0.22);
    world.dashCooldown = 2.2;
    world.dashFlash = 0.26;
    addBurst(world, player.x, player.y, '#98e8d0', 12, 0.8);
    sound?.dash();
  }

  for (let index = world.motes.length - 1; index >= 0; index -= 1) {
    const mote = world.motes[index];
    if (distance(player, mote) < player.radius + mote.radius + 5) collectMote(world, index, now, sound);
  }
  for (const hazard of world.hazards) {
    if (distance(player, hazard) < player.radius + hazard.radius * 0.72) damagePlayer(world, sound);
  }

  for (const particle of world.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= Math.pow(0.08, dt);
    particle.vy *= Math.pow(0.08, dt);
    particle.life -= dt;
  }
  world.particles = world.particles.filter(particle => particle.life > 0);
  for (const ring of world.rings) { ring.life -= dt; ring.radius += dt * 82; }
  world.rings = world.rings.filter(ring => ring.life > 0);

  if (world.elapsed >= world.duration) return 'time';
  if (world.lives <= 0) return 'lost';
  return null;
}

export function worldField() { return { ...FIELD }; }
