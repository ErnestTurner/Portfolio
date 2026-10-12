import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const load = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Moon Snail's touch umbrella reports soap, held, and refill state", async () => {
  const html = await load("games/moon-snail/index.html");
  assert.match(html, /function syncTouchUmbrella\(\)/);
  assert.match(html, /refilling\?'Release to refill':'Umbrella'/);
  assert.match(html, /button\.setAttribute\('aria-label',refilling/);
  assert.match(html, /button\.setAttribute\('aria-pressed',String\(game\.open\)\)/);
  assert.match(html, /button\.classList\.toggle\('refilling',refilling\)/);
  assert.match(html, /\.touch \.catch\.refilling/);
});

test("Starfall explains rejected flare requests without changing flare mechanics", async () => {
  const [script, styles] = await Promise.all([
    load("games/starfall/game.js"),
    load("games/starfall/styles.css"),
  ]);
  assert.match(script, /function requestFlare\(\)/);
  assert.match(script, /if \(simulation\.triggerFlare\(\)\) return true/);
  assert.match(script, /FLARE RECHARGING/);
  assert.match(script, /NEED \$\{simulation\.config\.flareCost\} LIGHT FOR FLARE/);
  assert.match(script, /elements\.flare\.disabled = snapshot\.state !== "running"/);
  assert.match(script, /elements\.flare\.classList\.toggle\("unavailable"/);
  assert.equal((script.match(/requestFlare\(\);/g) || []).length, 2);
  assert.match(styles, /\.flare-button\.unavailable/);
});
