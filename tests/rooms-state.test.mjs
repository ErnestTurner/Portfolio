import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY, ROOM_IDS, initialState, cleanArt, validateState,
  rewoundState, readState, writeState,
} from '../rooms/state.js';

const artwork = () => ({ stamp: 'sprout', strokes: [[[12, 23], [87, 65]], [[306, 210], [598, 329]]] });

function memoryStorage(entries = []) {
  const values = new Map(entries);
  const calls = [];
  return {
    values, calls,
    getItem(key) { calls.push(['getItem', key]); return values.get(key) ?? null; },
    setItem(key, value) { calls.push(['setItem', key]); values.set(key, value); },
    removeItem(key) { calls.push(['removeItem', key]); values.delete(key); },
    clear() { calls.push(['clear']); values.clear(); },
  };
}

test('malformed stored JSON falls back to a fresh safe room state', () => {
  for (const stored of ['{', 'undefined', '<script>bad()</script>']) {
    const storage = memoryStorage([[STORAGE_KEY, stored]]);
    assert.deepEqual(readState(storage), { state: initialState(), saved: false });
    assert.deepEqual(storage.calls, [['getItem', STORAGE_KEY]]);
    assert.equal(storage.values.get(STORAGE_KEY), stored, 'reading does not overwrite malformed data');
  }
  for (const raw of [null, false, 8, 'not a state', []]) {
    assert.deepEqual(validateState(raw), initialState());
  }
});

test('stored data cannot add routes, prototype keys, markup, or arbitrary fields', () => {
  const raw = JSON.parse('{"__proto__":{"polluted":true},"constructor":"bad","visited":["hall","hall","portal","constructor","../../games","<img onerror=bad()>"],"lightRoute":"<svg onload=bad()>","draft":{"stamp":"<script>bad()</script>","strokes":["not a stroke",[[1,2],["3",4],[5,6,7],[null,8],[9,10]]]},"portalGift":"true","exhibited":1,"paused":{}}');
  const result = validateState(raw);
  assert.deepEqual(result.visited, ['hall', 'portal']);
  assert.ok(result.visited.every(id => ROOM_IDS.includes(id)));
  assert.equal(result.lightRoute, 'amber');
  assert.deepEqual(result.draft, { stamp: 'orbit', strokes: [[[1, 2], [9, 10]]] });
  assert.equal(result.portalGift, false);
  assert.equal(result.exhibited, false);
  assert.equal(result.paused, false);
  assert.equal(Object.hasOwn(result, '__proto__'), false);
  assert.equal(Object.hasOwn(result, 'constructor'), false);
  assert.equal(Object.prototype.polluted, undefined);
  assert.deepEqual(Object.keys(result).sort(), Object.keys(initialState()).sort());
});

test('room quantities are finite, bounded, and discrete where required', () => {
  const high = validateState({ rain: 100000, clouds: 100000, plant: 100000, lamp: 100000 });
  const low = validateState({ rain: -100, clouds: -100, plant: -100, lamp: -100 });
  assert.deepEqual([high.rain, high.clouds, high.plant, high.lamp], [100, 3, 2, 100]);
  assert.deepEqual([low.rain, low.clouds, low.plant, low.lamp], [0, 0, 0, 0]);
  const fractional = validateState({ clouds: 1.6, plant: 1.2 });
  assert.deepEqual([fractional.clouds, fractional.plant], [2, 1]);
  for (const bad of [NaN, Infinity, -Infinity, '90', null, {}, []]) {
    const value = validateState({ rain: bad, clouds: bad, plant: bad, lamp: bad });
    assert.deepEqual([value.rain, value.clouds, value.plant, value.lamp], [0, 1, 0, 50]);
  }
});

test('artwork sanitization bounds point coordinates and rejects malformed points', () => {
  const art = cleanArt({ stamp: 'spark', strokes: [
    [[-20, -30], [601, 331], [300.5, 123.5], [Infinity, 1], [2, NaN], [1], [1, 2, 3], ['1', 2], null],
    false,
  ] });
  assert.deepEqual(art, { stamp: 'spark', strokes: [[[0, 0], [600, 330], [300.5, 123.5]]] });
  assert.deepEqual(cleanArt(null), { stamp: 'orbit', strokes: [] });
});

