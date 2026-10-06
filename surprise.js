const BASE_TITLE = "Trikzik Labs - Games & Experiments by Ernest Turner";
const STORAGE_KEY = "trikzik:selected-experiment";

const experiments = {
  moon: {
    name: "Moon Snail",
    short: "MS",
    route: "games/moon-snail/index.html",
    question: "How much umbrella charge should become somebody else's moon problem?",
    parameter: { label: "Umbrella charge", min: 10, max: 100, step: 5, initial: 55, low: "one cautious bubble", high: "orbital paperwork", format: value => `${value}%` },
    readings: value => [`${Math.max(1, Math.round(value / 18))} marshmallow${value < 28 ? "" : "s"} captured`, value > 76 ? "Local moon gains a snack ring" : "Snail remains professionally damp"],
    caption: value => value > 70 ? "More charge makes more bubbles; the moon has begun asking about zoning." : "Umbrella charge controls how many captures become upward deliveries.",
    running: "Umbrella open. Marshmallows reconsidering gravity.",
    result: value => value > 70 ? "Trial received: moon now has a catering problem." : "Trial received: capture loop behaved suspiciously well.",
    trace: value => `M44 282C126 ${310-value} 156 ${112+value} 236 220S374 ${310-value} 430 176S520 ${122+value} 596 148`,
    art(value) {
      const count = Math.max(1, Math.round(value / 20));
      const bubbles = Array.from({ length: count }, (_, index) => { const cx=310+index*33, cy=225-index*26; return `<circle class="thin moon-bubble" cx="${cx}" cy="${cy}" r="${10+index}" style="--bubble-step:${index};--bubble-dx:${500-cx}px;--bubble-dy:${105-cy}px"/>`; }).join("");
      return `<circle class="solid moon-target" cx="500" cy="105" r="48"/><path class="thin" d="M476 86c26 5 30 30 3 39M520 91c-17 8-12 28 8 31"/><path class="solid moon-capture" d="M119 287c0-28 40-41 70-20 20 14 49 5 67 30-13 23-49 24-82 21-34-3-55-13-55-31Z"/><circle class="line" cx="168" cy="273" r="29"/><path class="thin moon-umbrella" d="M168 289c-28-4-20-39 4-29 18 8 9 30-6 20M203 255q48-55 98 0M252 255v55"/>${bubbles}<text x="83" y="92">CAPTURE → BUBBLE → MOON</text>`;
    }
  },
  star: {
    name: "Starfall: Last Light",
    short: "SL",
    route: "games/starfall/index.html",
    question: "How much of the light keeping you alive are you willing to fire at something else?",
    parameter: { label: "Light committed", min: 10, max: 90, step: 5, initial: 40, low: "stay alive", high: "excellent flare", format: value => `${value}%` },
    readings: value => [`Flare intensity ${value}`, `${100-value}% remains between you and darkness`],
    caption: value => value > 65 ? "The flare is magnificent. The life-support readout has filed a concern." : "Weapon power and survival draw from the same reserve.",
    running: "Light leaving the ship. Darkness taking notes.",
    result: value => value > 65 ? "Trial received: flare excellent, survival negotiable." : "Trial received: fragment recovery recommended.",
    trace: value => `M44 258L150 258L205 ${280-value}L258 258L320 ${132+value}L378 258L470 ${310-value}L596 258`,
    art(value) {
      const eclipse = 38 + value * .75;
      return `<circle class="solid star-world" cx="474" cy="210" r="86"/><circle class="dark star-shadow" cx="${474+eclipse}" cy="190" r="93"/><path class="paper star-ship" d="m126 214 91-43-27 43 27 43Z"/><circle class="hot star-flare" cx="190" cy="214" r="${8+value*.12}" style="--flare-distance:${220+value}px"/><path class="line star-beam" d="M216 214h${75+value*1.2}"/><path class="thin star-target" d="m310 180 11 19 22 4-16 15 3 22-20-10-19 10 3-22-16-15 22-4Z"/><text x="82" y="92">ONE RESERVE / THREE BAD IDEAS</text>`;
    }
  },
  dungeon: {
    name: "Dungeon Reset",
    short: "DR",
    route: "games/dungeon-reset/index.html",
    question: "How ready does a dungeon need to look before the next heroes make readiness theoretical?",
    parameter: { label: "Reset readiness", min: 0, max: 100, step: 5, initial: 62, low: "still smoking", high: "implausibly tidy", format: value => `${value}%` },
    readings: value => [`${Math.round(value/14)} of 7 jobs signed off`, value > 82 ? "Heroes suspicious of cleanliness" : "Caretaker requesting more caretaker"],
    caption: value => value > 78 ? "Everything is ready. This has historically attracted heroes." : "Repair effort raises readiness while the next party remains inconsiderate.",
    running: "Checklist moving left to right. Heroes moving the other way.",
    result: value => value > 78 ? "Trial received: dungeon ready enough to be ruined." : "Trial received: mop still structurally important.",
    trace: value => `M44 300L130 300L130 ${320-value*1.7}L210 ${320-value*1.7}L210 ${285-value}L300 ${285-value}L300 ${250-value*.45}L596 ${250-value*.45}`,
    art(value) {
      const door = Math.max(8, 84-value*.72);
      return `<path class="solid dungeon-door" d="M104 320V137h148v183M135 320V178h86v142"/><path class="thin" d="M84 320h190M126 137q52-62 104 0"/><rect class="paper dungeon-sheet" x="328" y="131" width="185" height="190" rx="6"/><path class="thin" d="M350 172h139M350 212h139M350 252h139M350 292h139"/><path class="line dungeon-checks" d="m350 166 9 9 17-22m-26 53 9 9 17-22m-26 53 9 9 17-22"/><path class="line dungeon-progress" d="M350 286h${140-door}"/><text x="86" y="92">POST-RAID MAINTENANCE WINDOW</text>`;
    }
  },
  brain: {
    name: "Brain in a Jar",
    short: "BJ",
    route: "games/brain-in-a-jar/index.html",
    question: "Where should the light go if a creature's whole opinion is four inputs and some wires?",
    parameter: { label: "Light position", min: 0, max: 100, step: 2, initial: 72, low: "hard left", high: "hard right", format: value => `${value < 48 ? "L" : value > 52 ? "R" : "CENTER"} ${Math.abs(value-50)*2}%` },
    readings: value => [value < 45 ? "Left sensor dominates" : value > 55 ? "Right sensor dominates" : "Sensors politely disagree", Math.abs(value-50) > 37 ? "Wall input preparing rebuttal" : "Motor decision still reversible"],
    caption: value => `Moving the stimulus changes real sensor values; the visible controller turns that into a ${value < 50 ? "left" : "right"} motor bias.`,
    running: "Signal crossing the hand-wired controller.",
    result: value => `Trial received: creature committed ${Math.abs(value-50) > 28 ? "with confidence" : "with reservations"}.`,
    trace: value => `M44 ${130+value*1.7}C140 ${130+value} 164 ${350-value} 246 214S366 ${110+value*1.8} 430 214S510 ${320-value} 596 ${320-value}`,
    art(value) {
      const lightX = 86 + value * 4.4;
      const activeLeft = value < 50 ? "hot" : "solid";
      const activeRight = value >= 50 ? "hot" : "solid";
      return `<circle class="hot brain-stimulus" cx="${lightX}" cy="115" r="19"/><path class="thin brain-input" d="M${lightX} 134 225 194M${lightX} 134 225 278"/><path class="solid brain-body" d="M197 235c0-45 43-78 89-65 43-26 97 8 93 55 32 34 2 91-43 82-32 36-92 20-94-27-31-2-48-22-45-45Z"/><g class="thin brain-wire"><path d="M225 194 301 216 369 185M225 194 301 260 369 289M225 278 301 216 369 289M225 278 301 260 369 185"/></g><circle class="${activeLeft} brain-node" cx="225" cy="194" r="10"/><circle class="${activeRight} brain-node" cx="225" cy="278" r="10"/><circle class="solid brain-node" cx="301" cy="216" r="10"/><circle class="solid brain-node" cx="301" cy="260" r="10"/><circle class="${activeRight} brain-node brain-output" cx="369" cy="185" r="11"/><circle class="${activeLeft} brain-node brain-output" cx="369" cy="289" r="11"/><text x="82" y="72">STIMULUS → SENSOR → OPINION</text>`;
    }
  },
  scribble: {
    name: "Scribble Engine",
    short: "SE",
    route: "games/scribble-engine/index.html",
    question: "What line appears when two arms rotate independently and neither knows what straight means?",
    parameter: { label: "Arm 2 speed ratio", min: 20, max: 180, step: 5, initial: 90, low: "slow orbit", high: "urgent orbit", format: value => `${value}%` },
    readings: value => [`Ratio 1 : ${(value/100).toFixed(2)}`, Math.abs(value-100) < 12 ? "Near-repeat likely" : "Pattern postponing repetition"],
    caption: value => `Changing one arm's speed ratio reshapes the trace without moving either pivot. Current ratio: 1:${(value/100).toFixed(2)}.`,
    running: "Two arms moving. One pen documenting the disagreement.",
    result: value => Math.abs(value-100) < 12 ? "Trial received: almost a circle, technically a negotiation." : "Trial received: repetition postponed successfully.",
    trace: value => `M44 250C120 ${70+value} 180 ${350-value} 248 220S370 ${60+value*1.2} 438 ${315-value*.7}S528 ${120+value} 596 218`,
    art(value) {
      const elbowY = 145 + value * .65;
      return `<circle class="solid scribble-pivot" cx="112" cy="318" r="13"/><circle class="solid scribble-pivot" cx="518" cy="318" r="13"/><path class="line scribble-arm" d="M112 318 287 ${elbowY} 518 318"/><circle class="hot scribble-pen" cx="287" cy="${elbowY}" r="12"/><path class="thin scribble-drawing" d="M83 247c68-156 128 145 204-35s132 157 248-13c-32 118-134 139-238 52S154 355 83 247Z"/><text x="83" y="82">COUPLED MOTION / UNCOUPLED INTENT</text>`;
    }
  },
  traffic: {
    name: "Traffic With No Excuse",
    short: "TX",
    route: "games/traffic-with-no-excuse/index.html",
    question: "How long must one driver brake before the reason disappears but the stopping learns to travel?",
    parameter: { label: "Brake duration", min: 5, max: 40, step: 5, initial: 20, low: "a nervous tap", high: "a small betrayal", format: value => `${(value/10).toFixed(1)} s` },
    readings: value => [`Brake scheduled ${(value/10).toFixed(1)} seconds`, "12 cars / uniform flow"],
    caption: value => `Run the trial to brake the marked car for ${(value/10).toFixed(1)} seconds, release it, and watch the queue travel through other drivers.`,
    running: "Marked car braking. Following gaps are closing.",
    result: () => "Traffic trial complete.",
    trace: () => "",
    art(value) {
      const cars = Array.from({ length: 12 }, (_, index) => {
        const angle = index / 12 * Math.PI * 2;
        const x = 320 + Math.cos(angle) * 183;
        const y = 230 + Math.sin(angle) * 116;
        return `<rect class="traffic-car${index === 0 ? " is-brake" : ""}" data-car="${index}" x="-13" y="-7" width="26" height="14" rx="4" transform="translate(${x} ${y}) rotate(${angle * 180 / Math.PI + 90})"/>`;
      }).join("");
      return `<g class="traffic-sim"><ellipse class="traffic-road-edge" cx="320" cy="230" rx="214" ry="145"/><ellipse class="traffic-road" cx="320" cy="230" rx="183" ry="116"/><ellipse class="traffic-wave" cx="320" cy="230" rx="183" ry="116"/>${cars}<circle class="traffic-brake-lamp" cx="503" cy="230" r="18"/><text class="traffic-phase" x="83" y="63">READY / BRAKE ${(value/10).toFixed(1)} S</text><text class="traffic-clock" x="83" y="88">t = 0.0 s / 0 queued</text><text class="traffic-cause-label" x="442" y="205">MARKED CAR</text></g>`;
    }
  },
  jelly: {
    name: "Jelly Bench",
    short: "JB",
    route: "games/jelly-bench/index.html",
    question: "How much pressure makes a soft body fit through a gap before recovery becomes a personal matter?",
    parameter: { label: "Internal pressure", min: 20, max: 100, step: 5, initial: 60, low: "puddle-adjacent", high: "strong opinions", format: value => `${value} kPa-ish` },
    readings: value => [`Compression ${Math.round(100-value*.58)}%`, value > 72 ? "Gap has become negotiable" : "Body considering another route"],
    caption: value => value > 72 ? "Pressure stiffens the body enough to push through; getting back remains a separate grant proposal." : "Low pressure deforms easily but cannot push decisively through the gap.",
    running: "Pressure applied. Blob composing formal response.",
    result: value => value > 72 ? "Trial received: passage achieved, return trip disputed." : "Trial received: blob has chosen structural ambiguity.",
    trace: value => `M44 215C112 ${330-value} 168 ${330-value} 225 215S340 ${100+value} 405 215S520 ${330-value*1.2} 596 215`,
    art(value) {
      const width=165-value*.62, height=76+value*.3, x=320-width/2;
      return `<path class="thin jelly-barrier" d="M86 108v225h176V254M554 108v225H378V254"/><path class="solid jelly-body${value>72?" can-pass":""}" d="M${x} 250c0-${height*.7} ${width*.2}-${height} ${width*.5}-${height}s${width*.5} ${height*.3} ${width*.5} ${height}c0 ${height*.72}-${width*.19} ${height}-${width*.5} ${height}s-${width*.5}-${height*.28}-${width*.5}-${height}Z"/><path class="line jelly-force" d="M272 214h-48m144 0h48"/><text x="83" y="74">PROPERTY CHANGE / SAME BODY</text>`;
    }
  },
  mirror: {
    name: "Mirror Mischief",
    short: "MM",
    route: "games/mirror-mischief/index.html",
    question: "How far can one mirror turn before every receiver downstream gets a different version of the story?",
    parameter: { label: "Mirror angle", min: -60, max: 60, step: 5, initial: 15, low: "−60°", high: "+60°", format: value => `${value > 0 ? "+" : ""}${value}°` },
    readings: value => [`Beam deflection ${Math.abs(value*2)}°`, Math.abs(value) > 38 ? "Receiver B has left the conversation" : "Both receivers still arguing"],
    caption: value => `A ${value > 0 ? "clockwise" : "counterclockwise"} adjustment changes every segment after the selected mirror, not before it.`,
    running: "Light path recalculating downstream consequences.",
    result: value => Math.abs(value) > 38 ? "Trial received: one receiver dramatically uninvolved." : "Trial received: light divided into competing testimony.",
    trace: value => `M44 215H280L390 ${215-value*2.2}L486 ${215+value*1.35}L596 ${215-value*.8}`,
    art(value) {
      const y1=215-value*2.2, y2=215+value*1.35;
      return `<circle class="hot mirror-source" cx="89" cy="215" r="20"/><path class="line mirror-beam" d="M110 215H280L390 ${y1}M280 215 390 ${y2}"/><rect class="solid mirror-plate" x="272" y="161" width="16" height="108" rx="7" transform="rotate(${value} 280 215)"/><rect class="dark mirror-receiver" x="390" y="${y1-28}" width="68" height="56" rx="8"/><rect class="dark mirror-receiver" x="390" y="${y2-28}" width="68" height="56" rx="8"/><circle class="hot mirror-hit" cx="424" cy="${y1}" r="10"/><circle class="solid mirror-hit" cx="424" cy="${y2}" r="10"/><text x="83" y="78">ONE MOVE / EVERYTHING AFTER</text>`;
    }
  }
};

