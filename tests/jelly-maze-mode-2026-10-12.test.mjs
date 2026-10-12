import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../games/jelly-bench/index.html', import.meta.url), 'utf8');

function arrayConstant(name) {
  const match = html.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\n    \\]);`));
  assert.ok(match, `${name} should be present`);
  return Function(`"use strict"; return (${match[1]});`)();
}

test('Snack Maze keeps physical dragging and adds three cumulative food effects', () => {
  const foods = arrayConstant('MAZE_FOOD_DEFS');
  assert.deepEqual(foods.map(food => food.id), ['soft', 'spring', 'pressure']);

  const effects = { stiffness: 46, damping: 34, pressure: 58, restLength: 100 };
  for (const food of foods) {
    for (const [key, delta] of Object.entries(food.delta)) effects[key] += delta;
  }
  assert.deepEqual(effects, { stiffness: 28, damping: 16, pressure: 78, restLength: 116 });
  assert.match(html, /pointer\.targets = \[/);
  assert.match(html, /n\.x \+= \(desiredX - n\.x\) \* pull/);
  assert.match(html, /settings\[key\] \+= difference \* Math\.min\(1, dt \* 2\.4\)/);
  assert.match(html, /if \(key === "restLength"\) shapeChanged = true/);
});

test('Snack Maze authored route passes through every rectangular gate and reaches the exit', () => {
  const walls = arrayConstant('mazeWalls');
  const route = arrayConstant('MAZE_ROUTE');
  assert.equal(walls.length, 6);
  assert.ok(route.length >= 8);

  for (const point of route) {
    assert.equal(walls.some(wall => point.x > wall.x && point.x < wall.x + wall.w && point.y > wall.y && point.y < wall.y + wall.h), false, `route point ${point.x},${point.y} is clear`);
  }

  const barriers = [286, 510, 738];
  const expectedMinimumGaps = [190, 200, 215];
  for (let i = 0; i < barriers.length; i++) {
    const pair = walls.filter(wall => wall.x === barriers[i]).sort((a, b) => a.y - b.y);
    assert.equal(pair.length, 2);
    const gap = pair[1].y - (pair[0].y + pair[0].h);
    assert.equal(gap, expectedMinimumGaps[i]);
    assert.ok(route.some(point => Math.abs(point.x - barriers[i]) < 130 && point.y > pair[0].y + pair[0].h && point.y < pair[1].y));
  }
  assert.deepEqual(route.at(-1), { x: 920, y: 335 });
  assert.match(html, /const MAZE_EXIT = \{ x: 874, y: 262, w: 102, h: 150 \}/);
});

test('Maze restart is deterministic and Sandbox state is restored on mode switch', () => {
  assert.match(html, /function restartMaze\(\) \{[\s\S]*?mazeState = createMazeState\(\);[\s\S]*?Object\.assign\(settings, DEFAULTS\);[\s\S]*?resetBlob\(\);[\s\S]*?setPaused\(false\)/);
  assert.match(html, /sandboxSnapshot = \{ settings: \{ \.\.\.settings \}, view: \{ \.\.\.view \}, activePreset \}/);
  assert.match(html, /Object\.assign\(settings, sandboxSnapshot\.settings\)/);
  assert.match(html, /colliders = \[\.\.\.sandboxPlatforms, floor, \.\.\.walls\]/);
  assert.match(html, /data-mode="sandbox" aria-pressed="true"/);
  assert.match(html, /data-mode="maze" aria-pressed="false"/);
  assert.match(html, /id="restartMaze"/);
  assert.match(html, /id="toggleMotion"[^>]*>Pause Motion/);
});

test('Maze completion requires all foods and an exit-center overlap', () => {
  assert.match(html, /mazeState\.foods\.every\(food => food\.eaten\) && center\.x >= MAZE_EXIT\.x/);
  assert.match(html, /mazeState\.completed = true/);
  assert.match(html, /Maze complete — every snack made a different jelly/);
  assert.match(html, /consumeFood,[\s\S]*?moveBlobTo: translateBlob/);
  assert.match(html, /foods: mazeState\.foods\.map\(food => \(\{ id: food\.id, eaten: food\.eaten \}\)\)/);
});

test('Maze HUD and progress badges identify the next objective', () => {
  assert.match(html, /function mazeObjective\(\)/);
  assert.match(html, /All snacks collected\. Reach the EXIT\./);
  assert.match(html, /next: \$\{label\}/);
  assert.match(html, /badge\.classList\.toggle\("next", food === nextFood\)/);
  assert.match(html, /badge\.setAttribute\("aria-current", "step"\)/);
  assert.match(html, /document\.querySelector\("#mazeHud"\)\.textContent = mazeObjective\(\)/);
});

test('Phone layout accounts for safe-area padding without changing the desktop composition', () => {
  assert.match(html, /padding-left: max\(10px, env\(safe-area-inset-left\)\)/);
  assert.match(html, /padding-right: max\(10px, env\(safe-area-inset-right\)\)/);
  assert.match(html, /\.lab-game-header > div \{ min-width: 0; \}/);
  assert.match(html, /\.lab-link \{ max-width: 100%; overflow-wrap: anywhere; \}/);
});
