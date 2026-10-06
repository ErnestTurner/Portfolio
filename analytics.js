(() => {
  "use strict";

  const RELEASE = "analytics-v2";
  const MAX_EVENTS = 16;
  const DUPLICATE_WINDOW_MS = 2000;
  const EVENT_NAMES = new Set([
    "specimen_select", "experiment_open", "first_interaction",
    "export", "share", "support_click",
  ]);
  const EXPERIMENTS = new Set(["site", "moon", "star", "dungeon", "brain", "scribble", "traffic", "jelly", "mirror"]);
  const SOURCES = new Set(["selector", "game", "footer"]);
  const FORMATS = new Set(["none", "png", "svg", "setup", "replay"]);
  const ROUTES = new Map([
    ["moon-snail", "moon"], ["starfall", "star"], ["dungeon-reset", "dungeon"],
    ["brain-in-a-jar", "brain"], ["scribble-engine", "scribble"],
    ["traffic-with-no-excuse", "traffic"], ["jelly-bench", "jelly"], ["mirror-mischief", "mirror"],
  ]);
  const EXPORT_CONTROLS = {
    "#downloadPng": "png", "#downloadSvg": "svg", "#downloadSetup": "setup",
  };

  const context = location.hostname === "trikzik.com" || location.hostname === "www.trikzik.com"
    ? "production"
    : location.hostname.endsWith("pages.dev") ? "preview" : "test";
  const testOptions = window.__TRIKZIK_ANALYTICS_TEST__ === true || typeof window.__TRIKZIK_ANALYTICS_TEST__ === "object"
    ? window.__TRIKZIK_ANALYTICS_TEST__
    : null;
  let enabled = false;
  let adapter = null;
  let eventCount = 0;
  let isBound = false;
  const sentOnce = new Set();
  const recent = new Map();

  function experimentFromPath(pathname = location.pathname) {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.at(-1) === "index.html") segments.pop();
    const segment = segments.at(-1);
    return ROUTES.get(segment) || "site";
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
      source: details.source || "game",
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

  function markInteraction(experiment) {
    track("first_interaction", { experiment, source: "game" }, { onceKey: `first:${experiment}` });
  }

  function bind(selector, eventName, handler) {
    document.querySelectorAll(selector).forEach(node => node.addEventListener(eventName, handler, { passive: true }));
  }

  function setupHomepage() {
    bind(".experiment-control[data-experiment]", "click", event => track("specimen_select", {
      experiment: event.currentTarget.dataset.experiment,
      source: "selector",
    }));
    bind("#support-link", "click", () => track("support_click", {
      experiment: "site",
      source: "footer",
    }, { onceKey: "support" }));
  }

  function setupGame(experiment) {
    const interaction = () => markInteraction(experiment);
    for (const eventName of ["pointerdown", "change", "keydown"]) {
      bind("button, input, select, canvas", eventName, interaction);
    }
    if (experiment === "scribble") {
      Object.entries(EXPORT_CONTROLS).forEach(([selector, format]) => bind(selector, "click", () => {
        markInteraction(experiment);
        track("export", { experiment, source: "game", format }, { allowRepeat: true });
      }));
      bind("#copyReplay", "click", () => {
        markInteraction(experiment);
        track("share", { experiment, source: "game", format: "replay" }, { allowRepeat: true });
      });
    }
  }

  function setup() {
    if (isBound) return;
    isBound = true;
    const experiment = experimentFromPath();
    if (experiment === "site") setupHomepage();
    else setupGame(experiment);
  }

  function activate() {
    if (enabled) return;
    enabled = true;
    const experiment = experimentFromPath();
    if (experiment !== "site") {
      track("experiment_open", { experiment, source: "game" }, { onceKey: `open:${experiment}` });
    }
  }

  async function loadConfiguration() {
    if (testOptions || !["production", "preview"].includes(context)) return;
    try {
      const response = await fetch("/api/events", {
        method: "GET",
        credentials: "omit",
        cache: "no-store",
        headers: { accept: "application/json" },
      });
      if (!response.ok) return;
      const configuration = await response.json();
      if (configuration && configuration.enabled === true && configuration.release === RELEASE) activate();
    } catch {
      // Analytics is optional: configuration or quota failures must never affect a toy.
    }
  }

  if (testOptions) {
    window.TrikzikAnalyticsTest = Object.freeze({
      enable(testAdapter) { adapter = testAdapter; activate(); },
      disable() { enabled = false; adapter = null; },
      track,
      markInteraction,
      state() { return { enabled, eventCount, context, release: RELEASE }; },
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
  loadConfiguration();
})();