const apparatus = document.querySelector(".apparatus-shell");
const controls = [...document.querySelectorAll(".experiment-control")];
const selectionCount = document.querySelector("#selection-count");
const scopeTitle = document.querySelector("#scope-title");
const scopeMode = document.querySelector("#scope-mode");
const scopeArt = document.querySelector("#scope-art");
const scopeTrace = document.querySelector("#scope-trace");
const scopeCaption = document.querySelector("#scope-caption");
const controlTitle = document.querySelector("#control-title");
const question = document.querySelector("#specimen-question");
const parameter = document.querySelector("#interference");
const parameterLabel = document.querySelector("#parameter-label");
const parameterOutput = document.querySelector("#parameter-output");
const rangeLow = document.querySelector("#range-low");
const rangeHigh = document.querySelector("#range-high");
const readingPrimary = document.querySelector("#reading-primary");
const readingSecondary = document.querySelector("#reading-secondary");
const runButton = document.querySelector("#run-trial");
const openLink = document.querySelector("#open-experiment");
const clearButton = document.querySelector("#clear-selection");
const status = document.querySelector("#bench-status");
const receiver = document.querySelector("#records-receiver");
const receiverText = receiver?.querySelector("span");
const surpriseButton = document.querySelector("#surprise-experiment");
const favicon = document.querySelector("#dynamic-favicon");
const trafficRecord = document.querySelector("#traffic-trial-record");
const trafficRecordCause = document.querySelector("#traffic-record-cause");
const trafficRecordEffect = document.querySelector("#traffic-record-effect");
const supportPhrase = document.querySelector("#support-link .support-phrase");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const keys = Object.keys(experiments);
let selectedKey = null;
let trialToken = 0;
let trialTimer = 0;
let trafficFrame = 0;
let deliveryTimer = 0;
let leverTimer = 0;
let trafficState = null;
let apparatusVisible = true;
let lastControl = null;

