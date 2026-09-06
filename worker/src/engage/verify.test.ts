import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVerifyPrompt, readVerdict } from "./verify.ts";

test("the prompt carries the closed fact list and the comment", () => {
  const p = buildVerifyPrompt("We stopped that last year after it broke twice on us.", "You built a boat in 1998.");
  assert.ok(p.includes("You built a boat in 1998."), "the facts must be in the prompt");
  assert.ok(p.includes("We stopped that last year"), "the comment must be in the prompt");
  assert.ok(/When you are unsure, answer INVENTED/.test(p));
});

test("only a clean verdict passes", () => {
  assert.equal(readVerdict("CLEAN"), true);
  assert.equal(readVerdict(" clean "), true);
  assert.equal(readVerdict("```\nCLEAN\n```"), true);
  assert.equal(readVerdict("INVENTED"), false);
});

/**
 * Fails closed. Every one of these came out of a real model at some point, and none of them is
 * permission to post something written in Nicolas's name.
 */
test("anything that is not a clean verdict rejects the comment", () => {
  for (const answer of ["", "  ", "I think it is fine", "unclear", "CLEAN-ISH", "maybe clean"]) {
    assert.equal(readVerdict(answer), false, JSON.stringify(answer));
  }
});
