const surpriseButton = document.querySelector("#surprise-experiment");

const experimentRoutes = [
  "games/moon-snail/index.html",
  "games/starfall/index.html",
  "games/dungeon-reset/index.html",
  "games/brain-in-a-jar/index.html",
  "games/scribble-engine/index.html",
  "games/traffic-with-no-excuse/index.html",
  "games/jelly-bench/index.html",
  "games/mirror-mischief/index.html",
];

surpriseButton?.addEventListener("click", () => {
  const destination = experimentRoutes[Math.floor(Math.random() * experimentRoutes.length)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  surpriseButton.disabled = true;
  surpriseButton.setAttribute("aria-busy", "true");
  surpriseButton.classList.add("launched");

  window.setTimeout(() => window.location.assign(destination), reduceMotion ? 0 : 550);
});
