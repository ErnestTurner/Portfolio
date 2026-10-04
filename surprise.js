const experiments = {
  moon: {
    name: "Moon Snail",
    route: "games/moon-snail/index.html",
    summary: "Slide, leave slowing slime, catch marshmallows with an umbrella, and send them moonward in bubbles.",
    label: "Sketch of a snail catching a marshmallow beneath an umbrella while a bubble rises toward the moon",
    art: `<svg viewBox="0 0 260 170" aria-hidden="true">
      <circle class="moon-orb" cx="211" cy="32" r="17" />
      <path class="moon-tide" d="M28 127c46-13 82 21 132 3s61 3 77 13" />
      <path class="snail-trail" d="M31 137c27-20 45 13 76-4" />
      <g class="snail-body"><path d="M56 118c0-10 13-14 24-8 9 5 24 0 31 12-3 10-18 11-34 10-13 0-21-4-21-14z"/><circle cx="77" cy="108" r="14"/><path d="M76 115c-13-1-10-18 1-14 8 3 4 14-2 10-4-2 0-6 3-3"/><path d="M105 117l4-14m-2 14 10-11"/></g>
      <g class="umbrella"><path d="M65 83q27-29 54 0z"/><path d="M92 83v31q0 10 8 7"/></g>
      <circle class="marshmallow" cx="128" cy="109" r="8" />
      <g class="bubble"><circle cx="145" cy="91" r="12"/><circle cx="145" cy="91" r="4"/></g>
    </svg>`,
  },
  star: {
    name: "Starfall: Last Light",
    route: "games/starfall/index.html",
    summary: "Move and fire, spend the same light that keeps you alive, then recover fragments before the eclipse closes in.",
    label: "Sketch of a ship firing at drones while a light fragment returns to its shared reserve",
    art: `<svg viewBox="0 0 260 170" aria-hidden="true">
      <path class="eclipse" d="M0 16h260v138H0z"/>
      <g class="star-ship"><path d="M52 82l35-18-10 18 10 18z"/><circle cx="69" cy="82" r="5"/></g>
      <path class="star-shot" d="M88 82h62" />
      <g class="star-drone"><circle cx="172" cy="82" r="14"/><path d="M158 82h-13m41 0h13M172 68V56m0 40v12"/></g>
      <path class="light-fragment" d="M170 48l6 9 10 2-8 7 1 10-9-5-9 5 2-10-8-7 10-2z" />
      <rect class="light-meter" x="32" y="139" width="196" height="10" rx="5"/><rect class="light-level" x="32" y="139" width="142" height="10" rx="5"/>
    </svg>`,
  },
  dungeon: {
    name: "Dungeon Reset",
    route: "games/dungeon-reset/index.html",
    summary: "Return the staff, reset traps, repair the door, restock treasure, and clean up before the next hero party arrives.",
    label: "Sketch of a dungeon caretaker returning a monster and repairing a door before heroes arrive",
    art: `<svg viewBox="0 0 260 170" aria-hidden="true">
      <path class="dungeon-floor" d="M18 137h224M27 117h206" />
      <g class="dungeon-door"><path d="M180 42h48v75h-48z"/><path d="M190 117V62q14-20 28 0v55"/><circle cx="213" cy="91" r="3"/></g>
      <g class="caretaker"><circle cx="86" cy="74" r="10"/><path d="M86 84v31m0-23-18 15m18-15 18 12m-18 11-14 20m14-20 16 20"/><path d="M103 103l25-13"/></g>
      <g class="dungeon-monster"><path d="M35 112q8-28 32 0v18H35z"/><circle cx="46" cy="111" r="3"/><circle cx="58" cy="111" r="3"/></g>
      <g class="hero-party"><path d="M239 79h-22m11-11v22"/><path d="M245 99h-17"/></g>
      <path class="repair-spark" d="M170 73l-8-8m8 8-10 2m10-2-4 10" />
    </svg>`,
  },
  brain: {
    name: "Brain in a Jar",
    route: "games/brain-in-a-jar/index.html",
    summary: "Move the light, swap the creature’s eyes, or edit one real connection in its hand-wired neural controller.",
    label: "Sketch of a creature sensing a moving light while signals travel through a small wired network",
    art: `<svg viewBox="0 0 260 170" aria-hidden="true">
      <circle class="brain-light" cx="42" cy="46" r="13" />
      <path class="sensor-ray" d="M54 51l63 34M54 41l65 30" />
      <g class="brain-creature"><ellipse cx="123" cy="98" rx="22" ry="16"/><circle cx="115" cy="92" r="4"/><circle cx="131" cy="92" r="4"/><path d="M109 110l-10 15m38-15 10 15"/></g>
      <g class="network-wire"><path d="M160 57l34 20-34 22 34 22M194 77l30-20m-30 20 30 22m-30 22 30-22"/></g>
      <g class="network-node"><circle cx="160" cy="57" r="6"/><circle cx="160" cy="99" r="6"/><circle cx="194" cy="77" r="6"/><circle cx="194" cy="121" r="6"/><circle cx="224" cy="57" r="6"/><circle cx="224" cy="99" r="6"/></g>
      <circle class="brain-signal" cx="160" cy="57" r="4" />
    </svg>`,
  },
  scribble: {
    name: "Scribble Engine",
    route: "games/scribble-engine/index.html",
    summary: "Two rotating arms share one pen. Change their lengths, speeds, and directions to alter the drawing.",
    label: "Sketch of two rotating arms moving one pen along a looping drawn path",
    art: `<svg viewBox="0 0 260 170" aria-hidden="true">
      <path class="scribble-paper" d="M21 21h218v128H21z" />
      <path class="scribble-trace" d="M49 104c26-70 55 58 83-16s52 63 80-13c-7 58-50 66-81 28s-54 35-82 1z" />
      <g class="arm-one"><circle cx="78" cy="83" r="7"/><path d="M78 83l54 19"/></g>
      <g class="arm-two"><circle cx="182" cy="63" r="7"/><path d="M182 63l-50 39"/></g>
      <circle class="shared-pen" cx="132" cy="102" r="6" />
    </svg>`,
  },
  traffic: {
    name: "Traffic With No Excuse",
    route: "games/traffic-with-no-excuse/index.html",
    summary: "Brake one identical driver on an obstacle-free ring, remove the cause, and watch the slowdown keep traveling.",
    label: "Sketch of identical cars circling a clear road while a compact braking wave moves backward",
    art: `<svg viewBox="0 0 260 170" aria-hidden="true">
      <ellipse class="traffic-road" cx="130" cy="85" rx="94" ry="57" />
      <ellipse class="traffic-island" cx="130" cy="85" rx="60" ry="28" />
      <g class="traffic-cars"><rect x="126" y="22" width="16" height="8" rx="3"/><rect x="187" y="42" width="16" height="8" rx="3"/><rect x="211" y="82" width="16" height="8" rx="3"/><rect x="181" y="124" width="16" height="8" rx="3"/><rect x="118" y="139" width="16" height="8" rx="3"/><rect x="55" y="121" width="16" height="8" rx="3"/><rect x="34" y="78" width="16" height="8" rx="3"/><rect x="66" y="37" width="16" height="8" rx="3"/></g>
      <path class="brake-wave" d="M50 106q26 28 65 31" />
      <circle class="brake-light" cx="63" cy="123" r="5" />
    </svg>`,
  },
  jelly: {
    name: "Jelly Bench",
    route: "games/jelly-bench/index.html",
    summary: "Tune stiffness, damping, pressure, and rest length, then see whether one soft body can squeeze through the gap.",
    label: "Sketch of a soft jelly blob deforming as it squeezes through a narrow platform gap",
    art: `<svg viewBox="0 0 260 170" aria-hidden="true">
      <path class="jelly-platform" d="M19 69h85v18H19zm137 0h85v18h-85zM19 138h222" />
      <path class="jelly-blob" d="M77 44c24-17 58-9 71 13 11 18 1 27 17 43 11 11 4 31-17 38-25 8-67 1-79-23-9-18 8-31-1-45-7-11-3-19 9-26z" />
      <g class="jelly-nodes"><circle cx="90" cy="59" r="3"/><circle cx="124" cy="54" r="3"/><circle cx="145" cy="78" r="3"/><circle cx="144" cy="112" r="3"/><circle cx="109" cy="130" r="3"/><circle cx="79" cy="106" r="3"/></g>
    </svg>`,
  },
  mirror: {
    name: "Mirror Mischief",
    route: "games/mirror-mischief/index.html",
    summary: "Move or rotate mirrors, splitters, blockers, and receivers; one small adjustment changes everything downstream.",
    label: "Sketch of a light beam reflecting from a rotating mirror toward a receiver",
    art: `<svg viewBox="0 0 260 170" aria-hidden="true">
      <g class="light-source"><circle cx="35" cy="88" r="13"/><path d="M35 66V55m0 66v-11M13 88H2m66 0H57"/></g>
      <path class="beam beam-one" d="M49 88h75" />
      <g class="preview-mirror"><rect x="119" y="54" width="10" height="68" rx="4"/></g>
      <path class="beam beam-two" d="M126 88l78-44" />
      <path class="beam beam-three" d="M126 88l78 44" />
      <g class="receiver"><path d="M203 28h35v32h-35z"/><circle cx="220" cy="44" r="8"/></g>
      <g class="blocker"><path d="M207 116h27v31h-27z"/><path d="M211 122l19 19m0-19-19 19"/></g>
    </svg>`,
  },
};

