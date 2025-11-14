const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('mini-map');
const minimapCtx = minimapCanvas.getContext('2d');

const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const healthEl = document.getElementById('health');
const scoreEl = document.getElementById('score');
const stageEl = document.getElementById('stage');
const finalScoreEl = document.getElementById('final-score');

const trackedKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyY']);
const input = {
  KeyW: false,
  KeyA: false,
  KeyS: false,
  KeyD: false,
  KeyY: false,
  fire: false
};

const state = {
  running: false,
  levelIndex: 1,
  score: 0,
  lastTime: 0,
  level: null,
  enemies: [],
  projectiles: [],
  enemyProjectiles: [],
  particles: [],
  player: {
    x: 4,
    y: 4,
    angle: 0,
    fov: Math.PI / 2.6,
    speed: 4.2,
    health: 100,
    maxHealth: 100,
    fireCooldown: 0,
    dashCooldown: 0
  }
};

const VIEW_DISTANCE = 30;
const PROJECTOR_HEIGHT = 1.6;
const RAY_STEP = 0.035;
const DASH_STRENGTH = 2.4;
const DASH_COOLDOWN = 3;
const PLAYER_PROJECTILE_SPEED = 18;

const ENEMY_TYPES = {
  stalker: {
    label: 'Phase Stalker',
    color: '#ff5c7a',
    health: 40,
    speed: 3.2,
    damage: 8,
    attackCooldown: 0.9,
    range: 0.9
  },
  brute: {
    label: 'Shield Brute',
    color: '#ffb347',
    health: 110,
    speed: 1.6,
    chargeSpeed: 4.2,
    damage: 22,
    attackCooldown: 1.6,
    range: 1.2
  },
  sentry: {
    label: 'Ion Sentry',
    color: '#57d0ff',
    health: 65,
    speed: 0,
    damage: 12,
    projectileSpeed: 11,
    attackCooldown: 1.4,
    range: 7
  }
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function wrapAngle(angle) {
  const tau = Math.PI * 2;
  return ((angle % tau) + tau) % tau;
}

function generateLevel(size) {
  const grid = Array.from({ length: size }, () => Array(size).fill(1));
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];
  let walkerX = Math.floor(size / 2);
  let walkerY = Math.floor(size / 2);
  grid[walkerY][walkerX] = 0;
  const targetFloor = Math.floor(size * size * 0.46);
  let carved = 1;

  function carveRoom(cx, cy) {
    const w = Math.floor(randomRange(3, 6));
    const h = Math.floor(randomRange(3, 6));
    for (let y = -h; y <= h; y++) {
      for (let x = -w; x <= w; x++) {
        const px = clamp(cx + x, 1, size - 2);
        const py = clamp(cy + y, 1, size - 2);
        grid[py][px] = 0;
      }
    }
  }

  while (carved < targetFloor) {
    const [dx, dy] = dirs[(Math.random() * dirs.length) | 0];
    walkerX = clamp(walkerX + dx, 1, size - 2);
    walkerY = clamp(walkerY + dy, 1, size - 2);
    if (grid[walkerY][walkerX] !== 0) {
      grid[walkerY][walkerX] = 0;
      carved++;
    }
    if (Math.random() < 0.08) {
      carveRoom(walkerX, walkerY);
    }
  }

  // sprinkle reinforced walls for visual variety
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      if (grid[y][x] === 1 && Math.random() < 0.08) {
        grid[y][x] = 2;
      }
    }
  }

  const floorCells = [];
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      if (grid[y][x] === 0) {
        floorCells.push({ x, y });
      }
    }
  }

  const spawnCell = floorCells[(Math.random() * floorCells.length) | 0] ?? {
    x: Math.floor(size / 2),
    y: Math.floor(size / 2)
  };

  return {
    grid,
    size,
    spawn: spawnCell,
    floorCells
  };
}

function cellAt(x, y) {
  const level = state.level;
  if (!level) return 1;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  if (yi < 0 || yi >= level.size || xi < 0 || xi >= level.size) return 1;
  return level.grid[yi][xi];
}

function isWalkable(x, y) {
  return cellAt(x, y) === 0;
}