test('oversized stored drawings have bounded rendering cost', () => {
  const raw = { stamp: 'orbit', strokes: Array.from({ length: 45 }, () => Array.from({ length: 400 }, (_, i) => [i, i])) };
  const art = cleanArt(raw);
  assert.equal(art.strokes.length, 30);
  assert.ok(art.strokes.every(stroke => stroke.length === 250));
  assert.ok(art.strokes.flat().every(([x, y]) => x >= 0 && x <= 600 && y >= 0 && y <= 330));
  assert.equal(raw.strokes.length, 45, 'normalization does not trim the caller’s drawing');
  assert.equal(raw.strokes[0].length, 400);
});

test('draft and museum artwork are independent deep copies of their inputs', () => {
  const original = artwork();
  const cleaned = cleanArt(original);
  const state = validateState({ draft: original, art: original, exhibited: true });
  original.strokes[0][0][0] = 500;
  original.strokes.push([[1, 2]]);
  assert.equal(cleaned.strokes[0][0][0], 12);
  assert.equal(state.draft.strokes[0][0][0], 12);
  assert.equal(state.art.strokes[0][0][0], 12);
  state.draft.strokes[0][0][1] = 200;
  assert.equal(state.art.strokes[0][0][1], 23, 'editing draft cannot change the delivered exhibit');
  assert.equal(cleaned.strokes.length, 2);
  assert.equal(state.art.strokes.length, 2);
});

test('rewind resets room consequences while retaining original and exhibited artwork and motion choice', () => {
  const before = validateState({
    visited: [...ROOM_IDS], rain: 85, hallWater: 85, gardenDrained: true, clouds: 3, plant: 2, portalGift: true,
    lamp: 91, lightRoute: 'blue', draft: artwork(),
    art: { stamp: 'spark', strokes: [[[45, 67], [89, 100]]] }, exhibited: true, paused: true,
  });
  const snapshot = structuredClone(before);
  const after = rewoundState(before);
  assert.deepEqual(after, { ...initialState(), draft: snapshot.draft, art: snapshot.art, exhibited: true, paused: true });
  assert.deepEqual(before, snapshot, 'rewind must not mutate the previous room state');
  after.draft.strokes[0][0][0] = 400;
  after.art.strokes[0][0][0] = 400;
  assert.deepEqual(before, snapshot, 'rewound artwork must not alias its preserved source');
  assert.deepEqual(rewoundState(initialState()), initialState());
});

test('blocked, absent, or full browser storage fails without destroying in-memory work', () => {
  const denied = {
    getItem() { throw new Error('SecurityError'); },
    setItem() { throw new Error('QuotaExceededError'); },
  };
  const state = { ...initialState(), draft: artwork(), exhibited: true, art: artwork() };
  const snapshot = structuredClone(state);
  for (const storage of [undefined, null, denied]) {
    assert.deepEqual(readState(storage), { state: initialState(), saved: false });
    assert.equal(writeState(storage, state), false);
    assert.deepEqual(state, snapshot);
  }
});

test('saving, loading, and rewinding use only the preview namespace and preserve game saves', () => {
  const gameEntries = [
    ['trikzik:selected-experiment', 'jelly'],
    ['mirror-mischief:puzzles', '{"completed":[0,1]}'],
    ['dungeon-reset:best', '7408'],
    ['a-game-drawing', '{"strokes":[[1,2]]}'],
  ];
  const storage = memoryStorage(gameEntries);
  const original = { ...initialState(), rain: 80, portalGift: true, draft: artwork(), art: artwork(), exhibited: true };
  assert.equal(writeState(storage, original), true);
  const loaded = readState(storage);
  assert.equal(loaded.saved, true);
  assert.deepEqual(loaded.state, original);
  assert.equal(writeState(storage, rewoundState(loaded.state)), true);
  assert.deepEqual(readState(storage).state.art, original.art);
  assert.deepEqual([...storage.values].filter(([key]) => key !== STORAGE_KEY), gameEntries);
  assert.ok(storage.calls.every(([method, key]) => ['getItem', 'setItem'].includes(method) && key === STORAGE_KEY));
});

test('new initial states and missing-storage loads never share mutable drawings or visit lists', () => {
  const first = initialState();
  const next = initialState();
  first.visited.push('portal');
  first.draft.strokes.push([[1, 2]]);
  first.art.strokes.push([[3, 4]]);
  assert.deepEqual(next, initialState());
  const storage = memoryStorage();
  const one = readState(storage);
  const two = readState(storage);
  one.state.draft.strokes.push([[5, 6]]);
  assert.deepEqual(two, { state: initialState(), saved: true });
});
