import { StarfallSimulation, STARFALL_VERSION } from "./game-core.js";

const elements = {
  canvas: document.querySelector("#game"),
  stage: document.querySelector("#gameStage"),
  overlay: document.querySelector("#overlay"),
  overlayEyebrow: document.querySelector("#overlayEyebrow"),
  overlayTitle: document.querySelector("#overlayTitle"),
  overlayText: document.querySelector("#overlayText"),
  start: document.querySelector("#startButton"),
  pause: document.querySelector("#pauseButton"),
  flare: document.querySelector("#flareButton"),
  flareStatus: document.querySelector("#flareStatus"),
  sound: document.querySelector("#soundButton"),
  score: document.querySelector("#score"),
  best: document.querySelector("#best"),
  lightText: document.querySelector("#lightText"),
  lightFill: document.querySelector("#lightFill"),
  time: document.querySelector("#timeText"),
  risk: document.querySelector("#riskText"),
  phase: document.querySelector("#phaseLabel"),
  objective: document.querySelector("#objectiveText"),
  announcement: document.querySelector("#announcement"),
};

const context = elements.canvas.getContext("2d");
const simulation = new StarfallSimulation();
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarsePointer = matchMedia("(pointer: coarse)");
const keys = new Set();
const pointers = new Map();
const particles = [];
const rings = [];
const stars = [];
let best = readNumber("starfall-best", 0);
let lastFrame = performance.now();
let mouse = { x: simulation.width * 0.75, y: simulation.height / 2, down: false };
let moveTouch = null;
let aimTouch = null;
let shake = 0;
let flash = 0;
let announcementTimer = 0;
let manualTestMode = false;

class SoundEngine {
  constructor() {
    this.context = null;
    this.muted = readNumber("starfall-muted", 0) === 1;
  }

  unlock() {
    if (this.muted) return;
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.context = new AudioContext();
    }
    if (this.context?.state === "suspended") this.context.resume();
  }

  toggle() {
    this.muted = !this.muted;
    writeNumber("starfall-muted", this.muted ? 1 : 0);
    if (!this.muted) this.unlock();
    return this.muted;
  }

  tone(frequency, duration, options = {}) {
    if (this.muted || !this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = options.type || "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    if (options.endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, options.endFrequency), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(options.volume || 0.035, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  shot() { this.tone(310, 0.055, { type: "square", endFrequency: 170, volume: 0.018 }); }
  hit() { this.tone(120, 0.07, { type: "triangle", endFrequency: 68, volume: 0.025 }); }
  collect() { this.tone(660, 0.11, { endFrequency: 920, volume: 0.025 }); }
  hurt() { this.tone(78, 0.25, { type: "sawtooth", endFrequency: 42, volume: 0.05 }); }
  flare() { this.tone(180, 0.42, { endFrequency: 720, volume: 0.045 }); }
  eclipse() { this.tone(54, 0.9, { type: "sawtooth", endFrequency: 31, volume: 0.045 }); }
  victory() { this.tone(330, 0.65, { endFrequency: 990, volume: 0.04 }); }
}

const sound = new SoundEngine();

function readNumber(key, fallback) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function writeNumber(key, value) {
  try { localStorage.setItem(key, String(value)); } catch { /* Storage is optional. */ }
}

function isTouchLayout() {
  return coarsePointer.matches || window.innerWidth <= 720;
}

function configureViewport() {
  const portrait = isTouchLayout();
  const width = portrait ? 540 : 960;
  const height = portrait ? 720 : 540;
  if (simulation.width !== width || simulation.height !== height) simulation.resize(width, height);
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  elements.canvas.width = Math.round(width * pixelRatio);
  elements.canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  buildStars(width, height);
}

function buildStars(width, height) {
  stars.length = 0;
  let seed = width * 7 + height * 13;
  for (let index = 0; index < Math.round(width * height / 6800); index += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const x = (seed / 4294967296) * width;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const y = (seed / 4294967296) * height;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    stars.push({ x, y, size: 0.45 + (seed / 4294967296) * 1.2 });
  }
}

function pointerPosition(event) {
  const rect = elements.canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * simulation.width / rect.width,
    y: (event.clientY - rect.top) * simulation.height / rect.height,
  };
}