function spawnEnemies(level, stage) {
  const enemyCount = clamp(5 + stage * 2, 6, 18);
  const enemies = [];
  const candidates = [...level.floorCells];
  const typeKeys = Object.keys(ENEMY_TYPES);
  while (enemies.length < enemyCount && candidates.length) {
    const idx = (Math.random() * candidates.length) | 0;
    const cell = candidates.splice(idx, 1)[0];
    const distToSpawn = Math.hypot(
      cell.x + 0.5 - (level.spawn.x + 0.5),
      cell.y + 0.5 - (level.spawn.y + 0.5)
    );
    if (distToSpawn < 4) continue;
    const type = typeKeys[(Math.random() * typeKeys.length) | 0];
    const blueprint = ENEMY_TYPES[type];
    const uniqueId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    enemies.push({
      id: uniqueId,
      type,
      x: cell.x + 0.5,
      y: cell.y + 0.5,
      angle: Math.random() * Math.PI * 2,
      health: blueprint.health,
      cooldown: 0
    });
  }
  return enemies;
}

function resetPlayer(level) {
  state.player.x = level.spawn.x + 0.5;
  state.player.y = level.spawn.y + 0.5;
  state.player.angle = Math.random() * Math.PI * 2;
  state.player.health = Math.min(state.player.maxHealth, state.player.health + 30);
  state.player.fireCooldown = 0;
  state.player.dashCooldown = 0.3;
}

function buildStage() {
  const size = clamp(30 + state.levelIndex * 2, 30, 48);
  state.level = generateLevel(size);
  resetPlayer(state.level);
  state.enemies = spawnEnemies(state.level, state.levelIndex);
  state.projectiles = [];
  state.enemyProjectiles = [];
  state.particles = [];
  updateHud();
}

function startSimulation() {
  state.levelIndex = 1;
  state.score = 0;
  buildStage();
  state.player.health = state.player.maxHealth;
  state.running = true;
  state.lastTime = performance.now();
  hud.classList.remove('hidden');
  endScreen.classList.remove('screen--visible');
  requestAnimationFrame(loop);
}

function loop(timestamp) {
  if (!state.running) return;
  const delta = Math.min(0.05, (timestamp - state.lastTime) / 1000);
  state.lastTime = timestamp;
  update(delta);
  render();
  requestAnimationFrame(loop);
}

function update(dt) {
  updatePlayer(dt);
  updateProjectiles(dt);
  updateEnemies(dt);
  updateEnemyProjectiles(dt);
  updateParticles(dt);
  if (state.enemies.length === 0) {
    state.score += 250;
    state.levelIndex += 1;
    buildStage();
  }
  updateHud();
}

function updatePlayer(dt) {
  const player = state.player;
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);

  const forward = { x: Math.cos(player.angle), y: Math.sin(player.angle) };
  const right = { x: Math.cos(player.angle + Math.PI / 2), y: Math.sin(player.angle + Math.PI / 2) };

  let moveForward = 0;
  if (input.KeyW) moveForward += 1;
  if (input.KeyS) moveForward -= 1;

  let moveStrafe = 0;
  if (input.KeyD) moveStrafe += 1;
  if (input.KeyA) moveStrafe -= 1;

  let velX = forward.x * moveForward + right.x * moveStrafe;
  let velY = forward.y * moveForward + right.y * moveStrafe;
  const mag = Math.hypot(velX, velY);
  if (mag > 0) {
    velX = (velX / mag) * player.speed * dt;
    velY = (velY / mag) * player.speed * dt;
    attemptMove(player, velX, velY);
  }

  if (input.fire) {
    tryShoot();
  }
}

function attemptDash() {
  const player = state.player;
  if (!state.running) return;
  if (player.dashCooldown > 0) return;
  const forward = { x: Math.cos(player.angle), y: Math.sin(player.angle) };
  attemptMove(player, forward.x * DASH_STRENGTH, forward.y * DASH_STRENGTH);
  player.dashCooldown = DASH_COOLDOWN;
}

function attemptMove(entity, offsetX, offsetY) {
  const newX = entity.x + offsetX;
  const newY = entity.y + offsetY;
  if (isWalkable(newX, entity.y)) {
    entity.x = newX;
  }
  if (isWalkable(entity.x, newY)) {
    entity.y = newY;
  }
}

