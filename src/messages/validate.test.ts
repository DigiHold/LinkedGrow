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

/**
 * The chat-assistant fillers and question-dodges that shipped in live DMs on
 * 2026-08-15: "Fair enough, wanted to see...", "I'd rather not give you a
 * generic answer", "I'll spare you for now". A person answers the question;
 * a support bot fills, and a scammer dodges.
 */
test("rejects the fair-enough filler", () => {
  const msg = "Fair enough, wanted to see what you are building and how you split the week between the SaaS and the agents these days.";
  const r = validateMessage(msg, ctx);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("fair enough")));
});

test("rejects the generic-answer dodge", () => {
  const msg = "Hey Alex, I'd rather not give you a generic answer, so tell me first what you are working on these days and how it is going.";
  const r = validateMessage(msg, ctx);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("rather not")));
});

test("rejects the spare-you dodge", () => {
  const msg = "Honestly still figuring out the best way to explain it in a sentence, so I'll spare you for now. How is your own week going?";
  const r = validateMessage(msg, ctx);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("spare you")));
});

/**
 * Colons and semicolons are the same family of tell as the em dash (Nicolas,
 * 2026-08-15). A person typing a DM on a phone uses a comma or a new sentence.
 */
test("rejects a colon, which no human types in a DM", () => {
  const msg = "Hey Alex, quick thought on your rollout: the checker I built catches exactly the AI-search gap you posted about last week.";
  const r = validateMessage(msg, ctx);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("colon")));
});

test("rejects a semicolon for the same reason", () => {
  const msg = "Hey Alex, I keep running into the same AI-search gap you mentioned; the checker I built catches it in a few seconds flat.";
  const r = validateMessage(msg, ctx);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("semicolon") || x.includes("colon")));
});
