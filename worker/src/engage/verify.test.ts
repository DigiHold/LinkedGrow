import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVerifyPrompt, readVerdict } from "./verify.ts";

test("the prompt carries the closed fact list and the comment", () => {
  const p = buildVerifyPrompt("We stopped that last year after it broke twice on us.", "You built a boat in 1998.");
  assert.ok(p.includes("You built a boat in 1998."), "the facts must be in the prompt");
  assert.ok(p.includes("We stopped that last year"), "the comment must be in the prompt");
  assert.ok(/Refuse it when it says something extra/.test(p));
});

/**
 * The failure that got through on the first live run: the sheet said the AI costs about $200 a
 * month, and the comment came back as "I capped mine, $200 a month total". The number was true and
 * the action was invented, and the first version of this prompt called that clean.
 */
test("the prompt refuses a method the sheet does not describe", () => {
  const p = buildVerifyPrompt("I capped mine, $200 a month total.", "Their AI costs about $200 a month.");
  assert.ok(/an action taken that the list does not describe/.test(p));
  assert.ok(/capping, limiting or switching/i.test(p));
});

/**
 * The over correction that came straight after the under correction. A comment with no first person
 * claim was refused, and refusing every question is how the agent ends up posting nothing.
 */
test("a comment making no claim about the person needs nothing in the list", () => {
  const p = buildVerifyPrompt("How do you separate high intent keywords from the rest?", "Anything.");
  assert.ok(/no first person claim at all/.test(p));
  assert.ok(/There is nothing to check/.test(p));
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