function tryShoot() {
  if (state.player.fireCooldown > 0) return;
  state.projectiles.push({
    x: state.player.x,
    y: state.player.y,
    angle: state.player.angle + randomRange(-0.01, 0.01),
    speed: PLAYER_PROJECTILE_SPEED,
    ttl: 1.2,
    radius: 0.1
  });
  state.player.fireCooldown = 0.18;
}

function updateProjectiles(dt) {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const proj = state.projectiles[i];
    proj.ttl -= dt;
    proj.x += Math.cos(proj.angle) * proj.speed * dt;
    proj.y += Math.sin(proj.angle) * proj.speed * dt;

    if (proj.ttl <= 0 || cellAt(proj.x, proj.y) !== 0) {
      state.projectiles.splice(i, 1);
      continue;
    }

    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const enemy = state.enemies[j];
      if (Math.hypot(enemy.x - proj.x, enemy.y - proj.y) <= proj.radius + 0.35) {
        enemy.health -= 30;
        state.projectiles.splice(i, 1);
        if (enemy.health <= 0) {
          eliminateEnemy(j, enemy);
        }
        break;
      }
    }
  }
}

function eliminateEnemy(index, enemy) {
  state.enemies.splice(index, 1);
  state.score += 100;
  spawnParticles(enemy.x, enemy.y, ENEMY_TYPES[enemy.type].color);
}

function spawnParticles(x, y, color) {
  for (let i = 0; i < 12; i++) {
    state.particles.push({
      x,
      y,
      angle: Math.random() * Math.PI * 2,
      speed: randomRange(1, 4),
      life: randomRange(0.2, 0.6),
      color
    });
  }
}

function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.life -= dt;
    p.x += Math.cos(p.angle) * p.speed * dt;
    p.y += Math.sin(p.angle) * p.speed * dt;
    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
}

function updateEnemies(dt) {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i];
    const blueprint = ENEMY_TYPES[enemy.type];
    enemy.cooldown = Math.max(0, enemy.cooldown - dt);
    const dx = state.player.x - enemy.x;
    const dy = state.player.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    enemy.angle = Math.atan2(dy, dx);

    if (enemy.type === 'sentry') {
      if (dist < blueprint.range && enemy.cooldown === 0) {
        fireEnemyProjectile(enemy, blueprint);
        enemy.cooldown = blueprint.attackCooldown;
      }
    } else {
      let speed = blueprint.speed;
      if (enemy.type === 'brute' && dist < 4.5) {
        speed = blueprint.chargeSpeed;
      }
      const moveX = Math.cos(enemy.angle) * speed * dt;
      const moveY = Math.sin(enemy.angle) * speed * dt;
      attemptMove(enemy, moveX, moveY);
      if (dist < blueprint.range && enemy.cooldown === 0) {
        hurtPlayer(blueprint.damage);
        enemy.cooldown = blueprint.attackCooldown;
      }
    }
  }
}

function fireEnemyProjectile(enemy, blueprint) {
  state.enemyProjectiles.push({
    x: enemy.x,
    y: enemy.y,
    angle: enemy.angle + randomRange(-0.05, 0.05),
    speed: blueprint.projectileSpeed,
    ttl: 4,
    damage: blueprint.damage
  });
}

function updateEnemyProjectiles(dt) {
  for (let i = state.enemyProjectiles.length - 1; i >= 0; i--) {
    const proj = state.enemyProjectiles[i];
    proj.ttl -= dt;
    proj.x += Math.cos(proj.angle) * proj.speed * dt;
    proj.y += Math.sin(proj.angle) * proj.speed * dt;
    if (proj.ttl <= 0 || cellAt(proj.x, proj.y) !== 0) {
      state.enemyProjectiles.splice(i, 1);
      continue;
    }
    if (Math.hypot(state.player.x - proj.x, state.player.y - proj.y) < 0.5) {
      hurtPlayer(proj.damage);
      state.enemyProjectiles.splice(i, 1);
    }
  }
}

function hurtPlayer(amount) {
  state.player.health -= amount;
  if (state.player.health <= 0) {
    state.player.health = 0;
    triggerGameOver();
  }
}

