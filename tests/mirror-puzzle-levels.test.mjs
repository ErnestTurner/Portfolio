import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../games/mirror-mischief/index.html', import.meta.url), 'utf8');
const source = html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];

class FakeElement {
  constructor(id = '') {
    this.id = id; this.hidden = false; this.disabled = false; this.value = '0'; this.textContent = '';
    this.dataset = {}; this.children = []; this.style = {};
    this.classList = { toggle() {}, add() {}, remove() {} };
  }
  addEventListener() {}
  setAttribute(name, value) { this[name] = String(value); }
  removeAttribute(name) { delete this[name]; }
  replaceChildren(...children) { this.children = children; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 900, height: 600 }; }
  getContext() {
    const gradient = { addColorStop() {} };
    return new Proxy({}, { get(target, key) { if (key === 'createLinearGradient') return () => gradient; return target[key] ?? (() => {}); }, set(target, key, value) { target[key] = value; return true; } });
  }
  setPointerCapture() {}
}

function bootGame() {
  const elements = new Map();
  const get = selector => {
    const id = selector.startsWith('#') ? selector.slice(1) : selector;
    if (!elements.has(id)) elements.set(id, new FakeElement(id));
    return elements.get(id);
  };
  const add = ['mirror', 'splitter', 'blocker', 'receiver'].map(type => { const element = new FakeElement(); element.dataset.add = type; return element; });
  const sandboxOnly = [new FakeElement()];
  const document = {
    querySelector: get,
    querySelectorAll: selector => selector === '[data-add]' ? add : (selector === '.sandbox-only' ? sandboxOnly : []),
    createElement: () => new FakeElement()
  };
  const storage = new Map();
  const window = { devicePixelRatio: 1, addEventListener() {} };
  const context = vm.createContext({
    window, document, structuredClone, console,
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    ResizeObserver: class { observe() {} }
  });
  new vm.Script(source, { filename: 'mirror-mischief/index.html' }).runInContext(context);
  return { api: window.__mirrorMischiefTest, elements, storage };
}

test('Mirror keeps Sandbox and defines three ordered, bounded puzzle scenes', () => {
  assert.match(html, /id="sandboxMode"[^>]*aria-pressed="true"/);
  assert.match(html, /id="puzzleMode"[^>]*aria-pressed="false"/);
  const { api } = bootGame();
  const puzzles = JSON.parse(JSON.stringify(api.puzzles()));
  assert.deepEqual(puzzles.map(level => level.id), ['single-reflection', 'reflection-chain', 'split-balance']);
  assert.deepEqual(puzzles.map(level => level.supply), [{ mirror: 1 }, { mirror: 2 }, { splitter: 1 }]);
  for (const level of puzzles) {
    assert.ok(level.pieces.some(piece => piece.locked), `${level.id} has fixed pieces`);
    assert.ok(level.pieces.some(piece => !piece.locked), `${level.id} has an interactive piece`);
    assert.ok(level.hint.length > 10);
  }
});

test('Each authored solution reaches its deterministic receiver-power goal', () => {
  const { api } = bootGame();
  for (const [index, puzzle] of api.puzzles().entries()) {
    api.loadLevel(index);
    assert.equal(api.goal().complete, false, `${puzzle.id} does not begin solved`);
    for (const [id, angle] of Object.entries(puzzle.solution)) assert.equal(api.setPieceAngle(Number(id), angle), true);
    const goal = api.goal();
    assert.equal(goal.complete, true, `${puzzle.id} solution completes`);
    assert.ok(goal.readings.every(reading => reading.power >= reading.min && reading.power <= reading.max));
    assert.equal(api.snapshot().limited, false, `${puzzle.id} stays inside trace limits`);
  }
});

test('Puzzle undo and reset return a solved level to its authored unsolved state', () => {
  const { api } = bootGame();
  const puzzle = api.puzzles()[0];
  api.loadLevel(0);
  api.setPieceAngle(2, puzzle.solution[2]);
  assert.equal(api.goal().complete, true);
  assert.equal(api.canUndo(), true);
  assert.equal(api.undo(), true);
  assert.equal(api.goal().complete, false);
  api.setPieceAngle(2, puzzle.solution[2]);
  api.reset();
  assert.equal(api.goal().complete, false);
});

test('Completion persists locally and unlocks the next numbered level', () => {
  const { api, elements, storage } = bootGame();
  api.loadLevel(0);
  api.setPieceAngle(2, -45);
  assert.ok(JSON.parse(storage.get('mirror-mischief-puzzles')).includes('single-reflection'));
  assert.equal(api.mode().completed.includes('single-reflection'), true);
  assert.equal(elements.get('levelNav').children[1].disabled, false);
  assert.equal(elements.get('nextPuzzle').hidden, false);
  assert.equal(elements.get('nextPuzzle').textContent, 'Next Puzzle: Around the Block');
});

test('The puzzle card offers direct progression only after solving', () => {
  const { api, elements } = bootGame();
  api.loadLevel(0);
  assert.equal(elements.get('nextPuzzle').hidden, true);
  api.setPieceAngle(2, -45);
  assert.equal(elements.get('nextPuzzle').hidden, false);
  assert.match(html, /ui\.nextPuzzle\.addEventListener\('click',\(\)=>loadLevel\(levelIndex \+ 1\)\)/);
});