function safeStorage(method, value) {
  try { return value === undefined ? localStorage[method](STORAGE_KEY) : localStorage[method](STORAGE_KEY, value); }
  catch { return null; }
}

function selectionUrl(key) {
  const url = new URL(location.href);
  if (key) url.searchParams.set("experiment", key);
  else url.searchParams.delete("experiment");
  return `${url.pathname}${url.search}${url.hash}`;
}

function faviconMarkup(experiment) {
  const color = getComputedStyle(document.body).getPropertyValue("--accent").trim() || "#45e182";
  const letters = experiment?.short || "TL";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#07131b"/><path d="M9 47h46M14 41V18h36v23" fill="none" stroke="${color}" stroke-width="4"/><text x="32" y="36" text-anchor="middle" font-family="monospace" font-weight="700" font-size="16" fill="#eff5fa">${letters}</text></svg>`;
}

function updateBoundaryCue(experiment) {
  document.title = experiment ? `${experiment.name} on the bench | Trikzik Labs` : BASE_TITLE;
  if (favicon) favicon.href = experiment ? `data:image/svg+xml,${encodeURIComponent(faviconMarkup(experiment))}` : "/favicon.ico";
}

function updateDiagram(experiment, value) {
  scopeArt.innerHTML = experiment.art(value);
  scopeTrace.setAttribute("d", experiment.trace(value));
  scopeCaption.textContent = experiment.caption(value);
  const [primary, secondary] = experiment.readings(value);
  readingPrimary.textContent = primary;
  readingSecondary.textContent = secondary;
  parameterOutput.value = experiment.parameter.format(value);
  parameterOutput.textContent = experiment.parameter.format(value);
}

