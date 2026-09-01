import { test } from "node:test";
import assert from "node:assert/strict";
import { withRunState, currentRun, type RunState } from "./run-context.ts";
import { usePersona, currentPersona } from "../browser/human.ts";
import { beat, stalled, IDLE_LIMIT_MS } from "./heartbeat.ts";

/**
 * Several agents run at once, one per LinkedIn account, and three things used to be process-wide
 * as though only one ever ran.
 *
 * The motor persona and the cursor were the worse pair: each account is meant to move and type
 * with its own habits, and one shared variable meant the last browser to open decided how every
 * other account behaved. Two people, one cursor trail, which is a fingerprint rather than a
 * defence. The heartbeat had the same shape: the first agent to finish disarmed the rest.
 */
const fresh = (): RunState => ({
  persona: null,
  cursor: { x: 0, y: 0 },
  heartbeat: { lastBeat: Date.now(), startedAt: Date.now() },
});

test("two accounts running at once keep their own motor persona", async () => {
  let a: unknown;
  let b: unknown;
  await Promise.all([
    withRunState(fresh(), async () => {
      usePersona("account-one");
      // Let the other run interleave here, which is exactly when the shared variable broke.
      await new Promise((r) => setTimeout(r, 10));
      a = currentPersona();
    }),
    withRunState(fresh(), async () => {
      usePersona("account-two");
      await new Promise((r) => setTimeout(r, 10));
      b = currentPersona();
    }),
  ]);
  assert.notDeepEqual(a, b, "both accounts ended up moving like the same person");
});

test("one agent finishing does not disarm another agent's watchdog", async () => {
  const long = fresh();
  await Promise.all([
    // A short run that starts and ends while the other is still going.
    withRunState(fresh(), async () => {
      beat();
      await new Promise((r) => setTimeout(r, 5));
    }),
    withRunState(long, async () => {
      await new Promise((r) => setTimeout(r, 20));
      // Still inside its own run, still watched, and it is the silence that decides.
      assert.equal(stalled(), null, "a live run was reported as stalled");
      long.heartbeat.lastBeat = Date.now() - IDLE_LIMIT_MS - 1000;
      assert.equal(stalled()?.kind, "idle", "a silent run was not caught");
    }),
  ]);
});

test("outside a run the helpers still work, which is what the tests and the login command do", () => {
  assert.equal(currentRun(), null);
  usePersona("account-three");
  assert.ok(currentPersona().keyMean > 0);
});