function triggerGameOver() {
  state.running = false;
  hud.classList.add('hidden');
  endScreen.classList.add('screen--visible');
  finalScoreEl.textContent = `Score: ${state.score}`;
  document.exitPointerLock?.();
}

function updateHud() {
  healthEl.textContent = `Health: ${Math.max(0, state.player.health | 0)}`;
  scoreEl.textContent = `Score: ${state.score}`;
  stageEl.textContent = `Sector: ${state.levelIndex}`;
}

function raycast(angle) {
  let distance = 0;
  let hit = null;
  while (distance < VIEW_DISTANCE) {
    distance += RAY_STEP;
    const testX = state.player.x + Math.cos(angle) * distance;
    const testY = state.player.y + Math.sin(angle) * distance;
    const cell = cellAt(testX, testY);
    if (cell !== 0) {
      hit = {
        distance,
        cell,
        hitX: testX,
        hitY: testY
      };
      break;
    }
  }
  if (!hit) {
    hit = { distance: VIEW_DISTANCE, cell: 0, hitX: null, hitY: null };
  }
  return hit;
}

function render() {
  const width = canvas.width;
  const height = canvas.height;
  ctx.fillStyle = '#04050d';
  ctx.fillRect(0, 0, width, height / 2);
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, height / 2, width, height / 2);
  drawWalls();
  drawSprites();
  drawProjectiles();
  drawParticles();
  renderMinimap();
}

function drawWalls() {
  const width = canvas.width;
  const height = canvas.height;
  const planeDist = width / (2 * Math.tan(state.player.fov / 2));
  for (let column = 0; column < width; column++) {
    const cameraX = (2 * column) / width - 1;
    const rayAngle = state.player.angle + cameraX * (state.player.fov / 2);
    const hit = raycast(rayAngle);
    const correctedDistance = hit.distance * Math.cos(rayAngle - state.player.angle);
    if (correctedDistance <= 0.0001) continue;
    const wallHeight = (PROJECTOR_HEIGHT / correctedDistance) * planeDist;
    const top = (height / 2) - wallHeight / 2;
    const shadeBase = hit.cell === 2 ? 240 : 200;
    const light = clamp(1 - correctedDistance / VIEW_DISTANCE, 0.1, 1);
    const color = `hsl(${shadeBase}, 60%, ${30 + light * 35}%)`;
    ctx.fillStyle = color;
    ctx.fillRect(column, top, 1, wallHeight);
  }
}

function drawSprites() {
  const planeDist = canvas.width / (2 * Math.tan(state.player.fov / 2));
  const sprites = [];
  for (const enemy of state.enemies) {
    sprites.push({
      type: 'enemy',
      color: ENEMY_TYPES[enemy.type].color,
      x: enemy.x,
      y: enemy.y,
      distance: Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y)
    });
  }
  for (const proj of state.enemyProjectiles) {
    sprites.push({
      type: 'enemyProjectile',
      color: '#ffef5c',
      x: proj.x,
      y: proj.y,
      distance: Math.hypot(proj.x - state.player.x, proj.y - state.player.y)
    });
  }
  sprites.sort((a, b) => b.distance - a.distance);
  for (const sprite of sprites) {
    const projection = projectToScreen(sprite.x, sprite.y, planeDist);
    if (!projection) continue;
    if (projection.depth <= 0.1 || projection.screenX < -1000 || projection.screenX > canvas.width + 1000) continue;
    const size = (PROJECTOR_HEIGHT / projection.depth) * planeDist * (sprite.type === 'enemyProjectile' ? 0.2 : 0.7);
    const x = projection.screenX - size / 2;
    const y = canvas.height / 2 - size;
    ctx.fillStyle = sprite.color;
    ctx.globalAlpha = clamp(1 - projection.depth / VIEW_DISTANCE, 0.3, 1);
    ctx.fillRect(x, y, size, size);
    ctx.globalAlpha = 1;
  }
}

function projectToScreen(worldX, worldY, planeDist) {
  const dx = worldX - state.player.x;
  const dy = worldY - state.player.y;
  const sin = Math.sin(state.player.angle);
  const cos = Math.cos(state.player.angle);
  const cameraX = dx * cos + dy * sin;
  const cameraY = dy * cos - dx * sin;
  if (cameraX <= 0.01) return null;
  const screenX = canvas.width / 2 - (cameraY * planeDist) / cameraX;
  const depth = cameraX;
  return { screenX, depth };
}