function createTrafficState(value) {
  return {
    brakeDuration: value / 10,
    endTime: value / 10 + 4,
    time: 0,
    released: false,
    maxQueueAfterRelease: 0,
    lastJamTime: value / 10,
    cars: Array.from({ length: 12 }, (_, index) => ({ position: index * (1000 / 12), speed: 55 }))
  };
}

function stepTraffic(state, dt) {
  const positions = state.cars.map(car => car.position);
  const speeds = state.cars.map(car => car.speed);
  const braking = state.time < state.brakeDuration;
  state.cars.forEach((car, index) => {
    const leader = (index + 1) % state.cars.length;
    const gap = (positions[leader] - positions[index] + 1000) % 1000;
    const gapSpeed = Math.max(5, Math.min(55, (gap - 31) * 1.22));
    const desired = index === 0 && braking ? 5 : gapSpeed;
    const rate = desired < speeds[index] ? 42 : 11;
    car.speed += Math.sign(desired - speeds[index]) * Math.min(Math.abs(desired - speeds[index]), rate * dt);
  });
  state.cars.forEach(car => { car.position = (car.position + car.speed * dt) % 1000; });
  state.time += dt;
  const queued = state.cars.slice(1).filter(car => car.speed < 47).length;
  if (state.time >= state.brakeDuration) {
    state.maxQueueAfterRelease = Math.max(state.maxQueueAfterRelease, queued);
    if (queued > 0) state.lastJamTime = state.time;
  }
  return queued;
}

