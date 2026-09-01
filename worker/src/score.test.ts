import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanReason, parseScore } from "./ai.ts";

/**
 * The shapes the scorer actually answered in.
 *
 * Every one of these was read off agent_leads on 2026-08-06, where ten leads
 * in a row were stored at 0 with reasons like "reason\n\n25|CSO role and large
 * newsletter audience". The model repeats the format line before answering and
 * the parser split on the first pipe, so it read the echoed template instead of
 * the answer.
 */

test("the plain shape still works", () => {
  assert.deepEqual(parseScore("88|Founder at a small SaaS, buys their own tools"), {
    score: 88,
    reason: "Founder at a small SaaS, buys their own tools",
  });
});

test("the echoed format line does not become the score", () => {
  const answer = "SCORE|reason\n\n25|CSO role and a large newsletter audience";
  assert.deepEqual(parseScore(answer), {
    score: 25,
    reason: "CSO role and a large newsletter audience",
  });
});

test("a reason containing a pipe survives", () => {
  assert.deepEqual(parseScore("70|Founder | agency owner | France"), {
    score: 70,
    reason: "Founder | agency owner | France",
  });
});

test("a genuine zero is kept, because it is a judgement", () => {
  assert.deepEqual(parseScore("0|Photographer, nothing to do with the audience"), {
    score: 0,
    reason: "Photographer, nothing to do with the audience",
  });
});

test("a bare number is an answer", () => {
  assert.deepEqual(parseScore("64"), { score: 64, reason: "No reason given" });
});

test("nothing readable throws, so the lead is scored again rather than stored as a zero", () => {
  assert.throws(() => parseScore("I am unable to assess this prospect."));
});

test("a score above 100 is clamped rather than trusted", () => {
  assert.equal(parseScore("640|Very strong fit").score, 100);
});

/**
 * The reason a customer reads, with the echoed template cut off.
 *
 * Ten leads on a live account show this in the queue under "Why this person":
 *
 *   reason
 *
 *   15|CSO role at established newsletter and CMO title indicate...
 *
 * They were written by a version of the parser that split on the FIRST pipe, so
 * parseInt("SCORE") was NaN and the whole tail became the reason. The parser
 * does not produce that any more; these are the guard in front of the screen,
 * because the next model quirk should cost a log line rather than a column of
 * nonsense in front of a paying customer.
 */
test("an echoed template never reaches the customer", () => {
  assert.equal(
    cleanReason("reason\n\n15|CSO role at an established newsletter."),
    "CSO role at an established newsletter."
  );
});

test("a bare SCORE opener is cut even with no number to anchor on", () => {
  assert.equal(cleanReason("SCORE| Founder at a small SaaS."), "Founder at a small SaaS.");
  assert.equal(cleanReason("reason: Founder at a small SaaS."), "Founder at a small SaaS.");
});

test("a clean reason is returned untouched", () => {
  const clean = "Founder at a small SaaS who buys their own tools.";
  assert.equal(cleanReason(clean), clean);
});

test("a pipe inside a real sentence survives, because it is not an echo", () => {
  const withPipe = "Runs Acme | Payments for salons, so a buyer rather than a rival.";
  assert.equal(cleanReason(withPipe), withPipe);
});

test("an empty reason says so rather than showing nothing", () => {
  assert.equal(cleanReason(""), "No reason given");
  assert.equal(cleanReason("   \n  "), "No reason given");
  assert.equal(cleanReason("SCORE|"), "No reason given");
});

test("the parser and the guard agree on a real answer", () => {
  const parsed = parseScore("SCORE|reason\n\n78|Co-founder with product architecture background.");
  assert.equal(parsed.score, 78);
  assert.equal(parsed.reason, "Co-founder with product architecture background.");
});
