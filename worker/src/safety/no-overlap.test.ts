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
// The watchdog moved out of worker.ts when publishing needed it too, so the
// guarantee it carries is asserted where it now lives.
const watchdog = readFileSync(new URL("./watchdog.ts", import.meta.url), "utf8");
const publish = readFileSync(new URL("../publish/pass.ts", import.meta.url), "utf8");

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
  assert.match(watchdog, /state\.closeBrowser\?\.\(\)/, "the watchdog does not close the abandoned browser");
  const guard = watchdog.indexOf("if (!(error instanceof RunStalled)) throw error;");
  const close = watchdog.indexOf("state.closeBrowser?.()");
  const rethrow = watchdog.indexOf("throw error;", close);
  assert.ok(guard > 0 && close > guard && rethrow > close, "the close does not happen before the rethrow");
});

test("closing twice is harmless, since the run's own finally also closes", () => {
  assert.match(worker, /if \(closed\) return;/, "closeOnce is not idempotent");
  assert.match(publish, /if \(closed\) return;/, "the publish session's close is not idempotent");
});

/**
 * Publishing opens a browser too, and it is the newer of the two paths.
 *
 * A content-only customer has no agent, so the publish loop is the only thing
 * that ever opens their session; an agent customer has both loops wanting the
 * same profile. The slot is what keeps them apart, and it has to be taken
 * before the session opens and released after it closes, exactly as the agent
 * pass does.
 */
test("publishing takes the account's slot around its whole session", () => {
  const take = publish.indexOf("takeSlot(work.account.id)");
  const open = publish.indexOf("runAccount({ account: work.account");
  const release = publish.indexOf("lease.release();", open);
  assert.ok(take > 0, "the publish pass does not take a slot");
  assert.ok(take < open && open < release, "the slot does not span the publishing session");
  assert.match(publish.slice(open, release + 40), /finally/, "the slot is not released in a finally");
});

test("publishing runs under the watchdog, so a hung upload cannot hold the account for ever", () => {
  assert.match(publish, /withWatchdog\(/, "the publish session is not watched");
  assert.match(publish, /run\.closeBrowser = closeOnce/, "the watchdog cannot close the publish browser");
});
