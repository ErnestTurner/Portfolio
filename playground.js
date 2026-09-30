(() => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    frame = $("game-frame");
  let current = "moon";
  const order = ["moon", "star", "dungeon", "brain", "scribble", "traffic"];
  const games = {
    moon: {
      url: "games/moon-snail/index.html",
      title: "Moon Snail",
      tag: "SPECIMEN 001 · INGREDIENT COLLISION TEST",
      mission: "Feed the moon.",
      question: "Can an umbrella, snail, moon, soap bubble, and marshmallow become one playable system?",
      procedure: "Catch attackers in soap bubbles. Feed 30 to the moon.",
      watch: "Pursuit, slime, soap, bubbles, and lunar gravity pushing on the same loop.",
      controls:
        "<p><kbd>WASD</kbd> / <kbd>↑↓←→</kbd> Slide</p><p><kbd>Space</kbd> Catch · release to refill</p><p><kbd>P</kbd> Pause <kbd>I</kbd> Inspect</p>",
    },
    star: {
      url: "games/starfall/index.html",
      title: "Starfall",
      tag: "SPECIMEN 002 · SURVIVAL PRESSURE TEST",
      mission: "Outlast the swarm.",
      question: "How long can one movement-and-aim loop stay tense?",
      procedure: "Move, aim, and fire. Keep clearing drones as the swarm accelerates.",
      watch: "Open space disappearing as pursuers accumulate around one ship.",
      controls:
        "<p><kbd>WASD</kbd> / <kbd>↑↓←→</kbd> Move</p><p><kbd>Mouse</kbd> Aim <kbd>Click</kbd> Fire</p>",
    },
    dungeon: {
      url: "games/dungeon-reset/index.html",
      fileUrl: "https://trikzik.com/games/dungeon-reset/",
      title: "Dungeon Reset",
      tag: "SPECIMEN 003 · MAINTENANCE LOOP TEST",
      mission: "Clean up after the heroes.",
      question: "Can maintenance become the adventure instead of the aftermath?",
      procedure: "Return monsters, reset traps, repair the room, then release the next party.",
      watch: "Every unfinished task becoming an advantage for the heroes who follow.",
      controls:
        "<p><kbd>Drag</kbd> Return monsters</p><p><kbd>Hold</kbd> Repair and refill</p><p><kbd>Esc</kbd> Pause <kbd>M</kbd> Sound</p>",
    },
    brain: {
      url: "games/brain-in-a-jar/index.html",
      title: "Brain in a Jar",
      tag: "SPECIMEN 004 · NEURAL CONTROL TEST",
      mission: "Change a wire. Change a mind.",
      question: "How much behavior can emerge from a 4→4→2 neural network?",
      procedure: "Move the light. Select one connection. Change its weight.",
      watch: "A small wiring change producing a different decision in the same creature.",
      controls:
        "<p><kbd>Click / drag</kbd> Move light</p><p><kbd>Slider</kbd> Change selected wire</p><p><kbd>Pause</kbd> then <kbd>Step</kbd> Inspect a tick</p>",
    },
    scribble: {
      url: "games/scribble-engine/index.html",
      title: "Scribble Engine",
      tag: "SPECIMEN 005 · KINETIC DRAWING TEST",
      mission: "Make rotation draw.",
      question: "What drawings emerge when two rotations share one pen?",
      procedure: "Change each arm’s length, speed, and direction. Let the pen run.",
      watch: "Simple ratios closing into forms while mismatched motion keeps drifting.",
      controls:
        "<p><kbd>Sliders</kbd> Change arm length and speed</p><p><kbd>Direction</kbd> Reverse either arm</p><p><kbd>Pause</kbd> <kbd>Clear</kbd> <kbd>Reset</kbd></p>",
    },
    traffic: {
      url: "games/traffic-with-no-excuse/index.html",
      title: "Traffic With No Excuse",
      tag: "SPECIMEN 006 · EMERGENT TRAFFIC TEST",
      mission: "Start a jam. Remove the reason.",
      question: "Can a traffic jam survive after its cause disappears?",
      procedure: "Brake one car for two seconds. Then leave every driver alone.",
      watch: "The slowdown traveling backward while every car continues moving forward.",
      controls:
        "<p><kbd>Tap a car</kbd> Brake for two seconds</p><p><kbd>Sliders</kbd> Change every driver</p><p><kbd>Pause</kbd> <kbd>Restart Flow</kbd> <kbd>Reset</kbd></p>",
    },
  };
  function choose(name) {
    if (!games[name]) return;
    const g = games[name],
      url = location.protocol === "file:" && g.fileUrl ? g.fileUrl : g.url;
    if (current !== name) {
      frame.src = url;
      current = name;
    }
    document.querySelectorAll("[data-game]").forEach((b) => {
      const active = b.dataset.game === name;
      b.classList.toggle("selected", active);
      b.setAttribute("aria-selected", String(active));
      b.tabIndex = active ? 0 : -1;
    });
    const panel = $("game-panel");
    panel.setAttribute("aria-labelledby", name + "-tab");
    panel.classList.toggle("dungeon-active", name === "dungeon");
    frame.title = g.title + " interactive specimen";
    $("game-title").textContent = g.mission;
    $("game-tag").textContent = g.tag;
    $("specimen-question").textContent = g.question;
    $("specimen-procedure").textContent = g.procedure;
    $("specimen-watch").textContent = g.watch;
    $("control-notes").innerHTML = g.controls;
    $("full-game").href = url;
    $("screen-name").textContent =
      "SPECIMEN " + String(order.indexOf(name) + 1).padStart(3, "0") + " / " + g.title.toUpperCase();
    $("inspector-guide").hidden = name !== "moon";
  }
  document.querySelectorAll("[data-game]").forEach((b) => {
    b.onclick = (e) => {
      e.preventDefault();
      choose(b.dataset.game);
    };
    b.onkeydown = (e) => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        const index = order.indexOf(current);
        const target =
          e.key === "Home"
            ? order[0]
            : e.key === "End"
              ? order.at(-1)
              : e.key === "ArrowRight"
                ? order[(index + 1) % order.length]
                : order[(index - 1 + order.length) % order.length];
        choose(target);
        $(target + "-tab").focus();
      }
    };
  });
  document
    .querySelectorAll("[data-select]")
    .forEach(
      (a) =>
        (a.onclick = (e) => {
          e.preventDefault();
          choose(a.dataset.select);
        }),
    );
  const habitat = $("habitat"),
    snail = $("snail"),
    reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let x = 100,
    y = 140,
    tx = 100,
    ty = 140,
    prev = 0,
    lastTrail = 0,
    boops = 0;
  function target(e) {
    const r = habitat.getBoundingClientRect();
    tx = Math.max(12, Math.min(r.width - 125, e.clientX - r.left - 55));
    ty = Math.max(55, Math.min(r.height - 110, e.clientY - r.top - 40));
    if (reduced) {
      x = tx;
      y = ty;
      snail.style.transform = `translate(${x}px,${y}px)`;
    }
  }
  habitat.addEventListener("pointermove", target);
  habitat.addEventListener("pointerdown", (e) => {
    if (e.target.closest("#snail")) return;
    target(e);
  });
  snail.onclick = () => {
    boops++;
    $("reaction").textContent = [
      "Boop accepted. Dignity intact.",
      "An excellent use of your time.",
      "You have a very small friend now.",
      "The moon would like a turn.",
    ][Math.min(boops - 1, 3)];
    snail.classList.remove("boop");
    void snail.offsetWidth;
    snail.classList.add("boop");
  };
  function animate(t) {
    const dt = Math.min((t - prev) / 1000 || 0.016, 0.05);
    prev = t;
    const dx = tx - x,
      dy = ty - y;
    if (Math.hypot(dx, dy) > 0.7) {
      x += dx * dt * 3;
      y += dy * dt * 3;
      snail.style.transform = `translate(${x}px,${y}px)`;
      if (t - lastTrail > 90) {
        lastTrail = t;
        const dot = document.createElement("i");
        dot.style.left = x + 28 + "px";
        dot.style.top = y + 65 + "px";
        $("slime").append(dot);
        setTimeout(() => dot.remove(), 2100);
      }
    }
    requestAnimationFrame(animate);
  }
  if (!reduced) requestAnimationFrame(animate);
})();
