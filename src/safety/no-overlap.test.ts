import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Two agents on one LinkedIn account must never be signed in at the same time.
 *
 * It is the single easiest automation signal for LinkedIn to read, and the customer who runs one
 * account against two businesses is the one who reaches this configuration. The design already
 * handles it: agents are grouped by account and run one after another inside a group.
 *
 * The watchdog broke it. It abandons a stalled run by losing a race, so that run keeps executing
 * with its Chrome still open while the loop starts the next agent, which opens a second browser on
 * the same profile directory. These assert the shape that prevents it, because the failure only
 * appears with two agents, a stall, and real timing.
 */
const worker = readFileSync(new URL("../worker.ts", import.meta.url), "utf8");

test("agents are grouped by LinkedIn account and run one at a time inside a group", () => {
  assert.match(worker, /groupKey\(ctx\.linkedinAccountId\)/, "grouping is not by account");
  // Sequential inside the group: awaited in a for loop, never mapped into Promise.all.
  const group = worker.slice(worker.indexOf("for (const ctx of group)"));
  assert.match(group.slice(0, 200), /await safely\(ctx\)/, "agents in a group are not awaited in turn");
});

test("the slot covers the whole group and is released only at the end", () => {
  const take = worker.indexOf("takeSlot(first.linkedinAccountId)");
  const release = worker.indexOf("lease.release()");
  const loop = worker.indexOf("for (const ctx of group)");
  assert.ok(take < loop && loop < release, "the slot does not span every agent on the account");
  assert.match(worker.slice(loop, release + 40), /finally/, "the slot is not released in a finally");
});

test("a stalled run has its browser closed before the next agent may start", () => {
  assert.match(worker, /state\.closeBrowser\?\.\(\)/, "the watchdog does not close the abandoned browser");
  const guard = worker.indexOf("if (!(error instanceof RunStalled)) throw error;");
  const close = worker.indexOf("state.closeBrowser?.()");
  const rethrow = worker.indexOf("throw error;", close);
  assert.ok(guard > 0 && close > guard && rethrow > close, "the close does not happen before the rethrow");
});

test("closing twice is harmless, since the run's own finally also closes", () => {
  assert.match(worker, /if \(closed\) return;/, "closeOnce is not idempotent");
});
