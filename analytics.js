(() => {
  "use strict";

  const RELEASE = "analytics-v1";
  const DEFAULT_ENABLED = false;
  const MAX_EVENTS = 32;
  const DUPLICATE_WINDOW_MS = 2000;
  const ENGAGED_MS = 30000;
  const RECENT_INPUT_MS = 15000;
  const EVENT_NAMES = new Set([
    "preview_select", "preview_action", "experiment_open", "first_interaction",
    "engaged_30s", "game_reset", "export", "support_click", "back_to_lab",
  ]);
  const EXPERIMENTS = new Set(["site", "moon", "star", "dungeon", "brain", "scribble", "traffic", "jelly", "mirror"]);
  const SOURCES = new Set(["globe", "bench", "clipboard", "record", "game", "footer", "unknown"]);
  const FORMATS = new Set(["none", "png", "svg", "setup"]);
  const ROUTES = new Map([
    ["moon-snail", "moon"], ["starfall", "star"], ["dungeon-reset", "dungeon"],
    ["brain-in-a-jar", "brain"], ["scribble-engine", "scribble"],
    ["traffic-with-no-excuse", "traffic"], ["jelly-bench", "jelly"], ["mirror-mischief", "mirror"],
  ]);
  const GAME_CONTROLS = {
    moon: ["#start", "#catch", ".choice", "#again", "canvas"],
    star: ["#startButton", "#flareButton", "canvas"],
    dungeon: ["#start", ".task", ".secondary", "canvas"],
    brain: ["#step", "#swap", "#weight", ".light", ".wire", "canvas"],
    scribble: ["#penToggle", "#saveCheckpoint", "#restoreCheckpoint", "#clear", "#restoreClear", "#reset", ".control input", ".control select", "canvas"],
    traffic: ["#restart", ".controls input", "canvas"],
    jelly: ["#presets button", ".control input", "canvas"],
    mirror: ["#addMirror", "#addSplitter", "#addBlocker", "#addReceiver", "#rotateMinus", "#rotatePlus", "#delete", "canvas"],
  };
  const RESET_CONTROLS = {
    brain: ["#reset"], scribble: ["#reset", "#clear"], traffic: ["#reset", "#restart"],
    jelly: ["#resetBlob", "#resetAll"], mirror: ["#reset"], moon: ["#again"],
  };
  const EXPORT_CONTROLS = {
    "#downloadPng": "png", "#downloadSvg": "svg", "#downloadSetup": "setup",
  };

  const context = location.hostname === "trikzik.com" || location.hostname === "www.trikzik.com"
    ? "production"
    : location.hostname.endsWith("pages.dev") ? "preview" : "test";
  const testOptions = window.__TRIKZIK_ANALYTICS_TEST__ === true || typeof window.__TRIKZIK_ANALYTICS_TEST__ === "object"
    ? window.__TRIKZIK_ANALYTICS_TEST__
    : null;
  let enabled = DEFAULT_ENABLED;
  let adapter = null;
  let eventCount = 0;
  let lastInputAt = 0;
  let activeMs = 0;
  let engagedTimer = null;
  const sentOnce = new Set();
  const recent = new Map();

  function experimentFromPath(pathname = location.pathname) {
    const segment = pathname.split("/").filter(Boolean).pop();
    return ROUTES.get(segment) || "site";
  }

  function experimentFromHref(href) {
    try { return experimentFromPath(new URL(href, location.href).pathname); }
    catch { return "site"; }
  }

  function validPayload(payload) {
    return payload && EVENT_NAMES.has(payload.event) && EXPERIMENTS.has(payload.experiment)
      && SOURCES.has(payload.source) && FORMATS.has(payload.format)
      && ["production", "preview", "test"].includes(payload.context)
      && payload.release === RELEASE;
  }

  function networkAdapter(payload) {
    return fetch("/api/events", {
      method: "POST",
      credentials: "omit",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => undefined);
  }

  function track(event, details = {}, options = {}) {
    if (!enabled || eventCount >= MAX_EVENTS) return false;
    const payload = {
      event,
      experiment: details.experiment || "site",
      source: details.source || "unknown",
      format: details.format || "none",
      context,
      release: RELEASE,
    };
    if (!validPayload(payload)) return false;
    const onceKey = options.onceKey;
    if (onceKey && sentOnce.has(onceKey)) return false;
    const duplicateKey = `${event}:${payload.experiment}:${payload.source}:${payload.format}`;
    const now = Date.now();
    if (!options.allowRepeat && now - (recent.get(duplicateKey) || 0) < DUPLICATE_WINDOW_MS) return false;
    if (onceKey) sentOnce.add(onceKey);
    recent.set(duplicateKey, now);
    eventCount += 1;
    (adapter || networkAdapter)(payload);
    return true;
  }

  function markInteraction(experiment, source = "game") {
    lastInputAt = Date.now();
    track("first_interaction", { experiment, source }, { onceKey: `first:${experiment}` });
    if (engagedTimer) return;
    const intervalMs = testOptions && typeof testOptions === "object" && testOptions.intervalMs ? testOptions.intervalMs : 1000;
    const engagedMs = testOptions && typeof testOptions === "object" && testOptions.engagedMs ? testOptions.engagedMs : ENGAGED_MS;
    engagedTimer = window.setInterval(() => {
      if (document.visibilityState === "visible" && document.hasFocus() && Date.now() - lastInputAt <= RECENT_INPUT_MS) activeMs += intervalMs;
      if (activeMs >= engagedMs) {
        track("engaged_30s", { experiment, source }, { onceKey: `engaged:${experiment}` });
        clearInterval(engagedTimer);
        engagedTimer = null;
      }
    }, intervalMs);
  }

  function sourceForLink(anchor) {
    if (anchor.closest(".bench-preview")) return "bench";
    if (anchor.closest(".clipboard-list")) return "clipboard";
    if (anchor.closest("#work")) return "record";
    return "unknown";
  }

  function bind(selector, eventName, handler) {
    document.querySelectorAll(selector).forEach(node => node.addEventListener(eventName, handler, { passive: true }));
  }

  function setupHomepage() {
    bind(".globe-marker[data-experiment]", "click", event => track("preview_select", {
      experiment: event.currentTarget.dataset.experiment,
      source: "globe",
    }));
    bind("#poke-planet", "click", () => {
      const selected = document.querySelector('.globe-marker[aria-pressed="true"]')?.dataset.experiment;
      if (selected) track("preview_action", { experiment: selected, source: "globe" });
    });
    bind('a[href*="games/"]', "click", event => {
      const anchor = event.currentTarget;
      const experiment = experimentFromHref(anchor.href);
      if (experiment !== "site") track("experiment_open", { experiment, source: sourceForLink(anchor) });
    });
    bind(".support-link", "click", () => track("support_click", { experiment: "site", source: "footer" }, { onceKey: "support" }));
  }

  function setupGame(experiment) {
    bind(".lab-back-link", "click", () => track("back_to_lab", { experiment, source: "game" }, { onceKey: `back:${experiment}` }));
    (GAME_CONTROLS[experiment] || []).forEach(selector => {
      bind(selector, "pointerdown", () => markInteraction(experiment));
      bind(selector, "change", () => markInteraction(experiment));
      bind(selector, "click", () => markInteraction(experiment));
    });
    (RESET_CONTROLS[experiment] || []).forEach(selector => bind(selector, "click", () => {
      markInteraction(experiment);
      track("game_reset", { experiment, source: "game" }, { allowRepeat: true });
    }));
    if (experiment === "scribble") {
      Object.entries(EXPORT_CONTROLS).forEach(([selector, format]) => bind(selector, "click", () => {
        markInteraction(experiment);
        track("export", { experiment, source: "game", format }, { allowRepeat: true });
      }));
    }
  }

  function setup() {
    const experiment = experimentFromPath();
    if (experiment === "site") setupHomepage(); else setupGame(experiment);
  }

  if (testOptions) {
    window.TrikzikAnalyticsTest = Object.freeze({
      enable(testAdapter) { enabled = true; adapter = testAdapter; },
      disable() { enabled = false; adapter = null; },
      track,
      markInteraction,
      state() { return { enabled, eventCount, context, release: RELEASE }; },
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();