function startRun(seed = Date.now()) {
  manualTestMode = false;
  sound.unlock();
  simulation.start(seed);
  particles.length = 0;
  rings.length = 0;
  shake = 0;
  flash = 0;
  clearInput();
  hideOverlay();
  updateHud(simulation.snapshot());
}

function clearInput() {
  keys.clear();
  pointers.clear();
  mouse.down = false;
  moveTouch = null;
  aimTouch = null;
}

function pauseRun(message = "The pressure test is suspended. Your light is holding.") {
  if (simulation.state !== "running") return;
  simulation.pause();
  clearInput();
  showOverlay({
    eyebrow: "PRESSURE TEST SUSPENDED",
    title: "Paused",
    text: message,
    button: "Resume test",
  });
}

function resumeRun() {
  if (simulation.state !== "paused") return;
  sound.unlock();
  simulation.resume();
  hideOverlay();
  lastFrame = performance.now();
}

function showOverlay({ eyebrow, title, text, button }) {
  elements.overlayEyebrow.textContent = eyebrow;
  elements.overlayTitle.textContent = title;
  elements.overlayText.textContent = text;
  elements.start.textContent = button;
  elements.overlay.classList.remove("hidden");
}

function hideOverlay() {
  elements.overlay.classList.add("hidden");
}

function currentInput() {
  let moveX = Number(keys.has("d") || keys.has("arrowright")) - Number(keys.has("a") || keys.has("arrowleft"));
  let moveY = Number(keys.has("s") || keys.has("arrowdown")) - Number(keys.has("w") || keys.has("arrowup"));
  let aimX = mouse.x;
  let aimY = mouse.y;
  let fire = mouse.down;

  if (moveTouch) {
    const dx = moveTouch.current.x - moveTouch.origin.x;
    const dy = moveTouch.current.y - moveTouch.origin.y;
    const length = Math.hypot(dx, dy);
    const limit = 74;
    moveX = length ? dx / Math.max(length, limit) : 0;
    moveY = length ? dy / Math.max(length, limit) : 0;
  }

  if (aimTouch) {
    aimX = aimTouch.current.x;
    aimY = aimTouch.current.y;
    fire = true;
  }

  return { moveX, moveY, aimX, aimY, fire };
}

