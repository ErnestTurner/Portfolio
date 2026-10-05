const treatments = {
  moon: {
    name: "Moon Snail",
    route: "games/moon-snail/index.html",
    action: "Catch & bubble",
    running: "Umbrella open",
    summary: "Slide, leave slowing slime, catch marshmallows with an umbrella, and send them moonward in bubbles.",
    art: `<g class="treatment-moon">
      <circle class="mini-moon" cx="92" cy="104" r="18" />
      <path class="mini-trail" d="M286 333c25-17 43 12 71-5" />
      <g class="mini-snail"><path d="M306 316c0-9 12-13 22-7 8 4 20 1 27 11-4 9-18 9-30 8-12 0-19-4-19-12z"/><circle cx="324" cy="307" r="12"/><path d="M324 313c-11-1-8-16 1-12 7 3 3 12-2 8"/></g>
      <g class="mini-umbrella"><path d="M301 285q27-29 54 0z"/><path d="M328 285v31"/></g>
      <circle class="mini-marshmallow" cx="377" cy="305" r="8" />
      <g class="mini-bubble"><circle cx="340" cy="286" r="12"/><circle cx="340" cy="286" r="4"/></g>
      <text class="treatment-label" x="62" y="78">MOON DELIVERY</text>
    </g>`,
  },
  star: {
    name: "Starfall: Last Light",
    route: "games/starfall/index.html",
    action: "Fire a flare",
    running: "Light spent · fragment returning",
    summary: "Move and fire, spend the same light that keeps you alive, then recover fragments before the eclipse closes in.",
    art: `<g class="treatment-star">
      <path class="eclipse-veil" d="M220 103C298 103 362 166 362 245C362 324 298 387 220 387C275 344 286 146 220 103Z" />
      <g class="mini-ship"><path d="M330 188l27-14-8 14 8 14z"/><circle cx="343" cy="188" r="4"/></g>
      <circle class="flare-ring" cx="342" cy="187" r="8" />
      <path class="light-fragment" d="M330 149l5 8 9 2-7 6 1 9-8-4-8 4 2-9-7-6 9-2z" />
      <text class="treatment-label" x="82" y="87">LAST LIGHT</text>
    </g>`,
  },
  dungeon: {
    name: "Dungeon Reset",
    route: "games/dungeon-reset/index.html",
    action: "Reset the bench",
    running: "Caretaker at work",
    summary: "Return the staff, reset traps, repair the door, restock treasure, and clean up before the next hero party arrives.",
    art: `<g class="treatment-dungeon">
      <g class="mess-mark"><path d="M144 183l18 18m0-18-18 18"/><path d="M211 289h20v18h-20z"/><path d="M282 190l16 28h-32z"/></g>
      <g class="reset-mark"><path d="M139 176l-7-7m7 7-10 2M207 282l-7-7m7 7-10 2M302 181l7-7m-7 7 10 2"/></g>
      <g class="mini-caretaker"><circle cx="92" cy="335" r="9"/><path d="M92 344v27m0-18-14 11m14-11 16 9m-16 9-11 17m11-17 13 17"/></g>
      <g class="mini-party"><path d="M371 205h-20m10-10v20M381 226h-18"/></g>
      <text class="treatment-label" x="74" y="102">POST-RAID RESET</text>
    </g>`,
  },
  brain: {
    name: "Brain in a Jar",
    route: "games/brain-in-a-jar/index.html",
    action: "Move the light",
    running: "Signal crossing the controller",
    summary: "Move the light, swap the creature’s eyes, or edit one real connection in its hand-wired neural controller.",
    art: `<g class="treatment-brain">
      <circle class="stimulus" cx="73" cy="173" r="13" />
      <path class="sensor-rays" d="M86 177l89 44M86 168l91 34" />
      <g class="network-lines"><path d="M175 202l42 24-42 26 42 25M217 226l43-25m-43 25 43 26m-43 25 43-25"/></g>
      <g class="network-nodes"><circle cx="175" cy="202" r="6"/><circle cx="175" cy="252" r="6"/><circle cx="217" cy="226" r="6"/><circle cx="217" cy="277" r="6"/><circle cx="260" cy="201" r="6"/><circle cx="260" cy="252" r="6"/></g>
      <circle class="network-pulse" cx="175" cy="202" r="5" />
      <text class="treatment-label" x="76" y="146">VISIBLE CONTROLLER</text>
    </g>`,
  },
  scribble: {
    name: "Scribble Engine",
    route: "games/scribble-engine/index.html",
    action: "Trace a loop",
    running: "Two arms · one pen",
    summary: "Two rotating arms share one pen. Change their lengths, speeds, and directions to alter the drawing.",
    art: `<g class="treatment-scribble">
      <path class="drawing-arm arm-one" d="M68 361L176 254" />
      <path class="drawing-arm arm-two" d="M372 361L176 254" />
      <circle class="arm-joint" cx="68" cy="361" r="8"/><circle class="arm-joint" cx="372" cy="361" r="8"/><circle class="arm-joint" cx="176" cy="254" r="7"/>
      <path class="trace-path" d="M112 267c34-95 69 77 105-21s67 85 103-17c-9 77-64 88-104 37s-69 47-104 1z" />
      <text class="treatment-label" x="139" y="105">DUAL-ARM TRACE</text>
    </g>`,
  },
  traffic: {
    name: "Traffic With No Excuse",
    route: "games/traffic-with-no-excuse/index.html",
    action: "Tap a car",
    running: "Brake wave traveling backward",
    summary: "Brake one identical driver on an obstacle-free ring, remove the cause, and watch the slowdown keep traveling.",
    art: `<g class="treatment-traffic">
      <ellipse class="traffic-ring" cx="220" cy="245" rx="142" ry="42" />
      <g class="traffic-cars"><rect x="212" y="198" width="16" height="8" rx="3"/><rect x="284" y="207" width="16" height="8" rx="3"/><rect x="346" y="240" width="16" height="8" rx="3"/><rect x="286" y="277" width="16" height="8" rx="3"/><rect x="212" y="284" width="16" height="8" rx="3"/><rect x="139" y="276" width="16" height="8" rx="3"/><rect x="79" y="241" width="16" height="8" rx="3"/><rect x="140" y="207" width="16" height="8" rx="3"/></g>
      <path class="jam-wave" d="M91 262q53 42 114 22" />
      <text class="treatment-label" x="154" y="184">FLOW TEST</text>
    </g>`,
  },
  jelly: {
    name: "Jelly Bench",
    route: "games/jelly-bench/index.html",
    action: "Press the planet",
    running: "Pressure applied · spring recovery",
    summary: "Tune stiffness, damping, pressure, and rest length, then see whether one soft body can squeeze through the gap.",
    art: `<g class="treatment-jelly">
      <path class="pressure-lines" d="M365 221l-12 8m14 16h-16m14 25-12-8" />
      <g class="counter-probe">
        <circle cx="335" cy="268" r="7" />
        <path d="M341 268L365 258H391" />
        <rect x="390" y="249" width="8" height="18" rx="4" />
      </g>
      <text class="peer-review-caption" x="289" y="304">PEER REVIEW.</text>
      <text class="treatment-label" x="267" y="201">SOFT-BODY TEST</text>
    </g>`,
  },
  mirror: {
    name: "Mirror Mischief",
    route: "games/mirror-mischief/index.html",
    action: "Tilt the mirror",
    running: "Downstream path changed",
    summary: "Move or rotate mirrors, splitters, blockers, and receivers; one small adjustment changes everything downstream.",
    art: `<g class="treatment-mirror">
      <circle class="mini-source" cx="66" cy="245" r="12" />
      <path class="beam beam-source" d="M79 245h267" />
      <rect class="mini-mirror" x="347" y="216" width="10" height="58" rx="4" />
      <path class="beam beam-one" d="M352 245L303 129" />
      <path class="beam beam-two" d="M352 245L300 354" />
      <g class="mini-receiver"><rect x="284" y="111" width="38" height="28" rx="4"/><circle cx="303" cy="125" r="7"/></g>
      <text class="treatment-label" x="83" y="224">OPTICS PATH</text>
    </g>`,
  },
};

