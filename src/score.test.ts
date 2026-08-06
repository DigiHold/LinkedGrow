import { test } from "node:test";
import assert from "node:assert/strict";
import { parseScore } from "./ai.ts";

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