function drawProjectiles() {
  ctx.fillStyle = '#74fff4';
  for (const proj of state.projectiles) {
    const projection = projectToScreen(proj.x, proj.y, canvas.width / (2 * Math.tan(state.player.fov / 2)));
    if (!projection) continue;
    const size = 6 * clamp(1 - projection.depth / VIEW_DISTANCE, 0.2, 1);
    ctx.globalAlpha = 0.9;
    ctx.fillRect(projection.screenX - size / 2, canvas.height / 2 - size, size, size);
    ctx.globalAlpha = 1;
  }
}

function drawParticles() {
  const planeDist = canvas.width / (2 * Math.tan(state.player.fov / 2));
  for (const particle of state.particles) {
    const projection = projectToScreen(particle.x, particle.y, planeDist);
    if (!projection) continue;
    const size = 3 * clamp(1 - projection.depth / VIEW_DISTANCE, 0.1, 0.8);
    ctx.globalAlpha = clamp(particle.life, 0, 1);
    ctx.fillStyle = particle.color;
    ctx.fillRect(projection.screenX - size / 2, canvas.height / 2 - size / 2, size, size);
    ctx.globalAlpha = 1;
  }
}

function renderMinimap() {
  if (!state.level) return;
  const { size, grid } = state.level;
  const cellSize = minimapCanvas.width / size;
  minimapCtx.fillStyle = 'rgba(4, 4, 8, 0.95)';
  minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x] !== 0) {
        minimapCtx.fillStyle = grid[y][x] === 2 ? '#3c4a5a' : '#1c2530';
        minimapCtx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }
  minimapCtx.fillStyle = '#00ffd9';
  minimapCtx.beginPath();
  minimapCtx.arc(state.player.x * cellSize, state.player.y * cellSize, 3, 0, Math.PI * 2);
  minimapCtx.fill();
  minimapCtx.strokeStyle = '#00ffd9';
  minimapCtx.beginPath();
  minimapCtx.moveTo(state.player.x * cellSize, state.player.y * cellSize);
  minimapCtx.lineTo(
    (state.player.x + Math.cos(state.player.angle) * 1.5) * cellSize,
    (state.player.y + Math.sin(state.player.angle) * 1.5) * cellSize
  );
  minimapCtx.stroke();

  for (const enemy of state.enemies) {
    minimapCtx.fillStyle = ENEMY_TYPES[enemy.type].color;
    minimapCtx.fillRect(enemy.x * cellSize - 2, enemy.y * cellSize - 2, 4, 4);
  }
}

startBtn.addEventListener('click', () => {
  menu.classList.remove('screen--visible');
  startSimulation();
  requestPointerLock();
});

restartBtn.addEventListener('click', () => {
  endScreen.classList.remove('screen--visible');
  menu.classList.add('screen--visible');
});

function requestPointerLock() {
  canvas.requestPointerLock?.();
}

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== canvas && state.running) {
    input.fire = false;
  }
});

canvas.addEventListener('mousedown', (event) => {
  if (!state.running) return;
  if (document.pointerLockElement !== canvas) {
    requestPointerLock();
    return;
  }
  if (event.button === 0) {
    input.fire = true;
  }
});

document.addEventListener('mouseup', (event) => {
  if (event.button === 0) {
    input.fire = false;
  }
});

document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement !== canvas) return;
  state.player.angle = wrapAngle(state.player.angle + event.movementX * 0.0025);
});

document.addEventListener('keydown', (event) => {
  if (!trackedKeys.has(event.code)) return;
  if (event.code === 'KeyY' && !input.KeyY) {
    attemptDash();
  }
  input[event.code] = true;
  event.preventDefault();
});

document.addEventListener('keyup', (event) => {
  if (!trackedKeys.has(event.code)) return;
  input[event.code] = false;
  event.preventDefault();
});

window.addEventListener('blur', () => {
  input.fire = false;
  trackedKeys.forEach((key) => (input[key] = false));
});

