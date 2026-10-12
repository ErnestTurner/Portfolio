import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../games/brain-in-a-jar/index.html', import.meta.url), 'utf8');

test('Brain in a Jar puts the live reaction and controller in one phone-first workbench', () => {
  assert.match(source, /class="panel lab-shell-panel controller-panel"/);
  assert.match(source, /@media \(max-width: 560px\)[\s\S]*?\.controller-panel \{ order: -1; \}/);
  assert.match(source, /class="mobile-observer"[\s\S]*?id="room-monitor"[\s\S]*?Reaction stays visible while you tune the brain/);
  assert.match(source, /\.mobile-observer \{[\s\S]*?position: sticky; top: 8px;/);
  assert.match(source, /class="controls global-controls"/);
});

test('a wire or editable neuron reveals nearby contextual controls', () => {
  assert.match(source, /id="parameter-editor" class="editor" hidden/);
  assert.match(source, /function selectParameter\(parameter\) \{[\s\S]*?editor\.hidden = false;[\s\S]*?editor\.scrollIntoView/);
  assert.match(source, /g\.addEventListener\('click',\(\)=>selectParameter\(e\)\)/);
  assert.match(source, /g\.addEventListener\('click',\(\)=>selectParameter\(biasParameter\)\)/);
  assert.match(source, /<details class="parameter-browser">[\s\S]*?All controller parameters - select to edit/);
});

test('controller actions report both the action and live motor result', () => {
  assert.match(source, /id="action-feedback"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(source, /const motorSummary = \(\) => `Motors: left/);
  assert.match(source, /announceAction\(`Editing \$\{parameterLabel\(parameter\)\}/);
  assert.match(source, /announceAction\(`\$\{parameterLabel\(parameter\)\} changed from/);
  assert.match(source, /Original wiring restored/);
  assert.match(source, /editor\.hidden=true;[\s\S]*?actionFeedback\.textContent='Tap a wire or neuron to inspect its effect\.'/);
});

test('existing simulation capabilities and bias editing remain available', () => {
  for (const id of ['pause', 'step', 'swap', 'reset', 'weight', 'zero', 'restore-wiring', 'room']) {
    assert.match(source, new RegExp(`id="${id}"`));
  }
  assert.match(source, /const parameterData = \[\.\.\.edgeData, \.\.\.biasData\]/);
  assert.match(source, /setBias:\(layer,to,value\)/);
  assert.match(source, /setWeight:\(layer,to,from,value\)/);
});