function formatScore(value) {
  return String(Math.max(0, Math.round(value))).padStart(6, "0");
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function updateHud(snapshot) {
  elements.score.textContent = formatScore(snapshot.score);
  elements.best.textContent = formatScore(best);
  const percent = Math.round(snapshot.light / snapshot.maxLight * 100);
  elements.lightText.textContent = `${percent}%`;
  elements.lightFill.style.width = `${percent}%`;
  elements.lightFill.classList.toggle("warning", percent <= 45 && percent > 20);
  elements.lightFill.classList.toggle("critical", percent <= 20);
  elements.time.textContent = formatTime(snapshot.remaining);
  elements.risk.textContent = `×${snapshot.risk.toFixed(1)}`;
  elements.phase.textContent = snapshot.state === "paused" ? "PAUSED" : snapshot.phase;
  elements.objective.textContent = snapshot.phase === "ECLIPSE" ? "Break the eclipse" : "Protect the light";
  elements.flare.disabled = snapshot.state !== "running" || snapshot.flareCooldown > 0 || snapshot.light < simulation.config.flareCost;
  elements.flareStatus.textContent = snapshot.flareCooldown > 0 ? `${snapshot.flareCooldown.toFixed(1)}s` : snapshot.light < simulation.config.flareCost ? "NO LIGHT" : "READY";
  elements.pause.disabled = !["running", "paused"].includes(snapshot.state);
  elements.pause.textContent = snapshot.state === "paused" ? "▶" : "Ⅱ";
  elements.pause.setAttribute("aria-label", snapshot.state === "paused" ? "Resume game" : "Pause game");
  elements.sound.textContent = sound.muted ? "×" : "♪";
  elements.sound.setAttribute("aria-label", sound.muted ? "Enable sound" : "Mute sound");
}

function announce(text, duration = 2.2) {
  elements.announcement.textContent = text;
  announcementTimer = duration;
}

function handleEvents(events) {
  for (const event of events) {
    if (event.type === "shot") {
      sound.shot();
      addBurst(event.x, event.y, "#eef3f8", 2, 55);
    } else if (event.type === "hit") {
      sound.hit();
      addBurst(event.x, event.y, event.flare ? "#7df2c5" : "#ff6f91", event.flare ? 7 : 4, 95);
      shake = Math.max(shake, event.flare ? 4 : 1.4);
    } else if (event.type === "destroy") {
      addBurst(event.x, event.y, enemyColor(event.enemyType), event.enemyType === "eclipse" ? 60 : 12, event.enemyType === "eclipse" ? 260 : 145);
      rings.push({ x: event.x, y: event.y, radius: event.radius, speed: 90, life: 0.5, color: enemyColor(event.enemyType) });
    } else if (event.type === "collect") {
      sound.collect();
      addBurst(event.x, event.y, "#7df2c5", 5, 80);
    } else if (event.type === "player-hit") {
      sound.hurt();
      shake = reducedMotion ? 0 : 13;
      flash = 0.35;
      addBurst(event.x, event.y, "#ff6f91", 22, 210);
    } else if (event.type === "flare") {
      sound.flare();
      rings.push({ x: event.x, y: event.y, radius: 8, speed: event.radius * 2.7, life: 0.7, color: "#7df2c5" });
      shake = reducedMotion ? 0 : 8;
    } else if (event.type === "eclipse-pulse") {
      sound.eclipse();
    } else if (event.type === "announcement") {
      announce(event.text);
    } else if (event.type === "end") {
      finishRun(event);
    }
  }
}

function finishRun(event) {
  const snapshot = simulation.snapshot();
  best = Math.max(best, snapshot.score);
  writeNumber("starfall-best", best);
  updateHud(snapshot);
  const accuracy = Math.round(snapshot.accuracy * 100);
  if (event.victory) {
    sound.victory();
    showOverlay({
      eyebrow: "PRESSURE TEST COMPLETE · ECLIPSE BROKEN",
      title: "Light survives",
      text: `Score ${formatScore(snapshot.score)} · ${snapshot.kills} drones · ${accuracy}% accuracy · ${Math.round(snapshot.light)}% light remaining.`,
      button: "Run it again",
    });
  } else {
    const reason = event.reason === "eclipse-consumed"
      ? "The eclipse reached critical mass."
      : "The last light went out.";
    showOverlay({
      eyebrow: "PRESSURE TEST FAILED",
      title: event.reason === "eclipse-consumed" ? "Eclipse unbroken" : "Light extinguished",
      text: `${reason} Score ${formatScore(snapshot.score)} · ${snapshot.kills} drones · ${accuracy}% accuracy.`,
      button: "Try again",
    });
  }
}

function addBurst(x, y, color, count, speed) {
  const adjustedCount = reducedMotion ? Math.ceil(count * 0.35) : count;
  for (let index = 0; index < adjustedCount; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = speed * (0.35 + Math.random() * 0.65);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life: 0.25 + Math.random() * 0.45,
      maxLife: 0.7,
      color,
      size: 1.5 + Math.random() * 2.5,
    });
  }
}

function updateEffects(dt) {
  for (let index = particles.length - 1; index >= 0; index -= 1) {
    const particle = particles[index];
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= Math.pow(0.08, dt);
    particle.vy *= Math.pow(0.08, dt);
    particle.life -= dt;
    if (particle.life <= 0) particles.splice(index, 1);
  }
  for (let index = rings.length - 1; index >= 0; index -= 1) {
    const ring = rings[index];
    ring.radius += ring.speed * dt;
    ring.life -= dt;
    if (ring.life <= 0) rings.splice(index, 1);
  }
  shake = Math.max(0, shake - 38 * dt);
  flash = Math.max(0, flash - dt);
  announcementTimer = Math.max(0, announcementTimer - dt);
  if (announcementTimer === 0) elements.announcement.textContent = "";
}

