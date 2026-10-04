export const STARFALL_VERSION = "1.0.0";

export const DEFAULT_CONFIG = Object.freeze({
  width: 960,
  height: 540,
  runDuration: 150,
  eclipseAt: 120,
  maxLight: 100,
  shotCost: 0.55,
  flareCost: 18,
  flareCooldown: 6,
  playerSpeed: 255,
  fireInterval: 0.14,
});

const ENEMY_BLUEPRINTS = Object.freeze({
  hunter: { radius: 13, hp: 1, speed: 62, score: 100, fragments: 2 },
  siphon: { radius: 15, hp: 2, speed: 52, score: 180, fragments: 3 },
  splitter: { radius: 19, hp: 2, speed: 43, score: 240, fragments: 2 },
  shard: { radius: 8, hp: 1, speed: 104, score: 60, fragments: 1 },
  eclipse: { radius: 52, hp: 45, speed: 38, score: 5000, fragments: 0 },
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = value + Math.imul(value ^ (value >>> 7), 61 | value) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function segmentCircleHit(x1, y1, x2, y2, cx, cy, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0
    ? 0
    : clamp(((cx - x1) * dx + (cy - y1) * dy) / lengthSquared, 0, 1);
  const closestX = x1 + dx * t;
  const closestY = y1 + dy * t;
  return Math.hypot(cx - closestX, cy - closestY) <= radius;
}

export function phaseForTime(elapsed, config = DEFAULT_CONFIG) {
  if (elapsed >= config.eclipseAt) return "ECLIPSE";
  if (elapsed >= 80) return "STARVED";
  if (elapsed >= 40) return "PRESSURE";
  return "CONTACT";
}

export function riskMultiplier(light, maxLight = DEFAULT_CONFIG.maxLight) {
  return 1 + (1 - clamp(light / maxLight, 0, 1)) * 1.5;
}

export class StarfallSimulation {
  constructor(options = {}) {
    this.config = { ...DEFAULT_CONFIG, ...options };
    this.width = this.config.width;
    this.height = this.config.height;
    this.seed = 1;
    this.random = mulberry32(this.seed);
    this.nextId = 1;
    this.events = [];
    this.state = "idle";
    this.resetState();
  }

  resetState() {
    this.elapsed = 0;
    this.score = 0;
    this.kills = 0;
    this.shots = 0;
    this.hits = 0;
    this.light = this.config.maxLight;
    this.spawnTimer = 0.65;
    this.flareCooldown = 0;
    this.eclipseSpawned = false;
    this.lastPhase = "CONTACT";
    this.endReason = null;
    this.player = {
      x: this.width / 2,
      y: this.height / 2,
      radius: 13,
      cooldown: 0,
      invulnerable: 0,
      angle: 0,
    };
    this.bullets = [];
    this.enemies = [];
    this.fragments = [];
    this.events = [];
  }

  start(seed = Date.now()) {
    this.seed = (Number(seed) || 1) >>> 0;
    this.random = mulberry32(this.seed);
    this.nextId = 1;
    this.resetState();
    this.state = "running";
    this.emit("start", { seed: this.seed });
    this.emit("announcement", { text: "PROTECT THE LAST LIGHT" });
    return this.snapshot();
  }

  resize(width, height) {
    const nextWidth = Math.max(320, finite(width, this.width));
    const nextHeight = Math.max(320, finite(height, this.height));
    const scaleX = nextWidth / this.width;
    const scaleY = nextHeight / this.height;
    const move = (entity) => {
      entity.x *= scaleX;
      entity.y *= scaleY;
      if ("prevX" in entity) entity.prevX *= scaleX;
      if ("prevY" in entity) entity.prevY *= scaleY;
    };
    move(this.player);
    this.bullets.forEach(move);
    this.enemies.forEach(move);
    this.fragments.forEach(move);
    this.width = nextWidth;
    this.height = nextHeight;
    this.clampPlayer();
  }

  pause() {
    if (this.state === "running") {
      this.state = "paused";
      this.emit("pause");
    }
  }

  resume() {
    if (this.state === "paused") {
      this.state = "running";
      this.emit("resume");
    }
  }

  togglePause() {
    if (this.state === "running") this.pause();
    else if (this.state === "paused") this.resume();
    return this.state;
  }

  emit(type, detail = {}) {
    this.events.push({ type, ...detail });
  }

  consumeEvents() {
    return this.events.splice(0);
  }

  setLight(value) {
    this.light = clamp(finite(value), 0, this.config.maxLight);
  }

  step(delta, input = {}) {
    if (this.state !== "running") return this.snapshot();
    let remaining = clamp(finite(delta), 0, 0.25);
    while (remaining > 0 && this.state === "running") {
      const dt = Math.min(remaining, 1 / 60);
      this.updateSlice(dt, input);
      remaining -= dt;
    }
    return this.snapshot();
  }

  updateSlice(dt, input) {
    this.elapsed += dt;
    this.player.cooldown = Math.max(0, this.player.cooldown - dt);
    this.player.invulnerable = Math.max(0, this.player.invulnerable - dt);
    this.flareCooldown = Math.max(0, this.flareCooldown - dt);

    const phase = phaseForTime(this.elapsed, this.config);
    if (phase !== this.lastPhase) {
      this.lastPhase = phase;
      const messages = {
        PRESSURE: "THE SWARM IS ADAPTING",
        STARVED: "LIGHT THIEVES INBOUND",
        ECLIPSE: "ECLIPSE CONTACT",
      };
      this.emit("phase", { phase });
      this.emit("announcement", { text: messages[phase] });
    }

    this.updatePlayer(dt, input);
    this.updateBullets(dt);
    this.updateDirector(dt);
    this.updateEnemies(dt);
    this.resolveBulletHits();
    this.resolvePlayerContacts();
    this.updateFragments(dt);

    this.light = clamp(this.light - 0.12 * dt, 0, this.config.maxLight);
    if (this.light <= 0) this.finish(false, "light-expired");
    if (this.elapsed >= this.config.runDuration && this.state === "running") {
      const eclipseAlive = this.enemies.some((enemy) => enemy.type === "eclipse");
      this.finish(!eclipseAlive, eclipseAlive ? "eclipse-consumed" : "eclipse-broken");
    }
  }

  updatePlayer(dt, input) {
    const moveX = clamp(finite(input.moveX), -1, 1);
    const moveY = clamp(finite(input.moveY), -1, 1);
    const magnitude = Math.hypot(moveX, moveY) || 1;
    const lowLightPenalty = this.light < 15 ? 0.84 : 1;
    this.player.x += moveX / magnitude * this.config.playerSpeed * lowLightPenalty * dt;
    this.player.y += moveY / magnitude * this.config.playerSpeed * lowLightPenalty * dt;
    this.clampPlayer();

    const aimX = finite(input.aimX, this.player.x + 1);
    const aimY = finite(input.aimY, this.player.y);
    this.player.angle = Math.atan2(aimY - this.player.y, aimX - this.player.x);

    if (input.fire && this.player.cooldown <= 0 && this.light > this.config.shotCost) {
      this.fire(this.player.angle);
    }
  }

  clampPlayer() {
    const margin = this.player.radius + 5;
    this.player.x = clamp(this.player.x, margin, this.width - margin);
    this.player.y = clamp(this.player.y, margin, this.height - margin);
  }

  fire(angle) {
    const speed = 590;
    const muzzleX = this.player.x + Math.cos(angle) * 18;
    const muzzleY = this.player.y + Math.sin(angle) * 18;
    this.bullets.push({
      id: this.nextId++,
      x: muzzleX,
      y: muzzleY,
      prevX: muzzleX,
      prevY: muzzleY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.25,
    });
    this.player.cooldown = this.config.fireInterval;
    this.light = clamp(this.light - this.config.shotCost, 0, this.config.maxLight);
    this.shots += 1;
    this.emit("shot", { x: muzzleX, y: muzzleY, angle });
  }

  triggerFlare() {
    if (this.state !== "running" || this.flareCooldown > 0 || this.light < this.config.flareCost) return false;
    this.light -= this.config.flareCost;
    this.flareCooldown = this.config.flareCooldown;
    const radius = Math.min(this.width, this.height) * 0.31;
    this.emit("flare", { x: this.player.x, y: this.player.y, radius });
    for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
      const enemy = this.enemies[index];
      if (Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) <= radius + enemy.radius) {
        const damage = enemy.type === "eclipse" ? 4 : 2;
        enemy.hp -= damage;
        this.emit("hit", { x: enemy.x, y: enemy.y, enemyType: enemy.type, flare: true });
        if (enemy.hp <= 0) this.destroyEnemy(index);
      }
    }
    return true;
  }

  updateBullets(dt) {
    this.bullets.forEach((bullet) => {
      bullet.prevX = bullet.x;
      bullet.prevY = bullet.y;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
    });
    this.bullets = this.bullets.filter((bullet) => (
      bullet.life > 0 &&
      bullet.x > -30 && bullet.x < this.width + 30 &&
      bullet.y > -30 && bullet.y < this.height + 30
    ));
  }

  updateDirector(dt) {
    if (!this.eclipseSpawned && this.elapsed >= this.config.eclipseAt) {
      this.eclipseSpawned = true;
      this.spawnEnemy("eclipse", { x: this.width / 2, y: -70 });
      this.spawnTimer = 1.25;
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer > 0 || this.enemies.length >= 44) return;
    const phase = phaseForTime(this.elapsed, this.config);
    const intervals = { CONTACT: 0.88, PRESSURE: 0.64, STARVED: 0.49, ECLIPSE: 0.72 };
    const jitter = 0.8 + this.random() * 0.4;
    this.spawnTimer = intervals[phase] * jitter;
    this.spawnEnemy(this.pickEnemyType(phase));
  }

  pickEnemyType(phase) {
    const roll = this.random();
    if (phase === "CONTACT") return "hunter";
    if (phase === "PRESSURE") return roll < 0.7 ? "hunter" : "splitter";
    if (phase === "STARVED") {
      if (roll < 0.48) return "hunter";
      if (roll < 0.76) return "siphon";
      return "splitter";
    }
    if (roll < 0.45) return "hunter";
    if (roll < 0.72) return "siphon";
    return "splitter";
  }

  spawnEnemy(type = "hunter", overrides = {}) {
    const blueprint = ENEMY_BLUEPRINTS[type] || ENEMY_BLUEPRINTS.hunter;
    const side = Math.floor(this.random() * 4);
    const edge = blueprint.radius + 18;
    let x = side === 0 ? -edge : side === 1 ? this.width + edge : this.random() * this.width;
    let y = side === 2 ? -edge : side === 3 ? this.height + edge : this.random() * this.height;
    const enemy = {
      id: this.nextId++,
      type,
      x: finite(overrides.x, x),
      y: finite(overrides.y, y),
      radius: blueprint.radius,
      hp: blueprint.hp,
      maxHp: blueprint.hp,
      speed: blueprint.speed * (0.92 + this.random() * 0.16),
      score: blueprint.score,
      fragments: blueprint.fragments,
      age: 0,
      orbit: this.random() < 0.5 ? -1 : 1,
      pulseTimer: 2.8,
      pulseRadius: 0,
    };
    Object.assign(enemy, overrides);
    this.enemies.push(enemy);
    this.emit("spawn", { enemyType: type, id: enemy.id });
    return enemy;
  }

  updateEnemies(dt) {
    for (const enemy of this.enemies) {
      enemy.age += dt;
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;
      const nx = dx / distance;
      const ny = dy / distance;

      if (enemy.type === "siphon") {
        const approach = distance > 165 ? 1 : distance < 108 ? -0.7 : 0;
        enemy.x += (nx * approach - ny * enemy.orbit * 0.72) * enemy.speed * dt;
        enemy.y += (ny * approach + nx * enemy.orbit * 0.72) * enemy.speed * dt;
        if (distance < 178) {
          const drained = 4.2 * dt;
          this.light = Math.max(0, this.light - drained);
          if (Math.floor(enemy.age * 4) !== Math.floor((enemy.age - dt) * 4)) {
            this.emit("siphon", { x: enemy.x, y: enemy.y });
          }
        }
      } else if (enemy.type === "splitter") {
        const wobble = Math.sin(enemy.age * 3.1 + enemy.id) * 0.38;
        enemy.x += (nx - ny * wobble) * enemy.speed * dt;
        enemy.y += (ny + nx * wobble) * enemy.speed * dt;
      } else if (enemy.type === "eclipse") {
        const targetX = this.width / 2;
        const targetY = this.height * 0.27;
        const targetDistance = Math.hypot(targetX - enemy.x, targetY - enemy.y);
        if (targetDistance > 4) {
          enemy.x += (targetX - enemy.x) / targetDistance * enemy.speed * dt;
          enemy.y += (targetY - enemy.y) / targetDistance * enemy.speed * dt;
        }
        enemy.pulseTimer -= dt;
        if (enemy.pulseTimer <= 0) {
          enemy.pulseTimer = 4.2;
          enemy.pulseRadius = 1;
          this.emit("eclipse-pulse", { x: enemy.x, y: enemy.y });
        }
        if (enemy.pulseRadius > 0) {
          const previous = enemy.pulseRadius;
          enemy.pulseRadius += Math.min(this.width, this.height) * 0.48 * dt;
          const playerDistance = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
          if (previous < playerDistance && enemy.pulseRadius >= playerDistance && this.player.invulnerable <= 0) {
            this.damagePlayer(9, "eclipse-pulse", enemy.x, enemy.y);
          }
          if (enemy.pulseRadius > Math.max(this.width, this.height)) enemy.pulseRadius = 0;
        }
      } else {
        enemy.x += nx * enemy.speed * dt;
        enemy.y += ny * enemy.speed * dt;
      }
    }
  }

  resolveBulletHits() {
    for (let bulletIndex = this.bullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
      const bullet = this.bullets[bulletIndex];
      for (let enemyIndex = this.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
        const enemy = this.enemies[enemyIndex];
        if (!segmentCircleHit(
          bullet.prevX,
          bullet.prevY,
          bullet.x,
          bullet.y,
          enemy.x,
          enemy.y,
          enemy.radius + 3,
        )) continue;

        this.bullets.splice(bulletIndex, 1);
        enemy.hp -= 1;
        this.hits += 1;
        this.emit("hit", { x: enemy.x, y: enemy.y, enemyType: enemy.type });
        if (enemy.hp <= 0) this.destroyEnemy(enemyIndex);
        break;
      }
    }
  }

  resolvePlayerContacts() {
    if (this.player.invulnerable > 0) return;
    for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
      const enemy = this.enemies[index];
      if (Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) >= enemy.radius + this.player.radius) continue;
      const damage = enemy.type === "eclipse" ? 36 : enemy.type === "shard" ? 18 : 27;
      this.damagePlayer(damage, "impact", enemy.x, enemy.y);
      if (enemy.type !== "eclipse") this.enemies.splice(index, 1);
      break;
    }
  }

  damagePlayer(amount, reason, sourceX, sourceY) {
    this.light = Math.max(0, this.light - amount);
    this.player.invulnerable = 1.05;
    const dx = this.player.x - sourceX;
    const dy = this.player.y - sourceY;
    const distance = Math.hypot(dx, dy) || 1;
    this.player.x += dx / distance * 34;
    this.player.y += dy / distance * 34;
    this.clampPlayer();
    this.emit("player-hit", { amount, reason, x: this.player.x, y: this.player.y });
    if (this.light <= 0) this.finish(false, "light-expired");
  }

  destroyEnemy(index) {
    const enemy = this.enemies[index];
    if (!enemy) return;
    this.enemies.splice(index, 1);
    const multiplier = riskMultiplier(this.light, this.config.maxLight);
    this.score += Math.round(enemy.score * multiplier);
    this.kills += enemy.type === "eclipse" ? 0 : 1;
    this.emit("destroy", { x: enemy.x, y: enemy.y, enemyType: enemy.type, radius: enemy.radius });

    if (enemy.type === "eclipse") {
      this.finish(true, "eclipse-broken");
      return;
    }

    const fragmentCount = enemy.fragments;
    for (let i = 0; i < fragmentCount; i += 1) {
      const angle = this.random() * Math.PI * 2;
      const speed = 24 + this.random() * 45;
      this.fragments.push({
        id: this.nextId++,
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        value: enemy.type === "shard" ? 2.2 : 3.1,
        life: 9,
      });
    }

    if (enemy.type === "splitter") {
      for (let i = 0; i < 2; i += 1) {
        const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x) + (i ? 0.62 : -0.62);
        this.spawnEnemy("shard", {
          x: enemy.x + Math.cos(angle) * 8,
          y: enemy.y + Math.sin(angle) * 8,
          speed: ENEMY_BLUEPRINTS.shard.speed,
        });
      }
    }
  }

  updateFragments(dt) {
    for (let index = this.fragments.length - 1; index >= 0; index -= 1) {
      const fragment = this.fragments[index];
      fragment.life -= dt;
      fragment.vx *= Math.pow(0.18, dt);
      fragment.vy *= Math.pow(0.18, dt);
      fragment.x += fragment.vx * dt;
      fragment.y += fragment.vy * dt;
      const dx = this.player.x - fragment.x;
      const dy = this.player.y - fragment.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance < 105) {
        const pull = 520 * (1 - distance / 105) + 80;
        fragment.x += dx / distance * pull * dt;
        fragment.y += dy / distance * pull * dt;
      }
      if (distance < this.player.radius + 8) {
        this.light = clamp(this.light + fragment.value, 0, this.config.maxLight);
        this.fragments.splice(index, 1);
        this.emit("collect", { x: fragment.x, y: fragment.y, value: fragment.value });
      } else if (fragment.life <= 0) {
        this.fragments.splice(index, 1);
      }
    }
  }

  finish(victory, reason) {
    if (this.state === "ended") return;
    this.state = "ended";
    this.endReason = reason;
    this.emit("end", { victory, reason, score: this.score });
  }

  snapshot() {
    return {
      version: STARFALL_VERSION,
      state: this.state,
      seed: this.seed,
      width: this.width,
      height: this.height,
      elapsed: this.elapsed,
      remaining: Math.max(0, this.config.runDuration - this.elapsed),
      phase: phaseForTime(this.elapsed, this.config),
      score: this.score,
      kills: this.kills,
      shots: this.shots,
      hits: this.hits,
      accuracy: this.shots ? this.hits / this.shots : 0,
      light: this.light,
      maxLight: this.config.maxLight,
      risk: riskMultiplier(this.light, this.config.maxLight),
      flareCooldown: this.flareCooldown,
      endReason: this.endReason,
      eclipseSpawned: this.eclipseSpawned,
      player: { ...this.player },
      bullets: this.bullets.map((item) => ({ ...item })),
      enemies: this.enemies.map((item) => ({ ...item })),
      fragments: this.fragments.map((item) => ({ ...item })),
    };
  }
}

export const __test = Object.freeze({ clamp, segmentCircleHit, mulberry32 });