function trafficSnapshot(state = trafficState) {
  if (!state) return null;
  const queued = state.cars.slice(1).filter(car => car.speed < 47).length;
  return {
    time: Number(state.time.toFixed(2)),
    brakeDuration: state.brakeDuration,
    causeOn: state.time < state.brakeDuration,
    queued,
    queuedIndices: state.cars.map((car, index) => index !== 0 && car.speed < 47 ? index : -1).filter(index => index > 0),
    maxQueueAfterRelease: state.maxQueueAfterRelease,
    persistence: Number(Math.max(0, state.lastJamTime - state.brakeDuration).toFixed(2)),
    queuePresentAtEnd: state.time >= state.endTime && queued > 0,
    positions: state.cars.map(car => Number(car.position.toFixed(2))),
    speeds: state.cars.map(car => Number(car.speed.toFixed(2)))
  };
}

function renderTraffic(state) {
  const sim = scopeArt.querySelector(".traffic-sim");
  if (!sim) return;
  const braking = state.time < state.brakeDuration;
  const queuedCars = [];
  let markedPoint = null;
  sim.querySelectorAll(".traffic-car").forEach((node, index) => {
    const car = state.cars[index];
    const angle = car.position / 1000 * Math.PI * 2;
    const x = 320 + Math.cos(angle) * 183;
    const y = 230 + Math.sin(angle) * 116;
    node.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(angle * 180 / Math.PI + 90).toFixed(2)})`);
    const queued = index !== 0 && car.speed < 47;
    node.classList.toggle("is-queued", queued);
    node.classList.toggle("is-braking", index === 0 && braking);
    if (index === 0) markedPoint = { x, y };
    if (queued) queuedCars.push({ index, angle, speed: car.speed });
  });
  const lamp = sim.querySelector(".traffic-brake-lamp");
  lamp?.classList.toggle("is-on", braking);
  if (lamp && markedPoint) {
    lamp.setAttribute("cx", markedPoint.x.toFixed(2));
    lamp.setAttribute("cy", markedPoint.y.toFixed(2));
  }
  const wave = sim.querySelector(".traffic-wave");
  const slowest = queuedCars.sort((a, b) => a.speed - b.speed)[0];
  wave?.classList.toggle("is-visible", Boolean(slowest));
  if (wave && slowest) wave.style.transform = `rotate(${slowest.angle * 180 / Math.PI + 30}deg)`;
  const phase = sim.querySelector(".traffic-phase");
  const clock = sim.querySelector(".traffic-clock");
  const causeLabel = sim.querySelector(".traffic-cause-label");
  if (causeLabel && markedPoint) {
    const onRight = markedPoint.x > 420;
    causeLabel.setAttribute("x", (markedPoint.x + (onRight ? -18 : 18)).toFixed(2));
    causeLabel.setAttribute("y", (markedPoint.y - 19).toFixed(2));
    causeLabel.setAttribute("text-anchor", onRight ? "end" : "start");
  }
  if (phase) phase.textContent = braking ? "BRAKE ON / CAUSE PRESENT" : "BRAKE OFF / CAUSE REMOVED";
  if (clock) clock.textContent = `t = ${state.time.toFixed(1)} s / ${queuedCars.length} following car${queuedCars.length === 1 ? "" : "s"} queued`;
  readingPrimary.textContent = braking ? `Marked car braking / ${Math.max(0, state.brakeDuration - state.time).toFixed(1)} s left` : `Marked car released at ${state.brakeDuration.toFixed(1)} s`;
  readingSecondary.textContent = queuedCars.length ? `${queuedCars.length} following car${queuedCars.length === 1 ? "" : "s"} still below cruising speed` : "Flow currently uniform";
  scopeCaption.textContent = braking
    ? "The marked car is the only cause. Following drivers react to shrinking gaps, not to a hidden obstacle."
    : queuedCars.length
      ? "The marked car is moving again. The highlighted queue remains behind it and continues traveling backward through traffic."
      : "The marked car is moving again and the last following driver has recovered cruising speed.";
}

function finishTrafficTrial(token, experiment, value) {
  if (token !== trialToken || !trafficState) return;
  cancelAnimationFrame(trafficFrame);
  trafficFrame = 0;
  renderTraffic(trafficState);
  apparatus?.classList.remove("trial-running");
  apparatus?.classList.add("traffic-received");
  runButton?.removeAttribute("aria-busy");
  if (runButton) runButton.disabled = false;
  scopeMode.textContent = "COMPLETE";
  const metrics = trafficSnapshot();
  const cars = metrics.maxQueueAfterRelease;
  const persistence = metrics.queuePresentAtEnd
    ? `was still present at the observation cutoff, at least ${metrics.persistence.toFixed(1)} s after release`
    : `cleared ${metrics.persistence.toFixed(1)} s after release`;
  const receiptPersistence = metrics.queuePresentAtEnd
    ? `at least ${metrics.persistence.toFixed(1)} s / still present at cutoff`
    : `cleared after ${metrics.persistence.toFixed(1)} s`;
  const result = `Cause ended at ${(value / 10).toFixed(1)} s; ${cars} following car${cars === 1 ? "" : "s"} queued after release; the wave ${persistence}.`;
  status.textContent = result;
  setReceiver(`Traffic receipt: ${cars} cars queued after release / ${receiptPersistence}`, "traffic");
  if (trafficRecord && trafficRecordCause && trafficRecordEffect) {
    trafficRecord.hidden = false;
    trafficRecordCause.textContent = `${(value / 10).toFixed(1)} s marked-car brake`;
    trafficRecordEffect.textContent = `${cars} following cars / ${receiptPersistence}`;
  }
  clearTimeout(deliveryTimer);
  deliveryTimer = setTimeout(() => apparatus?.classList.remove("traffic-received"), reduceMotion.matches ? 20 : 900);
}

function runTrafficTrial(token, experiment, value) {
  trafficState = createTrafficState(value);
  renderTraffic(trafficState);
  if (reduceMotion.matches) {
    while (trafficState.time < trafficState.endTime) stepTraffic(trafficState, .04);
    finishTrafficTrial(token, experiment, value);
    return;
  }
  let previous = performance.now();
  const frame = now => {
    if (token !== trialToken || !trafficState) return;
    const elapsed = Math.min(.05, (now - previous) / 1000);
    previous = now;
    const wasBraking = trafficState.time < trafficState.brakeDuration;
    stepTraffic(trafficState, elapsed * 2.15);
    renderTraffic(trafficState);
    if (wasBraking && trafficState.time >= trafficState.brakeDuration) {
      status.textContent = "Brake released. The following gaps now decide what survives.";
    }
    if (trafficState.time >= trafficState.endTime) finishTrafficTrial(token, experiment, value);
    else trafficFrame = requestAnimationFrame(frame);
  };
  trafficFrame = requestAnimationFrame(frame);
}

function cancelTrial(message = "") {
  trialToken += 1;
  clearTimeout(trialTimer);
  clearTimeout(deliveryTimer);
  clearTimeout(leverTimer);
  cancelAnimationFrame(trafficFrame);
  trafficFrame = 0;
  trafficState = null;
  apparatus?.classList.remove("trial-running");
  apparatus?.classList.remove("traffic-received");
  apparatus?.classList.remove("disturbed");
  surpriseButton?.classList.remove("lever-pulled");
  runButton?.removeAttribute("aria-busy");
  if (runButton) runButton.disabled = !selectedKey;
  if (selectedKey) scopeMode.textContent = "READY";
  if (message && selectedKey) status.textContent = message;
}

function setReceiver(message, key = selectedKey) {
  if (!receiver || !receiverText) return;
  receiver.classList.add("received");
  receiverText.textContent = message.toUpperCase();
}

function completeTrial(token, experiment, value) {
  if (token !== trialToken) return;
  apparatus?.classList.remove("trial-running");
  runButton?.removeAttribute("aria-busy");
  if (runButton) runButton.disabled = false;
  scopeMode.textContent = "COMPLETE";
  const result = experiment.result(value);
  status.textContent = result;
  setReceiver(result);
}

function runTrial() {
  const experiment = experiments[selectedKey];
  if (!experiment || !apparatusVisible || runButton.disabled) return;
  cancelTrial();
  const token = trialToken;
  const value = Number(parameter.value);
  void apparatus.offsetWidth;
  apparatus.classList.add("trial-running");
  runButton.disabled = true;
  runButton.setAttribute("aria-busy", "true");
  scopeMode.textContent = "RUNNING";
  status.textContent = experiment.running;
  if (selectedKey === "traffic") {
    runTrafficTrial(token, experiment, value);
    return;
  }
  const duration = reduceMotion.matches ? 40 : 1320;
  trialTimer = setTimeout(() => completeTrial(token, experiment, value), duration);
}

function applySelection(key, { history = "none", focus = false, announce = true } = {}) {
  const experiment = experiments[key];
  if (!experiment) return clearSelection({ history, focus });
  cancelTrial();
  selectedKey = key;
  lastControl = document.querySelector(`.experiment-control[data-experiment="${key}"]`);
  document.body.dataset.labState = "active";
  document.body.dataset.experiment = key;
  controls.forEach(control => control.setAttribute("aria-pressed", String(control.dataset.experiment === key)));
  selectionCount.value = `${keys.indexOf(key) + 1} / ${keys.length}`;
  selectionCount.textContent = `${keys.indexOf(key) + 1} / ${keys.length}`;
  scopeTitle.textContent = experiment.name;
  scopeMode.textContent = "READY";
  controlTitle.textContent = experiment.name;
  question.textContent = experiment.question;
  parameter.min = experiment.parameter.min;
  parameter.max = experiment.parameter.max;
  parameter.step = experiment.parameter.step;
  parameter.value = experiment.parameter.initial;
  parameter.disabled = false;
  parameterLabel.textContent = experiment.parameter.label;
  rangeLow.textContent = experiment.parameter.low;
  rangeHigh.textContent = experiment.parameter.high;
  runButton.disabled = false;
  clearButton.disabled = false;
  openLink.href = experiment.route;
  openLink.classList.remove("is-disabled");
  openLink.removeAttribute("aria-disabled");
  updateDiagram(experiment, experiment.parameter.initial);
  updateBoundaryCue(experiment);
  receiver?.classList.remove("received");
  if (receiverText) receiverText.textContent = "TRIAL SELECTED / AWAITING SIGNAL";
  if (trafficRecord) trafficRecord.hidden = true;
  if (announce) status.textContent = `${experiment.name} mounted. ${experiment.parameter.label} ready.`;
  safeStorage("setItem", key);
  if (history === "push") historyPush(key);
  if (history === "replace") historyReplace(key);
  if (focus) lastControl?.focus();
}

function clearSelection({ history = "none", focus = false } = {}) {
  cancelTrial();
  selectedKey = null;
  delete document.body.dataset.experiment;
  document.body.dataset.labState = "idle";
  controls.forEach(control => control.setAttribute("aria-pressed", "false"));
  selectionCount.value = `0 / ${keys.length}`;
  selectionCount.textContent = `0 / ${keys.length}`;
  scopeTitle.textContent = "Nothing mounted";
  scopeMode.textContent = "STANDBY";
  controlTitle.textContent = "No specimen selected";
  question.textContent = "Select a specimen to expose the one control most likely to make it interesting.";
  parameter.disabled = true;
  parameter.value = 50;
  parameterLabel.textContent = "Interference";
  parameterOutput.value = "--";
  parameterOutput.textContent = "--";
  rangeLow.textContent = "less";
  rangeHigh.textContent = "more";
  readingPrimary.textContent = "No activity";
  readingSecondary.textContent = "Bench remains innocent";
  scopeArt.innerHTML = "";
  scopeTrace.setAttribute("d", "");
  scopeCaption.textContent = "The bench is honest about not knowing what you want.";
  runButton.disabled = true;
  clearButton.disabled = true;
  openLink.href = "#experiments";
  openLink.classList.add("is-disabled");
  openLink.setAttribute("aria-disabled", "true");
  status.textContent = "Bench idle. No emergency, technically.";
  receiver?.classList.remove("received");
  if (receiverText) receiverText.textContent = "NO TRIAL RECEIVED";
  if (trafficRecord) trafficRecord.hidden = true;
  updateBoundaryCue(null);
  safeStorage("removeItem");
  if (history === "push") historyPush(null);
  if (history === "replace") historyReplace(null);
  if (focus) lastControl?.focus();
}

function historyPush(key) {
  const url = selectionUrl(key);
  if (`${location.pathname}${location.search}${location.hash}` !== url) history.pushState({ experiment: key }, "", url);
}
function historyReplace(key) { history.replaceState({ experiment: key }, "", selectionUrl(key)); }

controls.forEach(control => control.addEventListener("click", () => {
  const key = control.dataset.experiment;
  if (key === selectedKey) { control.focus(); return; }
  applySelection(key, { history: "push" });
}));

parameter?.addEventListener("input", () => {
  const experiment = experiments[selectedKey];
  if (!experiment) return;
  cancelTrial("Control changed. Trial ready again.");
  updateDiagram(experiment, Number(parameter.value));
});
runButton?.addEventListener("click", runTrial);
clearButton?.addEventListener("click", () => clearSelection({ history: "push", focus: true }));
openLink?.addEventListener("click", event => { if (openLink.getAttribute("aria-disabled") === "true") event.preventDefault(); });

surpriseButton?.addEventListener("click", () => {
  const experiment = experiments[selectedKey];
  if (!experiment) {
    status.textContent = "The lever refuses to move without a mounted specimen.";
    return;
  }
  cancelTrial();
  const low = Number(experiment.parameter.min);
  const high = Number(experiment.parameter.max);
  const current = Number(parameter.value);
  const target = current <= (low + high) / 2 ? high : low;
  parameter.value = target;
  updateDiagram(experiment, target);
  apparatus?.classList.add("disturbed");
  surpriseButton.classList.add("lever-pulled");
  status.textContent = `Unknown disturbance moved ${experiment.parameter.label.toLowerCase()} to ${experiment.parameter.format(target)}.`;
  leverTimer = setTimeout(() => {
    apparatus?.classList.remove("disturbed");
    surpriseButton.classList.remove("lever-pulled");
    runTrial();
  }, reduceMotion.matches ? 20 : 260);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && selectedKey && !event.defaultPrevented) clearSelection({ history: "push", focus: true });
});
window.addEventListener("popstate", () => {
  const key = new URL(location.href).searchParams.get("experiment");
  if (experiments[key]) applySelection(key, { history: "none", announce: false });
  else clearSelection({ history: "none" });
});
document.addEventListener("visibilitychange", () => { if (document.hidden) cancelTrial("Trial interrupted. Bench safely returned to ready."); });

if (apparatus && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    apparatusVisible = Boolean(entries[0]?.isIntersecting && entries[0].intersectionRatio > .08);
    if (!apparatusVisible) cancelTrial();
  }, { threshold: [0, .08, .25] });
  observer.observe(apparatus);
}

const urlKey = new URL(location.href).searchParams.get("experiment");
const storedKey = safeStorage("getItem");
if (experiments[urlKey]) applySelection(urlKey, { history: "none", announce: false });
else if (experiments[storedKey]) applySelection(storedKey, { history: "replace", announce: false });
else clearSelection();

if (supportPhrase) {
  const phrases = ["Keep the experiments running", "Fund the next question", "Help us see what happens"];
  supportPhrase.textContent = phrases[Math.floor(Math.random() * phrases.length)];
}

window.__trikzikLabTest = Object.freeze({
  keys: [...keys],
  select: key => applySelection(key),
  clear: () => clearSelection(),
  run: runTrial,
  snapshot: () => ({ selectedKey, value: Number(parameter.value), running: apparatus?.classList.contains("trial-running"), title: document.title, url: location.href, receiver: receiverText?.textContent, traffic: trafficSnapshot() })
});
