import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile(new URL('../games/scribble-engine/index.html', import.meta.url), 'utf8');

test('mobile workspace keeps the stage and transport visible while controls use one bounded panel', () => {
  assert.match(html, /height: 100svh/);
  assert.match(html, /height: 100dvh/);
  assert.match(html, /grid-template-rows: minmax\(132px, 44dvh\) minmax\(0, 1fr\)/);
  assert.match(html, /overscroll-behavior: contain/);
  assert.match(html, /role="tablist" aria-label="Scribble controls"/);
  assert.equal((html.match(/role="tab"/g) || []).length, 4);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 4);
  assert.match(html, /data-mobile-tab="machine"/);
  assert.match(html, /data-mobile-tab="ink"/);
  assert.match(html, /data-mobile-tab="sequence"/);
  assert.match(html, /data-mobile-tab="project"/);
  assert.match(html, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(html, /min-height: 44px/);
  assert.match(html, /\(max-width: 1100px\) and \(hover: none\) and \(pointer: coarse\)/);
  assert.match(html, /function activateMobileSection/);
  assert.match(html, /event\.key === 'ArrowRight'/);
  assert.match(html, /event\.key === 'Home'/);
  assert.match(html, /document\.createElement\('details'\)/);
  assert.match(html, /selectedCueIndex = index/);
  assert.match(html, /\.cue-row\[open\] > \.cue-body/);
});

test('cue-score replay links are versioned, bounded, and backward compatible', () => {
  assert.match(html, /const REPLAY_SCHEMA = 'trikzik\.scribble-engine\.replay'/);
  assert.match(html, /const REPLAY_VERSION = 2/);
  assert.match(html, /const LEGACY_REPLAY_VERSION = 1/);
  assert.match(html, /const SETUP_VERSION = 2/);
  assert.match(html, /const LEGACY_SETUP_VERSION = 1/);
  assert.match(html, /const MAX_REPLAY_BYTES = 1024/);
  assert.match(html, /const MAX_REPLAY_TOKEN_LENGTH = 1400/);
  assert.match(html, /const MAX_REPLAY_URL_LENGTH = 2048/);
  assert.match(html, /const MIN_REPLAY_DURATION = 5/);
  assert.match(html, /const MAX_REPLAY_DURATION = 60/);
  assert.match(html, /const MAX_CUES = 6/);
  assert.match(html, /value\.version === LEGACY_REPLAY_VERSION/);
  assert.match(html, /singleCue\(setup\.state, value\.duration\)/);
  assert.match(html, /validateCues\(value\.cues, value\.duration, fail\)/);

  const capture = html.slice(html.indexOf('function captureReplayPayload'), html.indexOf('function validateReplayPayload'));
  assert.doesNotMatch(capture, /name|artwork|checkpoint|history|url|referrer|user/i);
  assert.match(capture, /machine:/);
  assert.match(capture, /ink:/);
  assert.match(capture, /paper:/);
  assert.match(capture, /cues: cloneCues\(cues\)/);
});

