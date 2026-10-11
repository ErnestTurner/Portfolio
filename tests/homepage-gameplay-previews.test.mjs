import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const names = ["moon-snail", "starfall", "dungeon-reset", "brain-in-a-jar", "scribble-engine", "traffic-with-no-excuse", "jelly-bench", "mirror-mischief"];

test("all eight homepage mounts reference bounded authentic gameplay captures", async () => {
  const script = await readFile(path.join(root, "surprise.js"), "utf8");
  for (const name of names) {
    const relative = `assets/gameplay-previews/${name}.jpg`;
    assert.match(script, new RegExp(relative.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    const file = await readFile(path.join(root, relative));
    const info = await stat(path.join(root, relative));
    assert.deepEqual([...file.subarray(0, 3)], [0xff, 0xd8, 0xff], `${name} must be a JPEG capture`);
    assert.ok(info.size > 10_000 && info.size < 120_000, `${name} capture should stay lightweight`);
  }
  assert.match(script, /mountGameplayPreview\(key, experiment\)/);
  assert.match(script, /No homepage simulation/);
});

test("homepage labels captures honestly and keeps gameplay in the full toys", async () => {
  const html = await readFile(path.join(root, "index.html"), "utf8");
  assert.match(html, /AUTHENTIC GAMEPLAY CAPTURE/);
  assert.match(html, /CAPTURED FROM THE ACTUAL TOYS \/ OPEN AN EXPERIMENT TO PLAY/);
  assert.doesNotMatch(html, /REPRESENTATIVE CAUSAL SKETCHES/);
  assert.doesNotMatch(html, /<(?:iframe|video)\b/i);
  for (const name of names) assert.match(html, new RegExp(`games/${name}/index\\.html`));
});