const experimentList = Object.values(experiments);
const surpriseButton = document.querySelector("#surprise-experiment");
const preview = document.querySelector("#bench-preview");
const previewTitle = document.querySelector("#preview-title");
const previewSummary = document.querySelector("#preview-summary");
const previewArt = document.querySelector("#preview-art");
const previewOpen = document.querySelector("#preview-open");
const previewClose = document.querySelector("#preview-close");
const markers = [...document.querySelectorAll("[data-experiment]")];
let lastMarker = null;
let previewInView = true;

function setPreviewPaused(paused) {
  preview?.classList.toggle("preview-paused", paused);
}

function selectExperiment(key) {
  const experiment = experiments[key];
  if (!experiment || !preview) return;

  markers.forEach(marker => marker.setAttribute("aria-pressed", String(marker.dataset.experiment === key)));
  lastMarker = document.querySelector(`[data-experiment="${key}"]`);
  preview.dataset.experiment = key;
  previewTitle.textContent = experiment.name;
  previewSummary.textContent = experiment.summary;
  previewArt.className = `preview-art preview-${key}`;
  previewArt.setAttribute("aria-label", experiment.label);
  previewArt.innerHTML = experiment.art;
  previewOpen.href = experiment.route;
  previewOpen.hidden = false;
  previewClose.hidden = false;
}