function enemyColor(type) {
  return ({
    hunter: "#ff6f91",
    siphon: "#79a9ff",
    splitter: "#ffc857",
    shard: "#ff9d66",
    eclipse: "#d8c7ff",
  })[type] || "#ff6f91";
}

function draw(snapshot) {
  const width = snapshot.width;
  const height = snapshot.height;
  const lightRatio = snapshot.light / snapshot.maxLight;
  const shakeX = shake ? (Math.random() - 0.5) * shake : 0;
  const shakeY = shake ? (Math.random() - 0.5) * shake : 0;
  context.save();
  context.clearRect(0, 0, width, height);
  context.translate(shakeX, shakeY);

  const background = context.createRadialGradient(
    snapshot.player.x,
    snapshot.player.y,
    10,
    snapshot.player.x,
    snapshot.player.y,
    Math.max(width, height) * 0.82,
  );
  background.addColorStop(0, `rgba(14, 32, 36, ${0.7 + lightRatio * 0.18})`);
  background.addColorStop(0.45, "#080d14");
  background.addColorStop(1, "#030508");
  context.fillStyle = background;
  context.fillRect(-20, -20, width + 40, height + 40);
  drawGrid(width, height, snapshot.elapsed);
  drawStars(snapshot.elapsed, lightRatio);
  snapshot.fragments.forEach(drawFragment);
  drawSiphonBeams(snapshot);
  snapshot.enemies.forEach((enemy) => drawEnemy(enemy, snapshot));
  snapshot.bullets.forEach(drawBullet);
  drawParticles();
  drawRings();
  drawPlayer(snapshot);
  if (isTouchLayout() && snapshot.state === "running") drawTouchGuides();
  drawVignette(width, height, lightRatio);
  context.restore();

  if (flash > 0) {
    context.fillStyle = `rgba(255, 111, 145, ${flash * 0.42})`;
    context.fillRect(0, 0, width, height);
  }
}

function drawGrid(width, height, elapsed) {
  const spacing = isTouchLayout() ? 54 : 48;
  context.strokeStyle = "#ffffff08";
  context.lineWidth = 1;
  context.beginPath();
  const drift = elapsed * 2 % spacing;
  for (let x = -spacing + drift; x < width + spacing; x += spacing) {
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }
  for (let y = -spacing + drift; y < height + spacing; y += spacing) {
    context.moveTo(0, y);
    context.lineTo(width, y);
  }
  context.stroke();
}

function drawStars(elapsed, lightRatio) {
  context.fillStyle = "#cfe5f5";
  for (let index = 0; index < stars.length; index += 1) {
    const star = stars[index];
    context.globalAlpha = (0.15 + lightRatio * 0.36) * (0.75 + Math.sin(elapsed * 1.7 + index) * 0.25);
    context.fillRect(star.x, star.y, star.size, star.size);
  }
  context.globalAlpha = 1;
}

function drawFragment(fragment) {
  const pulse = 1 + Math.sin(fragment.life * 8) * 0.18;
  context.save();
  context.translate(fragment.x, fragment.y);
  context.rotate(fragment.life * 3);
  context.shadowColor = "#7df2c5";
  context.shadowBlur = 13;
  context.fillStyle = "#b8ffe5";
  context.beginPath();
  context.moveTo(0, -5 * pulse);
  context.lineTo(4 * pulse, 0);
  context.lineTo(0, 5 * pulse);
  context.lineTo(-4 * pulse, 0);
  context.closePath();
  context.fill();
  context.restore();
}

function drawSiphonBeams(snapshot) {
  for (const enemy of snapshot.enemies) {
    if (enemy.type !== "siphon") continue;
    const distance = Math.hypot(enemy.x - snapshot.player.x, enemy.y - snapshot.player.y);
    if (distance >= 178) continue;
    context.save();
    context.strokeStyle = `rgba(121, 169, 255, ${0.18 + Math.sin(snapshot.elapsed * 9) * 0.06})`;
    context.setLineDash([4, 8]);
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(enemy.x, enemy.y);
    context.lineTo(snapshot.player.x, snapshot.player.y);
    context.stroke();
    context.restore();
  }
}