const REST_PATH = "M220 103C298 103 362 166 362 245C362 324 298 387 220 387C142 387 78 324 78 245C78 166 142 103 220 103Z";
const treatmentList = Object.values(treatments);
const surpriseButton = document.querySelector("#surprise-experiment");
const preview = document.querySelector("#bench-preview");
const previewTitle = document.querySelector("#preview-title");
const previewSummary = document.querySelector("#preview-summary");
const previewOpen = document.querySelector("#preview-open");
const previewClose = document.querySelector("#preview-close");
const markers = [...document.querySelectorAll(".globe-marker[data-experiment]")];
const workbench = document.querySelector(".workbench");
const globeZone = document.querySelector(".globe-zone");
const globeStage = document.querySelector(".globe-stage");
const planetTreatment = document.querySelector("#planet-treatment");
const planetShell = document.querySelector("#planet-shell");
const planetClip = document.querySelector("#planet-clip-shape");
const planetSurface = document.querySelector("#planet-surface");
const probeMoving = document.querySelector("#planet-probe-moving");
const treatmentButton = document.querySelector("#poke-planet");
const planetStatus = document.querySelector("#planet-status");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let selectedKey = null;
let lastMarker = null;
let runToken = 0;
let runTimer = 0;
let runFrame = 0;
let apparatusInView = true;
let jellyCompletions = 0;
let peerReviewShown = false;

