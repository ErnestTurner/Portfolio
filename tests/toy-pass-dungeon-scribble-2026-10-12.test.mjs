import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const load = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Dungeon Reset puts early-raid consequences on the open-doors control', async () => {
  const source = await load('games/dungeon-reset/game.js');
  assert.match(source, /const readiness=run\.readiness\(\)/);
  assert.match(source, /`OPEN NOW · \$\{readiness\}% READY →`/);
  assert.match(source, /`Open the doors now at \$\{readiness\}% readiness with \$\{Math\.ceil\(run\.time\)\} seconds remaining`/);
});

test('Scribble Engine announces reversible clear and restore actions', async () => {
  const source = await load('games/scribble-engine/index.html');
  assert.match(source, /const hadInk = hasInk;\s+clearInk\(true\);/);
  assert.match(source, /Paper cleared - Restore Clear can bring it back/);
  assert.match(source, /Paper is already clear/);
  assert.match(source, /Last cleared drawing restored/);
  assert.match(source, /id="workspaceStatus" role="status" aria-live="polite"/);
});
