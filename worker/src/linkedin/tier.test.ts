import { test } from "node:test";
import assert from "node:assert/strict";
import { tierFromSignals, type TierSignals } from "./tier.ts";

/**
 * The tier decides how much an account may read, and it said `free` for
 * everybody because nothing ever wrote to it. What these tests hold is the
 * judgement, not the selectors: the selectors cannot be checked against a live
 * account today, so the logic around them has to be right first.
 */

function signals(partial: Partial<TierSignals>): TierSignals {
  return { hrefs: [], text: "", badges: [], ...partial };
}

test("a Sales Navigator link a subscriber has means Sales Navigator", () => {
  const reading = tierFromSignals(
    signals({ hrefs: ["https://www.linkedin.com/sales/index"] })
  );
  assert.equal(reading.tier, "sales_navigator");
  assert.ok(reading.confident);
});

test("the Sales Navigator upsell everybody sees means nothing", () => {
  // /sales/solutions is the marketing page linked from the app grid for every
  // account on the platform. Matching it would hand the widest reading budget
  // we have to a free account.
  const reading = tierFromSignals(
    signals({ hrefs: ["https://business.linkedin.com/sales-solutions", "https://www.linkedin.com/sales/solutions/overview"] })
  );
  assert.notEqual(reading.tier, "sales_navigator");
  assert.equal(reading.confident, false);
});

test("the manage-your-Premium link means Premium", () => {
  const reading = tierFromSignals(
    signals({ hrefs: ["https://www.linkedin.com/premium/my-premium/"] })
  );
  assert.equal(reading.tier, "premium");
  assert.ok(reading.confident);
});

test("the gold badge means Premium", () => {
  const reading = tierFromSignals(signals({ badges: ["Premium account"] }));
  assert.equal(reading.tier, "premium");
  assert.ok(reading.confident);
});

test("the Premium upsell is the one thing that proves an account is free", () => {
  for (const line of [
    "Try Premium for CHF0",
    "Retry Premium for CHF0",
    "Reactivate Premium",
    "Essayer Premium gratuitement",
  ]) {
    const reading = tierFromSignals(signals({ text: line }));
    assert.equal(reading.tier, "free", line);
    assert.ok(reading.confident, `${line} should be positive evidence, not an absence`);
  }
});

test("a page that says nothing changes nothing", () => {
  const reading = tierFromSignals(
    signals({ hrefs: ["https://www.linkedin.com/feed/"], text: "Start a post" })
  );
  assert.equal(reading.confident, false);
  // The caller leaves the tier alone on this, which is the whole point: a
  // selector that stops matching must not reclassify the fleet as free.
});

test("Sales Navigator wins over Premium, because it is the higher of the two", () => {
  const reading = tierFromSignals(
    signals({
      hrefs: ["https://www.linkedin.com/sales/home", "https://www.linkedin.com/premium/my-premium/"],
      badges: ["Premium"],
    })
  );
  assert.equal(reading.tier, "sales_navigator");
});

test("an upsell alongside a real subscription does not demote the account", () => {
  // LinkedIn shows Premium holders an upsell for the tier above theirs.
  const reading = tierFromSignals(
    signals({
      hrefs: ["https://www.linkedin.com/premium/my-premium/"],
      text: "Try Premium Business for CHF0",
    })
  );
  assert.equal(reading.tier, "premium");
});

test("every reading says what it saw, so the first live run is readable", () => {
  const reading = tierFromSignals(signals({ badges: ["Premium"] }));
  assert.ok(reading.seen.length > 0);
  assert.ok(reading.seen.every((s) => s.length > 0));
});
