import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  TOUCH_COACH_SECONDS,
  createTouchCoach,
  advanceTouchCoach,
  learnTouchCoachZone,
  shouldShowTouchCoach,
} from "../games/starfall/game-core.js";

test("Starfall coach counts active play, not time spent paused", () => {
  const coach = createTouchCoach();

  advanceTouchCoach(coach, 2, true);
  advanceTouchCoach(coach, 12, false);
  assert.equal(coach.elapsed, 2);
  assert.equal(shouldShowTouchCoach(coach, true), true);

  advanceTouchCoach(coach, TOUCH_COACH_SECONDS - 2.1, true);
  assert.equal(shouldShowTouchCoach(coach, true), true);
  advanceTouchCoach(coach, 0.2, true);
  assert.equal(shouldShowTouchCoach(coach, true), false);
});

test("Starfall coach clears learned zones, resets on restart, and stays off desktop", () => {
  const firstRun = createTouchCoach();
  assert.equal(shouldShowTouchCoach(firstRun, false), false);
  assert.equal(shouldShowTouchCoach(firstRun, true), true);

  learnTouchCoachZone(firstRun, "move");
  assert.equal(shouldShowTouchCoach(firstRun, true), true);
  learnTouchCoachZone(firstRun, "aim");
  assert.equal(shouldShowTouchCoach(firstRun, true), false);

  const restarted = createTouchCoach();
  assert.deepEqual(restarted, { move: false, aim: false, elapsed: 0 });
  assert.equal(shouldShowTouchCoach(restarted, true), true);
});

test("Starfall desktop instructions describe the actual aim and hold-to-fire mapping", async () => {
  const html = await readFile(new URL("../games/starfall/index.html", import.meta.url), "utf8");
  assert.match(html, /MOUSE AIM \/ HOLD FIRE/);
  assert.match(html, /Aim: pointer · Hold pointer to fire/);
  assert.match(html, /aim with the pointer, hold the pointer to fire/);
  assert.doesNotMatch(html, /Aim and fire: pointer/);
});