function drawEnemy(enemy, snapshot) {
  const color = enemyColor(enemy.type);
  context.save();
  context.translate(enemy.x, enemy.y);
  context.strokeStyle = color;
  context.fillStyle = `${color}18`;
  context.lineWidth = enemy.type === "eclipse" ? 3 : 2;
  context.shadowColor = color;
  context.shadowBlur = enemy.type === "eclipse" ? 20 : 8;

  if (enemy.type === "hunter") {
    context.beginPath();
    context.arc(0, 0, enemy.radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(-enemy.radius * 0.58, -enemy.radius * 0.58);
    context.lineTo(enemy.radius * 0.58, enemy.radius * 0.58);
    context.moveTo(enemy.radius * 0.58, -enemy.radius * 0.58);
    context.lineTo(-enemy.radius * 0.58, enemy.radius * 0.58);
    context.stroke();
  } else if (enemy.type === "siphon") {
    polygon(6, enemy.radius, snapshot.elapsed * 0.7 + enemy.id);
    context.fill();
    context.stroke();
    context.beginPath();
    context.arc(0, 0, enemy.radius * 0.35, 0, Math.PI * 2);
    context.stroke();
  } else if (enemy.type === "splitter") {
    polygon(3, enemy.radius, snapshot.elapsed * 0.45 + enemy.id);
    context.fill();
    context.stroke();
    context.rotate(Math.PI);
    polygon(3, enemy.radius * 0.53, -snapshot.elapsed * 0.8);
    context.stroke();
  } else if (enemy.type === "shard") {
    context.rotate(Math.atan2(snapshot.player.y - enemy.y, snapshot.player.x - enemy.x));
    context.beginPath();
    context.moveTo(enemy.radius * 1.4, 0);
    context.lineTo(-enemy.radius, -enemy.radius * 0.65);
    context.lineTo(-enemy.radius * 0.45, 0);
    context.lineTo(-enemy.radius, enemy.radius * 0.65);
    context.closePath();
    context.fill();
    context.stroke();
  } else if (enemy.type === "eclipse") {
    context.fillStyle = "#030309";
    context.beginPath();
    context.arc(0, 0, enemy.radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.rotate(snapshot.elapsed * 0.12);
    context.setLineDash([8, 13]);
    context.beginPath();
    context.arc(0, 0, enemy.radius + 13, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
    if (enemy.pulseRadius > 0) {
      context.globalAlpha = Math.max(0.12, 1 - enemy.pulseRadius / Math.max(snapshot.width, snapshot.height));
      context.beginPath();
      context.arc(0, 0, enemy.pulseRadius, 0, Math.PI * 2);
      context.stroke();
    }
    context.globalAlpha = 1;
    context.fillStyle = "#ffffff1a";
    context.fillRect(-45, enemy.radius + 18, 90, 4);
    context.fillStyle = color;
    context.fillRect(-45, enemy.radius + 18, 90 * enemy.hp / enemy.maxHp, 4);
  }
  context.restore();
}

function polygon(sides, radius, rotation = 0) {
  context.beginPath();
  for (let index = 0; index < sides; index += 1) {
    const angle = rotation + index / sides * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
}

function drawBullet(bullet) {
  context.save();
  context.strokeStyle = "#f8fffd";
  context.lineWidth = 2.5;
  context.shadowColor = "#7df2c5";
  context.shadowBlur = 9;
  context.beginPath();
  context.moveTo(bullet.x - bullet.vx * 0.018, bullet.y - bullet.vy * 0.018);
  context.lineTo(bullet.x, bullet.y);
  context.stroke();
  context.restore();
}

function drawParticles() {
  for (const particle of particles) {
    context.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    context.fillStyle = particle.color;
    context.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  context.globalAlpha = 1;
}

function drawRings() {
  for (const ring of rings) {
    context.globalAlpha = Math.min(1, ring.life * 2);
    context.strokeStyle = ring.color;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
    context.stroke();
  }
  context.globalAlpha = 1;
}

function drawPlayer(snapshot) {
  const player = snapshot.player;
  const blink = player.invulnerable > 0 && Math.floor(player.invulnerable * 14) % 2 === 0;
  if (blink) return;
  const lightRatio = snapshot.light / snapshot.maxLight;
  context.save();
  context.translate(player.x, player.y);
  context.rotate(player.angle);
  const glow = context.createRadialGradient(0, 0, 4, 0, 0, 68 + lightRatio * 42);
  glow.addColorStop(0, `rgba(125, 242, 197, ${0.32 + lightRatio * 0.2})`);
  glow.addColorStop(1, "rgba(125, 242, 197, 0)");
  context.fillStyle = glow;
  context.beginPath();
  context.arc(0, 0, 110, 0, Math.PI * 2);
  context.fill();

  const moving = keys.has("w") || keys.has("a") || keys.has("s") || keys.has("d") || moveTouch;
  if (moving) {
    context.fillStyle = "#79a9ff";
    context.globalAlpha = 0.65 + Math.random() * 0.25;
    context.beginPath();
    context.moveTo(-8, -4);
    context.lineTo(-18 - Math.random() * 9, 0);
    context.lineTo(-8, 4);
    context.fill();
    context.globalAlpha = 1;
  }

  context.fillStyle = "#7df2c5";
  context.shadowColor = "#7df2c5";
  context.shadowBlur = 13;
  context.beginPath();
  context.moveTo(19, 0);
  context.lineTo(-11, -9);
  context.lineTo(-6, 0);
  context.lineTo(-11, 9);
  context.closePath();
  context.fill();
  context.restore();
}

function drawTouchGuides() {
  context.save();
  context.lineWidth = 2;
  if (moveTouch) {
    context.strokeStyle = "#7df2c566";
    context.beginPath();
    context.arc(moveTouch.origin.x, moveTouch.origin.y, 48, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = "#7df2c533";
    context.beginPath();
    context.arc(moveTouch.current.x, moveTouch.current.y, 18, 0, Math.PI * 2);
    context.fill();
  }
  if (aimTouch) {
    context.strokeStyle = "#ff6f9166";
    context.beginPath();
    context.arc(aimTouch.current.x, aimTouch.current.y, 21, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(aimTouch.current.x - 28, aimTouch.current.y);
    context.lineTo(aimTouch.current.x + 28, aimTouch.current.y);
    context.moveTo(aimTouch.current.x, aimTouch.current.y - 28);
    context.lineTo(aimTouch.current.x, aimTouch.current.y + 28);
    context.stroke();
  }
  context.restore();
}

function drawVignette(width, height, lightRatio) {
  const darkness = 0.1 + (1 - lightRatio) * 0.48;
  const vignette = context.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.18, width / 2, height / 2, Math.max(width, height) * 0.68);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, `rgba(0,0,0,${darkness})`);
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
}

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  if (!manualTestMode && simulation.state === "running") simulation.step(dt, currentInput());
  handleEvents(simulation.consumeEvents());
  updateEffects(dt);
  const snapshot = simulation.snapshot();
  updateHud(snapshot);
  draw(snapshot);
  requestAnimationFrame(frame);
}

elements.start.addEventListener("click", () => {
  if (simulation.state === "paused") resumeRun();
  else startRun();
});

elements.pause.addEventListener("click", () => {
  if (simulation.state === "running") pauseRun();
  else if (simulation.state === "paused") resumeRun();
});

elements.flare.addEventListener("click", () => {
  sound.unlock();
  simulation.triggerFlare();
});

elements.sound.addEventListener("click", () => {
  sound.toggle();
  updateHud(simulation.snapshot());
});

elements.canvas.addEventListener("pointerdown", (event) => {
  if (simulation.state !== "running") return;
  event.preventDefault();
  elements.canvas.setPointerCapture?.(event.pointerId);
  const position = pointerPosition(event);
  pointers.set(event.pointerId, position);
  if (event.pointerType === "touch" || isTouchLayout()) {
    if (position.x < simulation.width * 0.48 && !moveTouch) {
      moveTouch = { id: event.pointerId, origin: position, current: position };
    } else if (!aimTouch) {
      aimTouch = { id: event.pointerId, origin: position, current: position };
    }
  } else {
    mouse = { ...position, down: true };
  }
  sound.unlock();
});

elements.canvas.addEventListener("pointermove", (event) => {
  const position = pointerPosition(event);
  if (event.pointerType !== "touch") {
    mouse.x = position.x;
    mouse.y = position.y;
  }
  if (moveTouch?.id === event.pointerId) moveTouch.current = position;
  if (aimTouch?.id === event.pointerId) aimTouch.current = position;
});

function releasePointer(event) {
  pointers.delete(event.pointerId);
  if (moveTouch?.id === event.pointerId) moveTouch = null;
  if (aimTouch?.id === event.pointerId) aimTouch = null;
  if (event.pointerType !== "touch") mouse.down = false;
}

elements.canvas.addEventListener("pointerup", releasePointer);
elements.canvas.addEventListener("pointercancel", releasePointer);
window.addEventListener("pointerup", (event) => {
  if (event.pointerType !== "touch") mouse.down = false;
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (simulation.state === "running" && ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
    event.preventDefault();
  }
  if (event.repeat && [" ", "p", "escape", "enter"].includes(key)) return;
  if (key === " ") {
    simulation.triggerFlare();
    sound.unlock();
  } else if (key === "p" || key === "escape") {
    if (simulation.state === "running") pauseRun();
    else if (simulation.state === "paused") resumeRun();
  } else if (key === "enter" && simulation.state !== "running") {
    if (simulation.state === "paused") resumeRun();
    else startRun();
  }
  keys.add(key);
});

window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener("blur", () => {
  clearInput();
  if (simulation.state === "running") pauseRun("The window lost focus, so the pressure test paused automatically.");
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && simulation.state === "running") pauseRun("The tab was hidden, so the pressure test paused automatically.");
});
window.addEventListener("resize", configureViewport);
coarsePointer.addEventListener?.("change", configureViewport);

window.__starfallTest = Object.freeze({
  version: STARFALL_VERSION,
  start(seed = 1) {
    manualTestMode = true;
    simulation.start(seed);
    simulation.consumeEvents();
    return simulation.snapshot();
  },
  step(seconds, input = {}) {
    simulation.step(seconds, input);
    handleEvents(simulation.consumeEvents());
    return simulation.snapshot();
  },
  snapshot: () => simulation.snapshot(),
  setLight(value) { simulation.setLight(value); return simulation.snapshot(); },
  spawnEnemy(type, overrides = {}) { return simulation.spawnEnemy(type, overrides); },
  clearEntities() {
    simulation.enemies = [];
    simulation.bullets = [];
    simulation.fragments = [];
    return simulation.snapshot();
  },
  flare() { return simulation.triggerFlare(); },
  resumeRealtime() { manualTestMode = false; lastFrame = performance.now(); },
});

configureViewport();
const localScenario = ["127.0.0.1", "localhost"].includes(location.hostname)
  ? new URLSearchParams(location.search).get("scenario")
  : null;
if (localScenario === "eclipse") {
  manualTestMode = true;
  simulation.start(120);
  simulation.enemies = [];
  simulation.fragments = [];
  simulation.elapsed = simulation.config.eclipseAt;
  simulation.lastPhase = "ECLIPSE";
  simulation.eclipseSpawned = true;
  simulation.setLight(38);
  const eclipse = simulation.spawnEnemy("eclipse", {
    x: simulation.width / 2,
    y: simulation.height * 0.27,
    hp: 31,
  });
  eclipse.pulseRadius = Math.min(simulation.width, simulation.height) * 0.24;
  simulation.consumeEvents();
  hideOverlay();
  announce("ECLIPSE CONTACT", 999);
}
updateHud(simulation.snapshot());
requestAnimationFrame(frame);
