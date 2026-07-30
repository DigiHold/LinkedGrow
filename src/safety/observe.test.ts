import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Watching mode has to be a hard stop, not a flag threaded through the sequence.
 *
 * The point of it is that somebody can run the automation against the live site to find out
 * whether it works, without it touching their LinkedIn account. That guarantee is worth exactly as
 * much as its weakest path, so this asserts the shape of the code rather than one behaviour: the
 * check sits before runSequence and returns, so no future step can be added after it by accident.
 */
const worker = readFileSync(new URL("../worker.ts", import.meta.url), "utf8");

test("the observe-only check returns before anything can write to LinkedIn", () => {
  const check = worker.indexOf("if (ctx.observeOnly)");
  const sequence = worker.indexOf("await runSequence(");
  assert.ok(check > 0, "the observe-only guard is missing");
  assert.ok(sequence > 0, "runSequence is missing");
  assert.ok(check < sequence, "the guard must come before the sequence, not after it");

  // Everything between the guard and the sequence must be the guard's own body and its return.
  const between = worker.slice(check, sequence);
  assert.ok(between.includes("return;"), "the guard must return, not merely log");
  for (const write of ["sendConnect", "sendDm", "warmUp", "withdrawInvite"]) {
    assert.ok(!between.includes(write), `${write} sits between the guard and the sequence`);
  }
});

test("sourcing still runs, because collecting leads is the whole point of watching", () => {
  const sourcing = worker.indexOf("await sourcePass(");
  const check = worker.indexOf("if (ctx.observeOnly)");
  assert.ok(sourcing < check, "sourcing must happen before the guard stops the pass");
});
