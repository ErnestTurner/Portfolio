(() => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    frame = $("game-frame");
  let current = "moon";
  const order = ["moon", "star", "dungeon", "brain", "scribble", "traffic"];
  const games = {
    moon: {
      url: "games/moon-snail/",
      title: "Moon Snail",
      tag: "FIVE-INGREDIENT ARCADE",
      mission: "Feed the moon.",
      description:
        "You're a snail with an umbrella. Trap hostile marshmallows in soap bubbles and let gravity carry them home. Deliver 30 through three phases.",
      controls:
        "<p><kbd>WASD</kbd> / <kbd>↑↓←→</kbd> Slide</p><p><kbd>Space</kbd> Catch · release to refill</p><p><kbd>P</kbd> Pause <kbd>I</kbd> Inspect</p>",
    },
    star: {
      url: "games/starfall/",
      title: "Starfall",
      tag: "SURVIVAL EXPERIMENT",
      mission: "Outlast the swarm.",
      description:
        "Move your ship, aim with your mouse, and click to fire. Clear pursuing drones to build your score. Best played with a keyboard and mouse.",
      controls:
        "<p><kbd>WASD</kbd> / <kbd>↑↓←→</kbd> Move</p><p><kbd>Mouse</kbd> Aim <kbd>Click</kbd> Fire</p>",
    },
    dungeon: {
      url: "games/dungeon-reset/",
      title: "Dungeon Reset",
      tag: "DUNGEON MAINTENANCE",
      mission: "Clean up after the heroes.",
      description:
        "Return the monsters, reset the traps, repair the room, and watch five increasingly capable parties discover exactly what you left unfinished.",
      controls:
        "<p><kbd>Drag</kbd> Return monsters</p><p><kbd>Hold</kbd> Repair and refill</p><p><kbd>Esc</kbd> Pause <kbd>M</kbd> Sound</p>",
    },
    brain: {
      url: "games/brain-in-a-jar/",
      title: "Brain in a Jar",
      tag: "NEURAL TINKERING TOY",
      mission: "Change a wire. Change a mind.",
      description: "Tinker with a tiny creature’s neural wiring.",
      controls:
        "<p><kbd>Click / drag</kbd> Move light</p><p><kbd>Slider</kbd> Change selected wire</p><p><kbd>Pause</kbd> then <kbd>Step</kbd> Inspect a tick</p>",
    },
    scribble: {
      url: "games/scribble-engine/",
      title: "Scribble Engine",
      tag: "KINETIC DRAWING EXPERIMENT",
      mission: "Make rotation draw.",
      description:
        "Adjust the lengths, speeds, and directions of two independently rotating arms, then watch their pen trace the result.",
      controls:
        "<p><kbd>Sliders</kbd> Change arm length and speed</p><p><kbd>Direction</kbd> Reverse either arm</p><p><kbd>Pause</kbd> <kbd>Clear</kbd> <kbd>Reset</kbd></p>",
    },
    traffic: {
      url: "games/traffic-with-no-excuse/",
      title: "Traffic With No Excuse",
      tag: "EMERGENT TRAFFIC TOY",
      mission: "Start a jam. Remove the reason.",
      description:
        "Brake one of 24 identical drivers, then change their shared settings to discover when the disturbance fades—and when it becomes a traveling traffic jam.",
      controls:
        "<p><kbd>Tap a car</kbd> Brake for two seconds</p><p><kbd>Sliders</kbd> Change every driver</p><p><kbd>Pause</kbd> <kbd>Restart Flow</kbd> <kbd>Reset</kbd></p>",
    },
  };
  function choose(name) {
    if (!games[name]) return;
    if (current !== name) {
      frame.src = games[name].url;
      current = name;
    }
    const g = games[name];
    document.querySelectorAll("[data-game]").forEach((b) => {
      const active = b.dataset.game === name;
      b.classList.toggle("selected", active);
      b.setAttribute("aria-selected", String(active));
      b.tabIndex = active ? 0 : -1;
    });
    const panel = $("game-panel");
    panel.setAttribute("aria-labelledby", name + "-tab");
    panel.classList.toggle("dungeon-active", name === "dungeon");
    frame.title = g.title + " playable arcade game";
    $("game-title").textContent = g.mission;
    $("game-tag").textContent = g.tag;
    $("game-description").textContent = g.description;
    $("control-notes").innerHTML = g.controls;
    $("full-game").href = g.url;
    $("screen-name").textContent =
      g.title.toUpperCase() + " / " + String(order.indexOf(name) + 1).padStart(2, "0");
    $("inspector-guide").hidden = name !== "moon";
  }
  document.querySelectorAll("[data-game]").forEach((b) => {
    b.onclick = () => choose(b.dataset.game);
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
    .forEach((a) => (a.onclick = () => choose(a.dataset.select)));
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