function easeInOut(value) {
  return value < 0.5 ? 2 * value * value : 1 - ((-2 * value + 2) ** 2) / 2;
}

function dentPath(amount) {
  const edge = 362 - 18 * amount;
  const shoulder = 362 - 9 * amount;
  return `M220 103C298 103 362 166 362 218C${shoulder} 225 ${edge} 237 ${edge} 245C${edge} 253 ${shoulder} 265 362 272C362 324 298 387 220 387C142 387 78 324 78 245C78 166 142 103 220 103Z`;
}

function applyPlanet({ dent = 0, wobble = 0, probe = 0 } = {}) {
  const path = dent ? dentPath(dent) : REST_PATH;
  planetShell?.setAttribute("d", path);
  planetClip?.setAttribute("d", path);
  if (planetSurface) {
    planetSurface.style.transform = wobble ? `translateX(${wobble}px) rotate(${wobble * 0.32}deg)` : "";
  }
  if (probeMoving) probeMoving.style.transform = probe ? `translateX(${-18 * probe}px)` : "";
}

function setTreatmentBusy(busy) {
  if (!treatmentButton) return;
  treatmentButton.disabled = busy || !selectedKey;
  if (busy) treatmentButton.setAttribute("aria-busy", "true");
  else treatmentButton.removeAttribute("aria-busy");
}

function clearPeerReview() {
  globeZone?.classList.remove("peer-review-running", "peer-review-static");
  workbench?.classList.remove("peer-review-active");
}

function cancelTreatment({ announce = false } = {}) {
  runToken += 1;
  window.clearTimeout(runTimer);
  cancelAnimationFrame(runFrame);
  globeZone?.classList.remove("treatment-running", "reduced-result");
  clearPeerReview();
  applyPlanet();
  setTreatmentBusy(false);
  if (announce && selectedKey) planetStatus.textContent = "Test canceled · Earth at rest";
}

function runPeerReview(token) {
  if (token !== runToken) return;
  peerReviewShown = true;
  globeZone?.classList.remove("treatment-running", "reduced-result");
  globeZone?.classList.add(reduceMotion.matches ? "peer-review-static" : "peer-review-running");
  workbench?.classList.add("peer-review-active");
  applyPlanet();
  planetStatus.textContent = "Peer review.";
  runTimer = window.setTimeout(() => {
    if (token !== runToken) return;
    clearPeerReview();
    applyPlanet();
    setTreatmentBusy(false);
    planetStatus.textContent = "Earth returned to rest";
  }, reduceMotion.matches ? 650 : 1250);
}

function finishTreatment(token) {
  if (token !== runToken) return;
  globeZone?.classList.remove("treatment-running", "reduced-result");
  applyPlanet();
  if (selectedKey === "jelly") {
    jellyCompletions += 1;
    if (jellyCompletions === 3 && !peerReviewShown) {
      runPeerReview(token);
      return;
    }
  }
  setTreatmentBusy(false);
  planetStatus.textContent = "Earth returned to rest";
}