function closePreview({ restoreFocus = false } = {}) {
  markers.forEach(marker => marker.setAttribute("aria-pressed", "false"));
  delete preview.dataset.experiment;
  previewTitle.textContent = "Pick a numbered specimen";
  previewSummary.textContent = "Select a marker around Earth to wake one small machine.";
  previewArt.className = "preview-art preview-idle";
  previewArt.setAttribute("aria-label", "A quiet laboratory preview screen");
  previewArt.innerHTML = `<svg viewBox="0 0 260 170" aria-hidden="true"><path class="idle-orbit" d="M43 101c35-67 137-78 176-15s-31 84-83 69-76-67-34-103"/><circle class="idle-dot" cx="130" cy="85" r="9"/><path class="idle-bench" d="M55 139h150M83 139l-10 20m104-20 10 20M64 159h132"/></svg>`;
  previewOpen.hidden = true;
  previewClose.hidden = true;
  if (restoreFocus) lastMarker?.focus();
}

markers.forEach(marker => marker.addEventListener("click", () => selectExperiment(marker.dataset.experiment)));
previewClose?.addEventListener("click", () => closePreview({ restoreFocus: true }));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && preview?.dataset.experiment) closePreview({ restoreFocus: true });
});

if (preview && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    previewInView = Boolean(entries[0]?.isIntersecting);
    setPreviewPaused(!previewInView || document.hidden);
  }, { threshold: 0.08 });
  observer.observe(preview);
}
document.addEventListener("visibilitychange", () => setPreviewPaused(document.hidden || !previewInView));

surpriseButton?.addEventListener("click", () => {
  const destination = experimentList[Math.floor(Math.random() * experimentList.length)].route;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  surpriseButton.disabled = true;
  surpriseButton.setAttribute("aria-busy", "true");
  surpriseButton.classList.add("launched");
  window.setTimeout(() => window.location.assign(destination), reduceMotion ? 0 : 550);
});
