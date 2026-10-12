import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const load = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Moon Snail uses a two-row 48px movement cluster without changing input keys', async () => {
  const html = await load('games/moon-snail/index.html');
  assert.match(html, /class="dpad"/);
  assert.match(html, /\.touch \.dpad\{display:grid;grid-template-columns:repeat\(3,48px\);grid-template-rows:repeat\(2,48px\)/);
  for (const key of ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'Space']) assert.match(html, new RegExp(`data-key="${key}"`));
  assert.doesNotMatch(html, /\.touch button\{min-width:42px\}/);
});

test('Starfall exposes the configured flare cost in visible and accessible state', async () => {
  const [html, js] = await Promise.all([load('games/starfall/index.html'), load('games/starfall/game.js')]);
  assert.match(html, /id="flareStatus">COST 18 LIGHT/);
  assert.match(js, /const flareCost = simulation\.config\.flareCost/);
  assert.match(js, /`NEED \$\{flareCost\} LIGHT`/);
  assert.match(js, /`COST \$\{flareCost\} LIGHT`/);
  assert.match(js, /setAttribute\("aria-label", flareLabel\)/);
});

test('Dungeon Reset forecasts selected work against the door timer', async () => {
  const [js, css] = await Promise.all([load('games/dungeon-reset/game.js'), load('games/dungeon-reset/style.css')]);
  assert.match(js, /function workEstimate\(e\)/);
  assert.match(js, /e\.seconds\*\(1-progress\)/);
  assert.match(js, /RETURN FIRST/);
  assert.match(js, /warning:seconds>door/);
  assert.match(js, /workEstimateElement\.classList\.toggle\('warning'/);
  assert.match(css, /\.work-estimate\.warning\{color:var\(--red\)\}/);
});

test('Brain in a Jar exposes hidden and motor biases through the parameter editor', async () => {
  const html = await load('games/brain-in-a-jar/index.html');
  assert.match(html, /const biasData = \[0,1,2,3\].*layer:'hb'/s);
  assert.match(html, /concat\(\[0,1\].*layer:'ob'/s);
  assert.match(html, /const parameterData = \[\.\.\.edgeData, \.\.\.biasData\]/);
  assert.match(html, /setBias:\(layer,to,value\)/);
  assert.match(html, /state\.weights\[parameter\.layer\]\[parameter\.to\]=next/);
  assert.match(html, /All controller parameters - select to edit/);
});

test('Scribble recipe content edits have a bounded one-step undo', async () => {
  const html = await load('games/scribble-engine/index.html');
  assert.match(html, /id="undoRecipeEdit"[^>]*disabled>Undo content edit/);
  assert.match(html, /let recipeUndo = null/);
  assert.match(html, /function undoRecipeEdit\(\)/);
  assert.match(html, /recipeUndo = \{ program: cloneRecipe\(recipeProgram\), section: selectedRecipeSection, stage: selectedRecipeStage \}/);
  assert.match(html, /commitRecipe\(preset, `\$\{preset\.name\} loaded`, 0, 0\)/);
  assert.match(html, /controls\.undoRecipeEdit\.disabled = !recipeUndo/);
});

test('Traffic snapshots an adjustable brake pulse for each intervention', async () => {
  const html = await load('games/traffic-with-no-excuse/index.html');
  assert.match(html, /id="brakePulse" type="range" min="0\.5" max="4" step="0\.1" value="2"/);
  assert.match(html, /pulse: 2/);
  assert.match(html, /intervention = \{ carId, remaining: params\.pulse \}/);
  assert.match(html, /'brakePulse', 'brakePulseValue', 'pulse'/);
});

test('Jelly Bench exposes pause and resume without resetting the simulation', async () => {
  const html = await load('games/jelly-bench/index.html');
  assert.match(html, /id="toggleMotion"[^>]*aria-pressed="false">Pause Motion/);
  assert.match(html, /function setPaused\(value\)/);
  assert.match(html, /button\.textContent = paused \? "Resume Motion" : "Pause Motion"/);
  assert.match(html, /settings: \{ \.\.\.settings \}, view: \{ \.\.\.view \}, activePreset, paused/);
});

test('Mirror Mischief keeps one undo snapshot per completed change', async () => {
  const html = await load('games/mirror-mischief/index.html');
  assert.match(html, /id="undo"[^>]*disabled>Undo Last Change/);
  assert.match(html, /function undoLastChange\(\)/);
  assert.match(html, /if\(drag\.moved\)rememberTable\(drag\.before\)/);
  assert.match(html, /ui\.reset\.addEventListener\('click',\(\)=>reset\(true\)\)/);
  assert.match(html, /canUndo: \(\) => Boolean\(undoState\)/);
});