test('a 60-second v1 replay can play, copy to v2, download, and reimport without trimming', () => {
  const constants = html.slice(html.indexOf("const SETUP_SCHEMA"), html.indexOf('const DEFAULT_CUES'));
  const functions = html.slice(html.indexOf('function cloneCues'), html.indexOf('function encodeReplayPayload'));
  const state = {
    length1: 112, length2: 73, speed1: 47, speed2: 131,
    direction1: 1, direction2: -1, angle1: 0.25, angle2: 1.1,
    penDown: true, inkColor: '#eff5fa', lineWidth: 1.5,
    strokeStyle: 'solid', paperColor: '#0b1425', transparentPaper: false
  };
  const context = vm.createContext({ state, controls: { replayDuration: { value: '60' } }, cueScore: [] });
  vm.runInContext(`${constants}\nconst DEFAULT_CUES = [];\n${functions}\nthis.api = { cloneCues, captureSetup, validateSetupFile, captureReplayPayload, validateReplayPayload };`, context);

  const legacy = context.api.validateReplayPayload({
    schema: 'trikzik.scribble-engine.replay', version: 1, duration: 60,
    machine: {
      length1: state.length1, length2: state.length2, speed1: state.speed1, speed2: state.speed2,
      direction1: state.direction1, direction2: state.direction2, angle1: state.angle1, angle2: state.angle2, penDown: true
    },
    ink: { color: state.inkColor, width: state.lineWidth, style: state.strokeStyle },
    paper: { color: state.paperColor, transparent: state.transparentPaper }
  });
  assert.equal(legacy.duration, 60);
  assert.equal(legacy.cues.length, 1);
  assert.equal(legacy.cues[0].seconds, 60);

  context.cueScore = context.api.cloneCues(legacy.cues);
  const copiedV2 = context.api.validateReplayPayload(context.api.captureReplayPayload(60));
  assert.equal(copiedV2.version, 2);
  assert.equal(copiedV2.duration, 60);
  assert.equal(copiedV2.cues[0].seconds, 60);

  const downloaded = JSON.parse(JSON.stringify(context.api.captureSetup('Legacy sixty')));
  const reimported = context.api.validateSetupFile(downloaded);
  assert.equal(reimported.duration, 60);
  assert.equal(reimported.cues.length, 1);
  assert.equal(reimported.cues[0].seconds, 60);

  const penUpLegacy = context.api.validateReplayPayload({
    schema: 'trikzik.scribble-engine.replay', version: 1, duration: 60,
    machine: {
      length1: state.length1, length2: state.length2, speed1: state.speed1, speed2: state.speed2,
      direction1: state.direction1, direction2: state.direction2, angle1: state.angle1, angle2: state.angle2, penDown: false
    },
    ink: { color: state.inkColor, width: state.lineWidth, style: state.strokeStyle },
    paper: { color: state.paperColor, transparent: state.transparentPaper }
  });
  assert.equal(penUpLegacy.cues.length, 1);
  assert.equal(penUpLegacy.cues[0].seconds, 60);
  assert.equal(penUpLegacy.cues[0].penDown, false);
  context.state = { ...state, penDown: false };
  context.cueScore = context.api.cloneCues(penUpLegacy.cues);
  const copiedPenUp = context.api.validateReplayPayload(context.api.captureReplayPayload(60));
  assert.equal(copiedPenUp.cues[0].penDown, false);
  const penUpSetup = context.api.validateSetupFile(JSON.parse(JSON.stringify(context.api.captureSetup('Legacy pen up'))));
  assert.equal(penUpSetup.duration, 60);
  assert.equal(penUpSetup.cues[0].penDown, false);
});

test('cue-score validation is bounded and presets are authored compositions', () => {
  assert.match(html, /value\.length < 1 \|\| value\.length > MAX_CUES/);
  assert.match(html, /cue\.seconds < MIN_CUE_SECONDS \|\| cue\.seconds > MAX_CUE_SECONDS/);
  assert.match(html, /cue\.width < 0\.5 \|\| cue\.width > 8/);
  assert.match(html, /const MAX_CUE_SECONDS = MAX_REPLAY_DURATION/);
  assert.match(html, /cueSeconds\(cues\) > duration/);
  assert.match(html, /cues\.some\(cue => cue\.penDown\)/);
  assert.match(html, /'neon-bloom'/);
  assert.match(html, /'solar-weave'/);
  assert.match(html, /'ghost-garden'/);

  const presets = html.slice(html.indexOf('const SCORE_PRESETS'), html.indexOf('const RECIPE_SCHEMA'));
  assert.equal((presets.match(/penDown: false/g) || []).length, 6);
  for (const color of ['#b4f7a7', '#a2c8ff', '#ffafcc', '#ffd166', '#ff6b6b', '#fff1d0', '#eff5fa']) {
    assert.match(presets, new RegExp(color));
  }
});

