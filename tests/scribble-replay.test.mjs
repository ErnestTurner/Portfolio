import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../games/scribble-engine/index.html', import.meta.url), 'utf8');

test('replay links are versioned, bounded, setup-only payloads', () => {
  assert.match(html, /const REPLAY_SCHEMA = 'trikzik\.scribble-engine\.replay'/);
  assert.match(html, /const REPLAY_VERSION = 1/);
  assert.match(html, /const MAX_REPLAY_BYTES = 1024/);
  assert.match(html, /const MAX_REPLAY_TOKEN_LENGTH = 1400/);
  assert.match(html, /const MAX_REPLAY_URL_LENGTH = 2048/);
  assert.match(html, /const MIN_REPLAY_DURATION = 5/);
  assert.match(html, /const MAX_REPLAY_DURATION = 60/);
  assert.match(html, /exactKeys\(value, \['schema', 'version', 'duration', 'machine', 'ink', 'paper'\]\)/);

  const capture = html.slice(html.indexOf('function captureReplayPayload'), html.indexOf('function validateReplayPayload'));
  assert.doesNotMatch(capture, /name|artwork|checkpoint|history|url|referrer|user/i);
  assert.match(capture, /machine:/);
  assert.match(capture, /ink:/);
  assert.match(capture, /paper:/);
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

test('replay interactions preserve explicit user control and safe fallbacks', () => {
  assert.match(html, /document\.querySelector\('#copyReplay'\)\.addEventListener\('click', copyReplayLink\)/);
  assert.match(html, /navigator\.clipboard\.writeText\(url\.href\)/);
  assert.match(html, /controls\.replayLink\.focus\(\);\s*controls\.replayLink\.select\(\)/);
  assert.match(html, /window\.addEventListener\('popstate', \(\) => replayFromLocation\(\)\)/);
  assert.match(html, /Restore Clear can recover the displaced artwork/);
  assert.match(html, /reduced motion respected/);
  assert.match(html, /not your artwork or mid-run changes/i);
});
