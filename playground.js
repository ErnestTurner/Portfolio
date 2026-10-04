(() => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    frame = $("game-frame");
  let current = "moon",
    benchCurrent = "brain";
  const order = ["moon", "star", "dungeon", "brain", "scribble", "traffic", "jelly", "mirror"];
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
      mission: "Spend the last light carefully.",
      question: "Can one reserve power survival, weapons, and panic at the same time?",
      procedure: "Fire and flare with the same light keeping you alive. Break drones, recover fragments, survive the eclipse.",
      watch: "Low light raising the score multiplier while the ship slows and the dark gets ideas.",
      controls:
        "<p class=\"desktop-only\"><kbd>WASD</kbd> / <kbd>↑↓←→</kbd> Move</p><p class=\"desktop-only\"><kbd>Mouse</kbd> Aim and fire · <kbd>Space</kbd> Flare</p><p class=\"touch-only\">Drag the left side to move</p><p class=\"touch-only\">Hold the right side to aim and fire · tap <kbd>Flare</kbd></p>",
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
      procedure: "Change the arms, preview the clean result, then export it. Clear is recoverable if regret arrives quickly.",
      watch: "Simple ratios closing into forms while the preview keeps the apparatus out of the artwork.",
      controls:
        "<p><kbd>Sliders</kbd> Change arm length and speed</p><p><kbd>Preview</kbd> Export PNG or SVG</p><p><kbd>Clear</kbd> then <kbd>Restore Clear</kbd> if necessary</p>",
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
    jelly: {
      url: "games/jelly-bench/index.html",
      title: "Jelly Bench",
      tag: "SPECIMEN 007 · SOFT-BODY PROPERTY TEST",
      mission: "Change the body. Test the gap.",
      question: "Can the same soft body squeeze through a gap, then become unable to get back?",
      procedure: "Drag the blob through the gap. Change stiffness, damping, pressure, or rest length.",
      watch: "The same obstacle becoming passable or impossible as the body’s properties change.",
      controls:
        "<p><kbd>Drag</kbd> Pull the blob</p><p><kbd>Sliders</kbd> Change its properties</p><p><kbd>Presets</kbd> Compare behaviors</p>",
    },
    mirror: {
      url: "games/mirror-mischief/index.html",
      title: "Mirror Mischief",
      tag: "SPECIMEN 008 · DOWNSTREAM OPTICS TEST",
      mission: "Move one thing. Rewrite the light.",
      question: "How much can one local optical change alter everything downstream?",
      procedure: "Drag or rotate a piece. Add mirrors, splitters, blockers, or receivers.",
      watch: "One adjustment redirecting, splitting, blocking, or extinguishing every later beam.",
      controls:
        "<p><kbd>Drag</kbd> Move a piece</p><p><kbd>Slider</kbd> Rotate selected optics</p><p><kbd>Add Piece</kbd> Extend the tabletop</p>",
    },
  };
  const benchDetails = {
    moon: {
      symbol: "MOON",
      summary: "Catch marshmallows in soap bubbles, then feed them to a moon with its own gravity.",
    },
    star: {
      symbol: "LIGHT",
      summary: "Spend the same dwindling light on movement, weapons, survival, and one last flare.",
    },
    dungeon: {
      symbol: "RESET",
      summary: "Restore monsters, traps, and rooms before the next hero party finds every shortcut.",
    },
    brain: {
      symbol: "4×4×2",
      summary: "Change one neural connection and watch a tiny creature decide differently.",
    },
    scribble: {
      symbol: "DRAW",
      summary: "Tune two rotating arms, let their shared pen draw, then export the result.",
    },
    traffic: {
      symbol: "24 CARS",
      summary: "Brake one car for two seconds and watch the traffic jam outlive its cause.",
    },
    jelly: {
      symbol: "SOFT",
      summary: "Change a soft body's properties and test whether it can still squeeze through the gap.",
    },
    mirror: {
      symbol: "LIGHT",
      summary: "Move one optical piece and rewrite every beam, split, block, and receiver downstream.",
    },
  };
  function updateWorkbench(name) {
    if (!games[name]) return;
    const game = games[name],
      detail = benchDetails[name],
      index = order.indexOf(name),
      url = location.protocol === "file:" && game.fileUrl ? game.fileUrl : game.url,
      sketch = $("bench-sketch"),
      signal = $("signal-line");
    benchCurrent = name;
    $("bench-number").textContent = String(index + 1).padStart(2, "0") + " / 08";
    $("bench-title").textContent = game.title;
    $("bench-summary").textContent = detail.summary;
    $("bench-symbol").textContent = detail.symbol;
    $("bench-open").href = url;
    $("active-marker-label").textContent = game.title;
    $("globe-surface").style.transform = `rotate(${(3 - index) * 17}deg)`;
    sketch.className = "specimen-sketch art-" + name;
    sketch.classList.add("changing");
    void sketch.offsetWidth;
    sketch.classList.remove("changing");
    document.querySelectorAll("[data-bench-game]").forEach((button) => {
      const active = button.dataset.benchGame === name;
      button.classList.toggle("selected", active);
      button.setAttribute("aria-pressed", String(active));
    });
    signal.classList.remove("transmitting");
    void signal.offsetWidth;
    signal.classList.add("transmitting");
  }
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
    updateWorkbench(name);
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
  document.querySelectorAll("[data-bench-game]").forEach((button) => {
    button.addEventListener("click", () => choose(button.dataset.benchGame));
  });
  document.querySelectorAll(".globe-marker").forEach((button) => {
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const index = order.indexOf(button.dataset.benchGame),
        name =
          event.key === "Home"
            ? order[0]
            : event.key === "End"
              ? order.at(-1)
              : event.key === "ArrowRight"
                ? order[(index + 1) % order.length]
                : order[(index - 1 + order.length) % order.length];
      choose(name);
      document.querySelector(`.globe-marker[data-bench-game="${name}"]`).focus();
    });
  });
  function stepBench(direction) {
    const index = order.indexOf(benchCurrent),
      name = order[(index + direction + order.length) % order.length];
    choose(name);
  }
  $("previous-specimen").addEventListener("click", () => stepBench(-1));
  $("next-specimen").addEventListener("click", () => stepBench(1));
  $("surprise-specimen").addEventListener("click", (event) => {
    const button = event.currentTarget;
    button.classList.remove("launched");
    void button.offsetWidth;
    button.classList.add("launched");
    stepBench(3);
  });
  if (matchMedia("(max-width: 760px)").matches) $("clipboard-list").closest("details").open = false;
  updateWorkbench("brain");
})();
