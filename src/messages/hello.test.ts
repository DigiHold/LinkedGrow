import { test } from "node:test";
import assert from "node:assert/strict";
import { validateMessage } from "./validate.ts";

/**
 * The first message after an acceptance, locked down.
 *
 * On 2026-07-31 Nicolas received one that read as pure AI:
 *
 *   "Owning a site end to end, from AEO diagnosis to the WordPress fix, is why
 *    I hit connect. Really good to meet you, Jonathan. Maria Lecocq"
 *
 * Three faults, and the prompt was asking for all three: a template that forced
 * an inverted clause nobody says out loud, a required name at the bottom that
 * LinkedIn already prints beside every message, and a greeting claiming to have
 * met somebody it has not.
 *
 * The prompt was rewritten, but a prompt is a suggestion. These tests are the
 * part that holds, because the next person editing that prompt will not have
 * read the reason it changed.
 */

const ctx = {
  senderName: "Maria",
  headline: "Head of Talent at Northwind",
  step: "hello" as const,
};

test("the exact message that started this is refused", () => {
  const result = validateMessage(
    "Owning a site end to end, from AEO diagnosis to the WordPress fix, is why I hit connect.\nReally good to meet you, Jonathan.\nMaria",
    ctx
  );
  assert.equal(result.ok, false);
  assert.ok(
    result.reasons.some((r) => r.includes("hit connect")),
    `expected the template to be named, got: ${result.reasons.join(" | ")}`
  );
});

test("claiming to have met them is refused", () => {
  for (const phrase of [
    "Good to meet you, Tom, and that pricing page of yours is unusually honest.",
    "Nice to meet you, Sarah. Your write-up on onboarding was worth the read.",
  ]) {
    const result = validateMessage(phrase, ctx);
    assert.equal(result.ok, false, `should have been refused: ${phrase}`);
  }
});

test("signing the message is refused, because LinkedIn already shows the name", () => {
  const result = validateMessage(
    "Glad we connected, Jonathan. That client site going down right before a launch is the kind of week nobody deserves.\nMaria",
    ctx
  );
  assert.equal(result.ok, false);
  assert.ok(result.reasons.some((r) => r.includes("signs off")));
});

test("a bare thank-you for connecting is refused", () => {
  const result = validateMessage(
    "Thanks for connecting, Sarah. Looking forward to seeing what you share here.",
    ctx
  );
  assert.equal(result.ok, false);
});

test("compliments that would fit anybody are refused", () => {
  const result = validateMessage(
    "Glad we connected, Tom. Impressed by your profile and everything you have built there.",
    ctx
  );
  assert.equal(result.ok, false);
});

/**
 * The five shapes Nicolas approved on 2026-07-31. They are deliberately five
 * different structures rather than one template with the noun swapped, because
 * a fixed opening is the pattern a reader spots after two messages and a
 * classifier spots across a whole sending history.
 */
test("the five approved shapes all pass", () => {
  const approved = [
    // greeting, then the observation
    "Glad we connected, Jonathan. That client site going down right before a launch is the kind of week nobody deserves.",
    // observation, then a short greeting
    "Your point about cookie banners eating three days of a build was too accurate to scroll past. Good to be connected, Tom.",
    // the observation alone, name inside it
    "Still thinking about your pricing page, Sarah. Explaining the tiers instead of hiding them is rarer than it should be.",
    // a congratulation on something that just changed
    "Going from solo to a first hire is the scariest good decision there is, Lea. Nice one for making the call.",
    // plain empathy, no compliment
    "Watching traffic slide with no idea which change caused it is genuinely maddening, Marc. Good to be connected.",
  ];
  for (const message of approved) {
    const result = validateMessage(message, ctx);
    assert.equal(
      result.ok,
      true,
      `should have passed: "${message}" but got: ${result.reasons.join(" | ")}`
    );
  }
});

test("a short greeting is allowed, everything else still carries its weight", () => {
  // "Glad we connected, Jonathan" is four words and must not be rejected,
  // because forcing it to six produces the stiffness the rule exists to stop.
  const withShortGreeting = validateMessage(
    "Glad we connected, Jonathan. That client site going down right before a launch is the kind of week nobody deserves.",
    ctx
  );
  assert.equal(withShortGreeting.ok, true);

  // A short sentence that is not a greeting is still a fragment.
  const withFragment = validateMessage(
    "Glad we connected, Jonathan. Makes sense. Your launch week sounded genuinely rough from the outside.",
    ctx
  );
  assert.equal(withFragment.ok, false);
});

test("the later steps keep the longer minimum", () => {
  // Twenty words is a hello, not an introduction. The same text must pass as
  // one and fail as the other, which is the whole point of the step field.
  const short =
    "Glad we connected, Jonathan. That client site going down right before a launch is the kind of week nobody deserves.";
  assert.equal(validateMessage(short, ctx).ok, true);
  assert.equal(validateMessage(short, { ...ctx, step: "intro" }).ok, false);
});
