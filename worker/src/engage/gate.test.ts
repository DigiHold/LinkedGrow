import { test } from "node:test";
import assert from "node:assert/strict";
import { gate } from "./gate.ts";

/**
 * Every fixture below is a real draft the agent produced on 2026-09-06, and the verdict is the one
 * Nicolas gave it by hand. The suite exists so that the four rounds of review it took to find these
 * rules never have to happen again.
 */

const POST =
  "Could Block Be the Death of the AI SDR? I don't claim to be an expert on email deliverability " +
  "and spam. But I know a tiny bit. We send well over 1,000,000 emails a week in our newsletters. " +
  "And I wonder, and am worried, about the AI SDR. Because I am fine Blocking them.";

const ok = (text: string, extra = {}) => gate(text, { post: POST, ...extra });

test("a short comment that adds something passes", () => {
  const r = ok("One of our own SEO agents once published a page full of made up stats before we caught it.");
  assert.deepEqual(r.fails, []);
  assert.equal(r.ok, true);
});

test("an emoji passes only when this draft was given one", () => {
  const text = "We check every AI SEO article by hand now, one bad batch cost us weeks \u{1F642}";
  assert.equal(ok(text).ok, false);
  assert.equal(ok(text, { emojiAllowed: 1 }).ok, true);
});

/** Nicolas rejected this one for the banned word. "hit" is his ban, and the model reached for it. */
test('the word "hit" is refused', () => {
  const r = ok("Does the same block reflex hit invites sent from someone's own real account?");
  assert.ok(r.fails.some((f) => f.includes("banned word: hit")));
});

test('the word "part" is refused', () => {
  const r = ok("The harder part is knowing when the inbox calms down for every founder.");
  assert.ok(r.fails.some((f) => f.includes("banned word: part")));
});

/** The contracted spelling is the one that got through, so it is the one the test pins. */
test("the binary contrast is refused in both spellings", () => {
  assert.ok(ok("The block isn't about the address, it's about whether the message feels aimed.").fails.some((f) => f === "not X it's Y"));
  assert.ok(ok("It is not the sender address that matters, it's the message itself really.").fails.some((f) => f === "not X it's Y"));
});

/** The swapped shape, taken from a draft that got through the first version of this gate. */
test("the binary contrast is refused with its halves swapped", () => {
  const r = ok("Timing isn't the real issue, broken targeting logic is what actually breaks it.");
  assert.ok(r.fails.some((f) => f === "not X it's Y"), JSON.stringify(r.fails));
});

test("an invented count is refused", () => {
  const r = ok("They report it once they see the same pattern land in three separate emails.");
  assert.ok(r.fails.some((f) => f.includes("counted claim")));
});

test("a number that is not on the fact sheet is refused", () => {
  const r = ok("We watched the reply rate fall to 4% before anybody on the team noticed.");
  assert.ok(r.fails.some((f) => f.includes("number not on the fact sheet: 4")));
});

test("the products are never named", () => {
  for (const name of ["LinkedGrow", "Amabrik", "OceanWP"]) {
    const r = ok(`I ran into exactly this while building ${name} last year with my wife.`);
    assert.ok(r.fails.includes("names the product"), name);
  }
});

test("a lowercase opening is refused", () => {
  const r = ok("a blocked account is worse, the profile itself is the thing getting reported.");
  assert.ok(r.fails.includes("does not start with a capital"));
});

test("a line break is refused", () => {
  const r = ok("We stopped sending from the main domain.\nOne flag there and everything stops landing.");
  assert.ok(r.fails.includes("line break"));
});

test("four sentences are refused, however good they are", () => {
  const r = ok("We stopped that. It cost us badly. Nobody noticed for weeks. Now we check.");
  assert.ok(r.fails.some((f) => f.includes("sentences, max is 2")));
});

test("the long version Nicolas rejected is refused on length", () => {
  const r = ok(
    "Funding news gets used as a trigger because it is easy to scrape, and we tell our own " +
      "agents to look at hiring pages instead of the announcement itself every single time."
  );
  assert.ok(r.fails.some((f) => f.startsWith("too long")));
});

test("a phrase lifted from the post is refused", () => {
  const r = ok("I don't claim to be an expert on email deliverability, and my agents send nothing.");
  assert.ok(r.fails.some((f) => f.startsWith("lifted from the post")));
});

test("two comments may not open the same way", () => {
  const text = "We check every AI article by hand now, before any of it reaches the site.";
  assert.equal(ok(text).ok, true);
  const r = ok(text, { recentOpenings: ["We check every AI SEO article by hand"] });
  assert.ok(r.fails.some((f) => f.startsWith("opening repeats")));
});

test("slop vocabulary and dashes are refused", () => {
  assert.ok(ok("We leverage our own agents for this, and it works well enough for now.").fails.some((f) => f.includes("leverage")));
  assert.ok(ok("We stopped doing that — the account got flagged within the same week.").fails.includes("em or en dash"));
  assert.ok(ok("We run a cold-calling motion alongside it, and it still books meetings.").fails.some((f) => f.startsWith("hyphen compound")));
});

test("an empty draft is a failure, not an accident", () => {
  assert.deepEqual(gate("   ", { post: POST }), { ok: false, fails: ["empty"] });
});
