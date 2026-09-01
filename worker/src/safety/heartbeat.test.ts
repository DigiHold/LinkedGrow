import { test } from "node:test";
import assert from "node:assert/strict";
import { beat, startWatch, stopWatch, stalled, IDLE_LIMIT_MS, ABSOLUTE_LIMIT_MS } from "./heartbeat.ts";

/**
 * Nicolas's rule for this guard, and the reason the first version was thrown away: it must never
 * cut off an agent that is not stuck. An agent reading four posts at a human pace is slow, not
 * broken, and a limit on duration would punish exactly the behaviour that keeps accounts alive.
 */

test("an agent that keeps working is never cut off, however long it takes", () => {
  const start = 1_000_000;
  startWatch(start);
  // Half an hour of steady work, beating every couple of minutes.
  for (let t = 0; t < 30 * 60_000; t += 2 * 60_000) {
    beat(start + t);
    assert.equal(stalled(start + t + 1000), null, `cut off at ${t / 60_000} minutes of real work`);
  }
  stopWatch();
});

test("silence past the idle limit is a stall", () => {
  const start = 1_000_000;
  startWatch(start);
  assert.equal(stalled(start + IDLE_LIMIT_MS - 1000), null, "cut off just before the limit");
  const stall = stalled(start + IDLE_LIMIT_MS + 1000);
  assert.equal(stall?.kind, "idle");
  stopWatch();
});

test("a beat resets the silence", () => {
  const start = 1_000_000;
  startWatch(start);
  assert.equal(stalled(start + IDLE_LIMIT_MS - 1000), null);
  beat(start + IDLE_LIMIT_MS - 1000);
  assert.equal(stalled(start + 2 * IDLE_LIMIT_MS - 3000), null, "the beat should have reset it");
  stopWatch();
});

test("the absolute ceiling is far enough away to only catch a runaway", () => {
  assert.ok(ABSOLUTE_LIMIT_MS >= 60 * 60_000, "an hour of genuine work must not trip it");
  const start = 1_000_000;
  startWatch(start);
  // Beating steadily, so only the absolute limit can fire.
  for (let t = 0; t <= ABSOLUTE_LIMIT_MS; t += 60_000) beat(start + t);
  assert.equal(stalled(start + ABSOLUTE_LIMIT_MS + 1000)?.kind, "absolute");
  stopWatch();
});

test("nothing is a stall when nobody is watching", () => {
  stopWatch();
  assert.equal(stalled(Date.now() + 10 * ABSOLUTE_LIMIT_MS), null);
});
