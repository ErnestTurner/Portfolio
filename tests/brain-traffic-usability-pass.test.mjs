import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const load = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Brain in a Jar can restore only the selected experimental parameter', async () => {
  const html = await load('games/brain-in-a-jar/index.html');
  assert.match(html, /id="restore-selected"[^>]*>Restore selected parameter/);
  assert.match(html, /const originalValueOf = parameter/);
  assert.match(html, /original\[parameter\.layer\]\[parameter\.to\]\[parameter\.from\]/);
  assert.match(html, /#restore-selected'\)\.addEventListener\('click',\(\)=>setSelectedWeight\(originalValueOf\(state\.selected\)\)\)/);
});

test('Traffic reports the exact car and snapshotted brake duration after touch or keyboard input', async () => {
  const html = await load('games/traffic-with-no-excuse/index.html');
  assert.match(html, /intervention = \{ carId, remaining: params\.pulse \};[\s\S]*?intervention\.duration = params\.pulse/);
  assert.match(html, /keyboardStatusEl\.textContent = `Car \$\{carId \+ 1\} is braking for \$\{intervention\.duration\.toFixed\(1\)\} simulation seconds\.`/);
  assert.match(html, /caseDetailEl\.textContent = `Car \$\{intervention\.carId \+ 1\} is braking for \$\{intervention\.duration\.toFixed\(1\)\} simulation seconds\.`/);
});
