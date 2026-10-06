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

  const presets = html.slice(html.indexOf('const SCORE_PRESETS'), html.indexOf('function cloneCues'));
  assert.equal((presets.match(/penDown: false/g) || []).length, 6);
  for (const color of ['#b4f7a7', '#a2c8ff', '#ffafcc', '#ffd166', '#ff6b6b', '#fff1d0', '#eff5fa']) {
    assert.match(presets, new RegExp(color));
  }
});

test('fixed-step replay has a stable geometry fixture', () => {
  assert.match(html, /const REPLAY_STEPS_PER_SECOND = 360/);
  assert.match(html, /replaySession\.completedSteps < targetSteps/);
  assert.match(html, /if \(!replaySession\) breakStroke\(\)/);

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