function runJellyTreatment(token, startTime) {
  const elapsed = performance.now() - startTime;
  if (token !== runToken) return;
  if (elapsed >= 1500) {
    finishTreatment(token);
    return;
  }
  const extend = elapsed < 180
    ? easeInOut(elapsed / 180)
    : elapsed < 410
      ? 1
      : elapsed < 650
        ? 1 - easeInOut((elapsed - 410) / 240)
        : 0;
  const dent = elapsed < 170
    ? 0
    : elapsed < 310
      ? 0.84 * easeInOut((elapsed - 170) / 140)
      : Math.max(0, 0.84 * Math.exp(-(elapsed - 310) / 410) * (0.7 + 0.3 * Math.cos((elapsed - 310) / 72)));
  const wobble = elapsed < 280 ? 0 : 4.2 * Math.sin((elapsed - 280) / 72) * Math.exp(-(elapsed - 280) / 380);
  applyPlanet({ dent, wobble, probe: extend });
  runFrame = requestAnimationFrame(() => runJellyTreatment(token, startTime));
}

function runTreatment() {
  const treatment = treatments[selectedKey];
  if (!treatment || treatmentButton.disabled) return;
  cancelTreatment();
  const token = runToken;
  setTreatmentBusy(true);
  planetStatus.textContent = treatment.running;

  if (reduceMotion.matches) {
    globeZone.classList.add("reduced-result");
    if (selectedKey === "jelly") applyPlanet({ dent: 0.62, probe: 1 });
    runTimer = window.setTimeout(() => finishTreatment(token), 280);
    return;
  }

  globeZone.classList.add("treatment-running");
  if (selectedKey === "jelly") {
    runFrame = requestAnimationFrame(timestamp => runJellyTreatment(token, timestamp));
  } else {
    runTimer = window.setTimeout(() => finishTreatment(token), 1520);
  }
}

function selectExperiment(key) {
  const treatment = treatments[key];
  if (!treatment || !preview) return;
  cancelTreatment();
  selectedKey = key;
  markers.forEach(marker => marker.setAttribute("aria-pressed", String(marker.dataset.experiment === key)));
  lastMarker = document.querySelector(`.globe-marker[data-experiment="${key}"]`);
  preview.dataset.experiment = key;
  globeZone.dataset.experiment = key;
  previewTitle.textContent = treatment.name;
  previewSummary.textContent = treatment.summary;
  previewOpen.href = treatment.route;
  previewOpen.hidden = false;
  previewClose.hidden = false;
  planetTreatment.innerHTML = treatment.art;
  treatmentButton.innerHTML = `${treatment.action} <span aria-hidden="true">→</span>`;
  setTreatmentBusy(false);
  planetStatus.textContent = `${treatment.name} ready`;
}

function closePreview({ restoreFocus = false } = {}) {
  cancelTreatment();
  markers.forEach(marker => marker.setAttribute("aria-pressed", "false"));
  selectedKey = null;
  delete preview.dataset.experiment;
  delete globeZone.dataset.experiment;
  previewTitle.textContent = "Pick a numbered specimen";
  previewSummary.textContent = "Select a marker around Earth to wake one small machine.";
  previewOpen.hidden = true;
  previewClose.hidden = true;
  planetTreatment.innerHTML = "";
  treatmentButton.innerHTML = 'Select an experiment <span aria-hidden="true">→</span>';
  treatmentButton.disabled = true;
  planetStatus.textContent = "Earth ready for a test";
  if (restoreFocus) lastMarker?.focus();
}

markers.forEach(marker => marker.addEventListener("click", () => selectExperiment(marker.dataset.experiment)));
treatmentButton?.addEventListener("click", runTreatment);
previewClose?.addEventListener("click", () => closePreview({ restoreFocus: true }));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && selectedKey) closePreview({ restoreFocus: true });
});

if (globeStage && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    apparatusInView = Boolean(entries[0]?.isIntersecting);
    if (!apparatusInView) cancelTreatment();
  }, { threshold: 0.08 });
  observer.observe(globeStage);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden || !apparatusInView) cancelTreatment({ announce: true });
});

surpriseButton?.addEventListener("click", () => {
  const destination = treatmentList[Math.floor(Math.random() * treatmentList.length)].route;
  const reduced = reduceMotion.matches;
  surpriseButton.disabled = true;
  surpriseButton.setAttribute("aria-busy", "true");
  surpriseButton.classList.add("launched");
  window.setTimeout(() => window.location.assign(destination), reduced ? 0 : 550);
});
