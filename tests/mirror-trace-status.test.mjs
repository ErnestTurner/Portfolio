import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../games/mirror-mischief/index.html", import.meta.url), "utf8");

test("Mirror starts with an empty trace status separate from the piece count", () => {
  assert.match(html, /<div id="traceLimit" class="status-pill" role="status"><\/div>/);
  assert.match(html, /ui\.count\.textContent=`\$\{placed\} of \$\{MAX_PIECES\} pieces`/);
  assert.match(html, /ui\.limitNote\.textContent=atLimit\?'Table full':''/);
});

test("Mirror announces only genuine ray depth or segment safety limits", () => {
  assert.match(html, /ray\.depth >= MAX_INTERACTIONS\) \{ limited = true; continue; \}/);
  assert.match(html, /segments\.length >= MAX_SEGMENTS\) \{ limited = true; break; \}/);
  assert.match(html, /ui\.traceLimit\.textContent=trace\.limited\?'Ray trace safety limit reached':''/);
  assert.match(html, /ui\.traceLimit\.classList\.toggle\('visible', trace\.limited\)/);
});
