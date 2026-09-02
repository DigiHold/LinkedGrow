import { test } from "node:test";
import assert from "node:assert/strict";
import { validateMessage } from "./validate.ts";
import { HELLO_SHAPES, pickHelloShape } from "./relationship.ts";

/**
 * The first message after an acceptance, locked down.
 *
 * On 2026-07-31 Nicolas received one that read as pure AI:
 *
 *   "Owning a site end to end, from AEO diagnosis to the WordPress fix, is why
 *    I hit connect. Really good to meet you, Jonathan. Jane Doe"
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
  senderName: "Jane",
  headline: "Head of Talent at Northwind",
  step: "hello" as const,
};

test("the exact message that started this is refused", () => {
  const result = validateMessage(
    "Owning a site end to end, from AEO diagnosis to the WordPress fix, is why I hit connect.\nReally good to meet you, Jonathan.\nJane",
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
    "Glad we connected, Jonathan. That client site going down right before a launch is the kind of week nobody deserves.\nJane",
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
 * The five shapes, re-cut on 2026-08-15. The 2026-07-31 set engaged with what
 * the prospect had posted ("your point about cookie banners..."), and Nicolas
 * banned the whole family: reciting somebody's post, comment or headline back
 * at them is what every LinkedIn automation does, and no human does it. The
 * shapes stay structurally distinct, and the signal now picks the register
 * without ever being cited.
 */
test("the five approved shapes all pass", () => {
  const approved = [
    // greeting, then one warm ordinary line
    "Glad we connected, Jonathan. Hope the week has been kinder than the usual Monday pile.",
    // the warm line first, then a short greeting
    "August has half of LinkedIn on a beach somewhere. Good to be connected, Tom.",
    // a single easy sentence, name inside it
    "Better late than never on my end, Sarah, but glad the connection finally came through.",
    // a congratulation on something that just changed
    "Going from solo to a first hire is the scariest good decision there is, Lea. Nice one for making the call.",
    // plain empathy for the kind of situation they are in, none of their words
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

/**
 * The rotation, which is the half a prompt cannot do.
 *
 * The prompt used to carry "VARY THE SHAPE between messages". Every message is an independent
 * model call with no memory of the previous ones, so there was nothing to vary against and the
 * model settled on whichever shape it preferred. Choosing outside the model is the only version
 * of this that works, so these tests guard the choice rather than the wording.
 */
test("two prospects do not get the same opening shape", () => {
  const shapes = new Set(
    [
      { firstName: "Tom", fullName: "Tom Meyer", source: "reaction:calendly" },
      { firstName: "Sarah", fullName: "Sarah Klein", source: "reaction:calendly" },
      { firstName: "Lea", fullName: "Lea Fontaine", source: "comment:calendly" },
      { firstName: "Marc", fullName: "Marc Dupuis", source: "reaction:hootsuite" },
      { firstName: "Jonathan", fullName: "Jonathan Reyes", source: "comment:hootsuite" },
    ].map((p) => pickHelloShape(p))
  );
  assert.ok(shapes.size > 1, "every prospect received the same shape, which is the bug this fixes");
});

test("the same prospect keeps their shape across a regeneration", () => {
  const p = { firstName: "Tom", fullName: "Tom Meyer", source: "reaction:calendly" };
  assert.equal(pickHelloShape(p), pickHelloShape(p));
});

test("a congratulation is only offered when something actually changed", () => {
  // Congratulating somebody who merely reacted to a post reads worse than any template, so that
  // shape has to be unreachable unless the signal is a role change.
  const congratulation = HELLO_SHAPES[3];
  const empathy = HELLO_SHAPES[4];
  for (const name of ["Tom Meyer", "Sarah Klein", "Lea Fontaine", "Marc Dupuis", "Ana Ruiz", "Ivan Petrov"]) {
    const shape = pickHelloShape({ firstName: name.split(" ")[0]!, fullName: name, source: "reaction:calendly" });
    assert.notEqual(shape, congratulation, `${name} was offered a congratulation on a bare reaction`);
    assert.notEqual(shape, empathy, `${name} was offered empathy on a bare reaction`);
  }
  const moved = pickHelloShape({ firstName: "Ana", fullName: "Ana Ruiz", source: "jobchange:cto" });
  assert.ok(HELLO_SHAPES.includes(moved as (typeof HELLO_SHAPES)[number]));
});

/**
 * Reciting the prospect's own post back at them. The check lived in this file's validator all
 * along but ran on the Reddit path only, and the DM path never passed the prospect's words, so
 * a message could quote them back word for word and pass.
 */
test("a message that recites their own post is refused", () => {
  const theirPost =
    "spent the whole weekend restoring a client site from a backup that turned out to be four months old";
  const parrot = validateMessage(
    "Glad we connected, Tom. Spent the whole weekend restoring a client site from a backup that turned out to be four months old sounds rough.",
    { ...ctx, contextText: theirPost }
  );
  assert.equal(parrot.ok, false);
  assert.ok(parrot.reasons.some((r) => r.includes("restates their own words")));

  // Reacting to it, rather than repeating it, is the whole point and must still pass.
  const reaction = validateMessage(
    "Glad we connected, Tom. Finding out the backup was months stale, mid-restore, is the worst possible moment to learn it.",
    { ...ctx, contextText: theirPost }
  );
  assert.equal(reaction.ok, true, reaction.reasons.join(" | "));
});

/**
 * The vague noun standing in for the thing itself.
 *
 * Nicolas caught "that question from the client is the annoying part" in a live run. The banned
 * list held "that part" and every bare demonstrative, and missed every adjective variant, which is
 * a list losing a race it cannot win. The pattern is the fix, so these lock its edges.
 */
test("a vague noun standing in for the thing is refused", () => {
  for (const bad of [
    "That question from the client is the annoying part, you cannot answer it honestly without checking.",
    "Getting the banner right is the tricky bit, and most builds never get audited at all.",
    "Rebuilding under a deadline is the hard part, the rest of it is ordinary work.",
    "Chasing the client for sign-off is that whole side of things nobody warns you about.",
  ]) {
    const r = validateMessage(bad, ctx);
    assert.equal(r.ok, false, `should have been refused: ${bad}`);
    assert.ok(
      r.reasons.some((x) => x.includes("vague noun")),
      `expected the vague noun to be named, got: ${r.reasons.join(" | ")}`
    );
  }
});

test("naming the actual thing still passes", () => {
  for (const good of [
    "Auditing every build by hand is what would eat your week, and nobody has that week spare.",
    "The best part of the job is watching a client stop worrying about it entirely.",
    "That side of the business is the one your client actually notices when it breaks.",
  ]) {
    const r = validateMessage(good, ctx);
    assert.ok(
      !r.reasons.some((x) => x.includes("vague noun")),
      `wrongly flagged as vague: "${good}" -> ${r.reasons.join(" | ")}`
    );
  }
});
