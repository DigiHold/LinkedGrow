import { test } from "node:test";
import assert from "node:assert/strict";
import { validateMessage, type ValidateContext } from "./validate.ts";

const ctx: ValidateContext = {
  senderName: "Maria Lecocq",
  headline: "VP of Marketing at Cloudstack scaling B2B growth",
};

// No sign-off. LinkedIn prints the sender's name beside every message, so one
// at the bottom is a mail-merge artefact and is now refused rather than
// required (2026-07-31).
const clean =
  "Hey Alex,\nyou post a lot about AI search, and I keep wondering whether your own site actually gets cited by those tools yet. I built something that checks exactly that in a few seconds. Happy to show you if you are curious.";

test("clean message passes", () => {
  const r = validateMessage(clean, ctx);
  assert.equal(r.ok, true, r.reasons.join("; "));
});

test("rejects unresolved placeholder", () => {
  const msg = "Hey [firstname], you post a lot about AI search and I built a checker for exactly that today. Best, Maria Lecocq";
  assert.equal(validateMessage(msg, ctx).ok, false);
});

test("rejects em dash", () => {
  const msg = "Hey Alex, you post about AI search — I built a checker for exactly that and would show you. Best, Maria Lecocq";
  const r = validateMessage(msg, ctx);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("dash")));
});

test("rejects banned word", () => {
  const msg = "Hey Alex, I think we could leverage your audience and I built a checker for AI search you might like. Best, Maria Lecocq";
  const r = validateMessage(msg, ctx);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("leverage")));
});

test("rejects generic slop opener", () => {
  const msg = "I saw your comment on that post and wanted to connect because I built a checker for AI search you might like. Best, Maria Lecocq";
  const r = validateMessage(msg, ctx);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("generic opener")));
});

test("rejects headline dump", () => {
  const msg = "Hey Alex, since you are VP of Marketing at Cloudstack scaling B2B growth, I built a checker for AI search you might like. Best, Maria Lecocq";
  const r = validateMessage(msg, ctx);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("headline")));
});

test("rejects a sign-off, which is the mail-merge tell", () => {
  // This assertion used to be the opposite: a message WITHOUT the sender's name
  // was refused. That rule is half of why the first messages read as automated,
  // so it was inverted rather than relaxed.
  const signed = `${clean}\nMaria`;
  const r = validateMessage(signed, ctx);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("signs off")));
});

test("rejects too long", () => {
  const filler = "and I keep thinking about your site and its content and what could be improved here ".repeat(8);
  const msg = `Hey Alex, ${filler} so anyway that is the idea. Best, Maria Lecocq`;
  assert.equal(validateMessage(msg, ctx).ok, false);
});
