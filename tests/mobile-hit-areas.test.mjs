import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = name => readFile(new URL(`../games/${name}/index.html`, import.meta.url), "utf8");

test("phone controls expose 44px hit boxes without changing desktop defaults", async () => {
  const [mirror, moon, jelly, traffic] = await Promise.all([
    read("mirror-mischief"),
    read("moon-snail"),
    read("jelly-bench"),
    read("traffic-with-no-excuse"),
  ]);

  assert.match(mirror, /@media \(max-width: 590px\)[\s\S]*?button \{ min-height: 44px; \}/);
  assert.match(mirror, /button \{[\s\S]*?padding: 9px 10px;/);

  assert.match(moon, /@media\(max-width:760px\)\{#pause\{min-height:44px\}\}/);
  assert.match(moon, /\.iconbutton\{[^}]*padding:10px 14px/);

  assert.match(jelly, /button \{\s*min-height: 38px;/);
  assert.match(jelly, /@media \(max-width: 560px\)[\s\S]*?button \{ min-height: 44px; \}/);

  assert.match(traffic, /input\[type="range"\] \{\s*width: 100%;\s*margin: 0;/);
  assert.match(traffic, /@media \(max-width: 760px\)[\s\S]*?input\[type="range"\] \{ height: 44px; \}/);
});

test("the other live toys expose their bounded iteration seams", async () => {
  const [brain, starfall, dungeon] = await Promise.all([
    read("brain-in-a-jar"),
    readFile(new URL("../games/starfall/game.js", import.meta.url), "utf8"),
    readFile(new URL("../games/dungeon-reset/game.js", import.meta.url), "utf8"),
  ]);

  assert.match(brain, /id="restore-wiring"/);
  assert.match(brain, /function restoreWiring\(\)\{ state\.weights=cloneWeights\(\);/);
  assert.match(brain, /restoreWiring,/);

  assert.match(starfall, /let touchCoach = createTouchCoach\(\);/);
  assert.match(starfall, /advanceTouchCoach\(touchCoach, dt, simulation\.state === "running"\);/);
  assert.match(starfall, /fillText\("MOVE"/);
  assert.match(starfall, /fillText\("AIM \+ FIRE"/);
  assert.match(starfall, /learnTouchCoachZone\(touchCoach, "move"\);/);
  assert.match(starfall, /learnTouchCoachZone\(touchCoach, "aim"\);/);

  assert.doesNotMatch(dungeon, /reportDelay/);
  assert.match(dungeon, /The next repair phase starts when you are ready\./);
});
