import { test } from "node:test";
import assert from "node:assert/strict";
import {
  actionable,
  dateOrder,
  documentTitleFrom,
  formatDateFor,
  formatTimeFor,
  partsInZone,
} from "./publish.ts";

/**
 * The four pure functions that decide which day somebody's post goes out on.
 *
 * Everything else in publish.ts needs a browser. These do not, and they are the
 * part where being wrong is silent: a date typed month-first into a field that
 * wanted the day first is accepted, looks fine, and publishes on the wrong day.
 * The browser code reads the field back before confirming, so a mistake here
 * costs a fallback rather than a wrong post, but the fallback is worth avoiding.
 */

test("a moment is read in the account's own zone, not the server's", () => {
  // 08:30 UTC on a summer day is 10:30 in Paris and 04:30 in New York.
  const at = new Date("2026-08-12T08:30:00Z");
  const paris = partsInZone(at, "Europe/Paris");
  assert.deepEqual(paris, { day: 12, month: 8, year: 2026, hour: 10, minute: 30 });

  const newYork = partsInZone(at, "America/New_York");
  assert.deepEqual(newYork, { day: 12, month: 8, year: 2026, hour: 4, minute: 30 });

  // And a slot that falls on the previous day somewhere else really does.
  const early = partsInZone(new Date("2026-08-12T02:00:00Z"), "America/New_York");
  assert.equal(early.day, 11, "a New York account was given tomorrow's date");
});

test("midnight is hour zero, never twenty-four", () => {
  const at = new Date("2026-08-12T22:00:00Z");
  assert.equal(partsInZone(at, "Europe/Paris").hour, 0);
});

test("the field's own prefilled value settles which number comes first", () => {
  // A day above twelve can only be a day.
  assert.equal(dateOrder("31/07/2026", "en-US"), "dmy");
  // A second number above twelve can only be a day, so the month came first.
  assert.equal(dateOrder("07/31/2026", "fr-FR"), "mdy");
  // Ambiguous, so the browser locale decides.
  assert.equal(dateOrder("07/08/2026", "en-US"), "mdy");
  assert.equal(dateOrder("07/08/2026", "fr-FR"), "dmy");
  // Nothing to read at all: same fallback.
  assert.equal(dateOrder("", "en-GB"), "dmy");
  assert.equal(dateOrder("", "en-US"), "mdy");
});

test("the date is written the way the field asked for it", () => {
  const p = { day: 3, month: 9, year: 2026 };
  assert.equal(formatDateFor("dmy", p), "03/09/2026");
  assert.equal(formatDateFor("mdy", p), "09/03/2026");
});

/**
 * A carousel is a LinkedIn document post, and a document post will not continue
 * without a title. Leaving it empty keeps Next disabled, so the post simply
 * never goes out: the failure is a timeout rather than an error, which is the
 * hardest kind to read in a log.
 */
test("a document gets a title taken from the post's own opening line", () => {
  assert.equal(documentTitleFrom("Five things I got wrong\n\nAnd here they are"), "Five things I got wrong");
  // Leading blank lines are skipped rather than yielding an empty title.
  assert.equal(documentTitleFrom("\n\n  Hello there  \nmore"), "Hello there");
  // Long openings are cut at a word, never mid-word, and never left on punctuation.
  const long = documentTitleFrom(
    "This opening line is deliberately far longer than sixty characters, to see where it lands"
  );
  assert.ok(long.length <= 60, `title is ${long.length} characters`);
  assert.ok(!long.endsWith(" ") && !/[,;:.-]$/.test(long), `title ends badly: "${long}"`);
  assert.ok(!/\S$/.test(long) || long.split(" ").length > 1, "the title was cut mid-word");
  // Never empty: an empty title is exactly the state that blocks the post.
  assert.equal(documentTitleFrom("   \n  "), "Document");
});

test("the clock is twelve-hour or twenty-four, and noon and midnight are not swapped", () => {
  assert.equal(formatTimeFor("h24", { hour: 9, minute: 0 }), "09:00");
  assert.equal(formatTimeFor("h12", { hour: 9, minute: 0 }), "9:00 AM");
  assert.equal(formatTimeFor("h12", { hour: 13, minute: 5 }), "1:05 PM");
  // The two that a naive modulo gets wrong.
  assert.equal(formatTimeFor("h12", { hour: 0, minute: 30 }), "12:30 AM");
  assert.equal(formatTimeFor("h12", { hour: 12, minute: 30 }), "12:30 PM");
});

/**
 * A stand-in for a Playwright Locator, carrying only what `actionable` uses:
 * evaluate against the element itself, and a query for its descendants.
 */
function fakeLocator(node: {
  tag: string;
  role?: string | null;
  inner?: { visible: boolean; name: string }[];
}): unknown {
  const inner = node.inner ?? [];
  const list = {
    count: async () => inner.length,
    nth: (i: number) => ({
      isVisible: async () => inner[i]?.visible ?? false,
      name: inner[i]?.name,
    }),
  };
  return {
    evaluate: async (fn: (el: unknown) => boolean) =>
      fn({
        tagName: node.tag.toUpperCase(),
        getAttribute: (attr: string) => (attr === "role" ? (node.role ?? null) : null),
      }),
    locator: () => list,
  };
}

test("a control that matched directly is the one clicked", async () => {
  const button = fakeLocator({ tag: "button" });
  assert.equal(await actionable(button as never), button);

  const link = fakeLocator({ tag: "a" });
  assert.equal(await actionable(link as never), link);

  const div = fakeLocator({ tag: "div", role: "button" });
  assert.equal(await actionable(div as never), div);
});

test("a wrapper hands back the control inside it rather than swallowing the click", async () => {
  const wrapper = fakeLocator({
    tag: "div",
    inner: [
      { visible: false, name: "hidden" },
      { visible: true, name: "the real button" },
    ],
  });
  const chosen = (await actionable(wrapper as never)) as unknown as { name?: string };
  assert.equal(chosen.name, "the real button", "the click would have landed on the wrapper");
});

test("a wrapper with nothing to press stays itself, so the caller still fails loudly", async () => {
  const empty = fakeLocator({ tag: "div" });
  assert.equal(await actionable(empty as never), empty);
});