test('recipe files are versioned, bounded, declarative programs with compiled execution limits', () => {
  const source = html.slice(html.indexOf("const RECIPE_SCHEMA"), html.indexOf('function cueSeconds'));
  const context = vm.createContext({});
  vm.runInContext(`const REPLAY_STEPS_PER_SECOND = 360;\n${source}\nthis.api = { RECIPE_EXAMPLES, cloneRecipe, validateRecipe, compileRecipe, motifSeconds };`, context);
  const api = context.api;
  const expectedOperations = { 'orbit-rosette': 8, 'lantern-shift': 48, 'twin-comets': 24 };
  const signatures = new Set();
  for (const [key, sourceRecipe] of Object.entries(api.RECIPE_EXAMPLES)) {
    const recipe = api.validateRecipe(api.cloneRecipe(sourceRecipe));
    const compiled = api.compileRecipe(recipe);
    assert.equal(compiled.operations.length, expectedOperations[key]);
    assert.ok(compiled.totalSteps <= 120000);
    assert.deepEqual(JSON.parse(JSON.stringify(api.validateRecipe(JSON.parse(JSON.stringify(recipe))))), JSON.parse(JSON.stringify(recipe)));
    signatures.add(recipe.sections.flatMap(section => section.stages.map(stage => `${stage.length1}/${stage.length2}/${stage.speed1}/${stage.speed2}/${stage.offset}/${stage.mode}`)).join('|'));
  }
  assert.equal(signatures.size, 3, 'examples must vary geometry, not only ink');
  assert.equal(api.motifSeconds({ speed1: 105, speed2: -75, amount: 1 }), 24);
  assert.equal(api.motifSeconds({ speed1: 0, speed2: 90, amount: 2 }), 8);
  assert.throws(() => api.motifSeconds({ speed1: 0, speed2: 0, amount: 1 }), /at least one moving arm/);

  const tooMany = api.cloneRecipe(api.RECIPE_EXAMPLES['lantern-shift']);
  tooMany.sections = Array.from({ length: 2 }, (_, index) => ({ ...api.cloneRecipe(tooMany.sections[0]), name: `Section ${index + 1}`, repeats: 32, stages: Array.from({ length: 12 }, () => ({ ...api.cloneRecipe(tooMany.sections[0].stages[0]), amount: 0.5 })) }));
  assert.throws(() => api.validateRecipe(tooMany), /expansion exceeds 512 operations/);
  assert.doesNotMatch(source, /\beval\s*\(|new Function/);
});

test('recipe playback uses a cursor, breaks transitions, and preserves legacy link versions', () => {
  assert.match(html, /const RECIPE_VERSION = 1/);
  assert.match(html, /const MAX_RECIPE_FILE_BYTES = 128 \* 1024/);
  assert.match(html, /const MAX_RECIPE_LINK_BYTES = 2048/);
  assert.match(html, /const MAX_RECIPE_OPERATIONS = 512/);
  assert.match(html, /const MAX_RECIPE_STEPS = 120000/);
  assert.match(html, /recipeSession\.operationIndex/);
  assert.match(html, /while \(index \+ 1 < operations\.length/);
  const boundary = html.slice(html.indexOf('function applyRecipeOperationForStep'), html.indexOf('function recipeStep'));
  assert.match(boundary, /breakStroke\(\)/);
  assert.doesNotMatch(boundary, /renderRecipeEditor/);
  assert.match(html, /operation\.stepSeconds/);
  assert.match(html, /recipeOriginal\.playbackRate/);
  assert.match(html, /download the recipe file instead/);
  assert.match(html, /\[LEGACY_REPLAY_VERSION, REPLAY_VERSION\]/);
  assert.match(html, /value\.version === LEGACY_REPLAY_VERSION/);
});

test('complete motifs include t=0 and recipe transitions never bridge discontinuities', () => {
  const execution = html.slice(html.indexOf('function applyRecipeOperationForStep'), html.indexOf('function advanceRecipe'));
  const context = vm.createContext({});
  vm.runInContext(`
    const CENTER = { x: 300, y: 300 };
    let state = { length1: 0, length2: 0, speed1: 0, speed2: 0, direction1: 1, direction2: 1, angle1: 0, angle2: 0, inkColor: '#fff', lineWidth: .5, penDown: false };
    let previousPen = null;
    let activeStroke = false;
    const strokes = [];
    function positions(source = state) {
      const elbowX = CENTER.x + source.length1 * Math.cos(source.angle1);
      const elbowY = CENTER.y + source.length1 * Math.sin(source.angle1);
      return { elbowX, elbowY, penX: elbowX + source.length2 * Math.cos(source.angle2), penY: elbowY + source.length2 * Math.sin(source.angle2) };
    }
    function breakStroke() { previousPen = null; activeStroke = false; }
    function syncControls() {}
    function addInk(point) {
      if (!state.penDown) { breakStroke(); return; }
      if (previousPen) {
        if (!activeStroke) { strokes.push([]); activeStroke = true; }
        strokes.at(-1).push([previousPen.x, previousPen.y, point.penX, point.penY]);
      }
      previousPen = { x: point.penX, y: point.penY };
    }
    let recipeOriginal = { playbackRate: 1 };
    const motif = { name:'Closed', mode:'motif', amount:1, length1:140, length2:140, speed1:360, speed2:360, offset:0, penDown:true, color:'#ffffff', width:.5, seconds:1, steps:360, stepSeconds:1/360, endStep:360 };
    let recipeSession = { compiled:{ operations:[motif], totalSteps:360 }, completedSteps:0, operationIndex:-1, geometryCarry:0 };
    ${execution}
    while (recipeSession.completedSteps < recipeSession.compiled.totalSteps) { recipeStep(); recipeSession.completedSteps += 1; }
    const first = strokes[0][0];
    const last = strokes[0].at(-1);
    const closedGap = Math.hypot(first[0] - last[2], first[1] - last[3]);

    state.angle1 = 0; state.angle2 = 0; previousPen = null; activeStroke = false; strokes.length = 0;
    const drawA = { ...motif, name:'A', speed1:180, speed2:-90, seconds:.5, steps:180, stepSeconds:.5/180, endStep:180 };
    const move = { ...motif, name:'Move', speed1:0, speed2:0, offset:90, penDown:false, seconds:.5, steps:180, stepSeconds:.5/180, endStep:360 };
    const drawB = { ...motif, name:'B', speed1:-180, speed2:90, offset:90, seconds:.5, steps:180, stepSeconds:.5/180, endStep:540 };
    recipeSession = { compiled:{ operations:[drawA, move, drawB], totalSteps:540 }, completedSteps:0, operationIndex:-1, geometryCarry:0 };
    while (recipeSession.completedSteps < recipeSession.compiled.totalSteps) { recipeStep(); recipeSession.completedSteps += 1; }
    const jump = Math.hypot(strokes[0].at(-1)[2] - strokes[1][0][0], strokes[0].at(-1)[3] - strokes[1][0][1]);
    this.result = { closedGap, strokeCount:strokes.length, jump };
  `, context);
  assert.ok(context.result.closedGap < 1e-9, `closed motif gap was ${context.result.closedGap}`);
  assert.equal(context.result.strokeCount, 2);
  assert.ok(context.result.jump > 1, 'pen-up geometry jump must not be connected');
});

test('recipe import stops running, paused, and completed sessions before sharing the imported recipe', async () => {
  const leave = html.slice(html.indexOf('function leaveReplayForRemix'), html.indexOf('function replayCueIndexForStep'));
  const imported = html.slice(html.indexOf('async function importRecipe'), html.indexOf('async function copyRecipeLink'));
  const copied = html.slice(html.indexOf('async function copyRecipeLink'), html.indexOf('function commitRecipe'));
  const context = vm.createContext({ Blob, URL });
  const result = await vm.runInContext(`
    let replaySession = null;
    let recipeSession = null;
    let recipeProgram = { name: 'Orbit Rosette' };
    let selectedRecipeSection = 4;
    let selectedRecipeStage = 3;
    const state = { running: false };
    const controls = {
      recipeFile: { value: 'chosen.json' },
      recipeLink: { value: '', focus() {}, select() {} }
    };
    const shared = [];
    const statuses = [];
    const navigator = { clipboard: { async writeText(value) { shared.push(value); } } };
    const history = { pushState() {} };
    const document = { querySelector() { return { hidden: true }; } };
    const MAX_RECIPE_FILE_BYTES = 131072;
    const RECIPE_PARAMETER = 'recipe';
    function validateRecipe(value) { return JSON.parse(JSON.stringify(value)); }
    function renderRecipeEditor() {}
    function setReplayStatus(message) { statuses.push(message); }
    function setRecipeStatus(message) { statuses.push(message); }
    function syncControls() {}
    function breakStroke() {}
    function recipeUrlFor(recipe) { return new URL('https://example.test/?recipe=' + encodeURIComponent(recipe.name)); }
    function compileRecipe() { return { operations: [1] }; }
    ${leave}
    ${imported}
    ${copied}
    (async () => {
      const outcomes = [];
      for (const mode of ['running', 'paused', 'completed']) {
        recipeProgram = { name: 'Orbit Rosette' };
        recipeSession = { completedSteps: mode === 'completed' ? 10 : 2, compiled: { totalSteps: 10 } };
        state.running = mode === 'running';
        controls.recipeFile.value = 'chosen.json';
        const file = { size: 24, async text() { return JSON.stringify({ name: 'Twin Comets', sections: [] }); } };
        await importRecipe(file);
        await copyRecipeLink();
        outcomes.push({ mode, stopped: recipeSession === null && state.running === false, name: recipeProgram.name, section: selectedRecipeSection, stage: selectedRecipeStage, fileValue: controls.recipeFile.value, shared: shared.at(-1) });
      }
      return outcomes;
    })();
  `, context);
  for (const outcome of result) {
    assert.equal(outcome.stopped, true, `${outcome.mode} import did not stop the prior session`);
    assert.equal(outcome.name, 'Twin Comets');
    assert.equal(outcome.section, 0);
    assert.equal(outcome.stage, 0);
    assert.equal(outcome.fileValue, '');
    assert.match(outcome.shared, /Twin%20Comets/);
    assert.doesNotMatch(outcome.shared, /Orbit/);
  }
});

test('fractional motifs finish at their advertised duration at every playback rate', () => {
  const compiler = html.slice(html.indexOf('function greatestCommonDivisor'), html.indexOf('function validateRecipe'));
  const execution = html.slice(html.indexOf('function applyRecipeOperationForStep'), html.indexOf('function applyRecipe('));
  const context = vm.createContext({});
  vm.runInContext(`
    const REPLAY_STEPS_PER_SECOND = 360;
    const MAX_RECIPE_OPERATIONS = 512;
    const MAX_RECIPE_STAGE_SECONDS = 3600;
    const MAX_RECIPE_STEPS = 120000;
    const CENTER = { x: 300, y: 300 };
    let state;
    let recipeOriginal;
    let recipeSession;
    let previousPen;
    let samples;
    function positions(source = state) {
      const elbowX = CENTER.x + source.length1 * Math.cos(source.angle1);
      const elbowY = CENTER.y + source.length1 * Math.sin(source.angle1);
      return { penX: elbowX + source.length2 * Math.cos(source.angle2), penY: elbowY + source.length2 * Math.sin(source.angle2) };
    }
    function breakStroke() { previousPen = null; }
    function syncControls() {}
    function setRecipeStatus() {}
    function addInk(point) { previousPen = { x: point.penX, y: point.penY }; samples += 1; }
    ${compiler}
    ${execution}
    const stage = { name:'Fractional motif', mode:'motif', amount:1, length1:140, length2:140, speed1:359, speed2:359, offset:0, penDown:true, color:'#fff', width:.5 };
    const base = { sections:[{ name:'Many', repeats:30, stages:Array.from({ length:10 }, () => ({ ...stage })) }] };
    function run(rate, chunked = false) {
      recipeOriginal = { ...base, playbackRate:rate };
      const compiled = compileRecipe(recipeOriginal);
      recipeSession = { compiled, completedSteps:0, operationIndex:-1, geometryCarry:0 };
      state = { length1:0, length2:0, speed1:0, speed2:0, direction1:1, direction2:1, angle1:0, angle2:0, inkColor:'#fff', lineWidth:.5, penDown:false, running:true };
      previousPen = null;
      samples = 0;
      if (chunked) {
        let remaining = compiled.wallSeconds;
        while (remaining > 0) {
          const elapsed = Math.min(.05, remaining);
          advanceRecipe(elapsed);
          remaining -= elapsed;
        }
      } else {
        advanceRecipe(compiled.wallSeconds);
      }
      return { completed:recipeSession.completedSteps, total:compiled.totalSteps, samples, wall:compiled.wallSeconds, angle1:state.angle1, angle2:state.angle2 };
    }
    this.result = { slow:run(.25), slowChunked:run(.25, true), fast:run(4) };
  `, context);
  const { slow, slowChunked, fast } = context.result;
  assert.equal(slow.completed, slow.total);
  assert.equal(slowChunked.completed, slowChunked.total);
  assert.equal(fast.completed, fast.total);
  assert.equal(slow.samples, slow.total);
  assert.equal(slowChunked.samples, slowChunked.total);
  assert.equal(fast.samples, fast.total);
  assert.ok(Math.abs(slow.wall - 1203.342618384401) < 1e-9);
  assert.ok(Math.abs(fast.wall - 75.20891364902506) < 1e-9);
  assert.ok(Math.abs(slow.angle1 - fast.angle1) < 1e-12);
  assert.ok(Math.abs(slow.angle2 - fast.angle2) < 1e-12);
  assert.ok(Math.abs(slow.angle1 - slowChunked.angle1) < 1e-12);
  assert.ok(Math.abs(slow.angle2 - slowChunked.angle2) < 1e-12);
});

test('fixed-step replay has a stable geometry fixture', () => {
  assert.match(html, /const REPLAY_STEPS_PER_SECOND = 360/);
  assert.match(html, /replaySession\.completedSteps < targetSteps/);
  assert.match(html, /if \(!replaySession && !recipeSession\) breakStroke\(\)/);

  let angle1 = 0.25;
  let angle2 = 1.1;
  let points = '';
  for (let step = 0; step < 5 * 360; step += 1) {
    angle1 = (angle1 + 47 * Math.PI / 180 / 360) % (Math.PI * 2);
    angle2 = (angle2 - 131 * Math.PI / 180 / 360) % (Math.PI * 2);
    const elbowX = 300 + 112 * Math.cos(angle1);
    const elbowY = 300 + 112 * Math.sin(angle1);
    const penX = elbowX + 73 * Math.cos(angle2);
    const penY = elbowY + 73 * Math.sin(angle2);
    points += `${penX.toFixed(9)},${penY.toFixed(9)}\n`;
  }
  assert.equal(createHash('sha256').update(points).digest('hex'), '06b5609dbf3bd39a1ddbb4095b60c2ee44f9dbb27ad82cc0d8c20404044800a5');
});

test('cue boundaries remain deterministic across frame chunking', () => {
  assert.match(html, /function replayCueIndexForStep\(step\)/);
  assert.match(html, /Math\.round\(replayOriginal\.cues\[index\]\.seconds \* REPLAY_STEPS_PER_SECOND\)/);
  assert.match(html, /applyReplayCueForStep\(\);\s*const radians1/);
  assert.match(html, /breakStroke\(\);\s*syncControls\(\);\s*renderCueEditor\(\)/);

  const cues = [
    { seconds: 1.5, color: '#b4f7a7', width: 1.5, penDown: true },
    { seconds: 0.5, color: '#b4f7a7', width: 1.5, penDown: false },
    { seconds: 3, color: '#ffafcc', width: 3, penDown: true }
  ];
  const run = chunks => {
    let elapsed = 0;
    let completed = 0;
    let angle1 = 0.25;
    let angle2 = 1.1;
    let stream = '';
    for (const chunk of chunks) {
      elapsed = Math.min(5, elapsed + chunk);
      let target = Math.floor(elapsed * 360 + 1e-7);
      if (elapsed >= 5) target = 1800;
      while (completed < target) {
        let boundary = 0;
        let cue = cues.at(-1);
        for (const candidate of cues) {
          boundary += Math.round(candidate.seconds * 360);
          if (completed < boundary) { cue = candidate; break; }
        }
        angle1 = (angle1 + 47 * Math.PI / 180 / 360) % (Math.PI * 2);
        angle2 = (angle2 - 131 * Math.PI / 180 / 360) % (Math.PI * 2);
        if (cue.penDown) stream += `${completed}:${cue.color}:${cue.width}:${angle1.toFixed(9)}:${angle2.toFixed(9)}\n`;
        completed += 1;
      }
    }
    return stream;
  };
  const oneFrame = run([5]);
  const manyFrames = run(Array.from({ length: 300 }, () => 1 / 60));
  assert.equal(manyFrames, oneFrame);
  assert.equal(oneFrame.split('\n').filter(Boolean).length, 1620);
});

test('score editing, sharing, and playback retain explicit user control', () => {
  assert.match(html, /rememberCueEdit\(\)/);
  assert.match(html, /function undoCueEdit\(\)/);
  assert.match(html, /leaveReplayForRemix\(\);/);
  assert.match(html, /data-score-preset="neon-bloom"/);
  assert.match(html, /requestReplayStart\(replayFromCurrentControls\(\), \{ autoplay: true, source: 'score' \}\)/);
  assert.match(html, /const replay = replaySession && replayOriginal\s*\? cloneReplay\(replayOriginal\)\s*:\s*replayFromCurrentControls\(\)/);
  assert.match(html, /captureReplayPayload\(replay\.duration, replay\.state, replay\.cues\)/);
  assert.match(html, /document\.querySelector\('#copyReplay'\)\.addEventListener\('click', copyReplayLink\)/);
  assert.match(html, /navigator\.clipboard\.writeText\(url\.href\)/);
  assert.match(html, /controls\.replayLink\.focus\(\);\s*controls\.replayLink\.select\(\)/);
  assert.match(html, /window\.addEventListener\('popstate', \(\) => replayFromLocation\(\)\)/);
  assert.match(html, /Restore Clear can recover the displaced artwork/);
  assert.match(html, /reduced motion respected/);
  assert.match(html, /never your artwork or project history/i);
});
