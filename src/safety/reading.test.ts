import { test } from "node:test";
import assert from "node:assert/strict";
import { budgetFor, dayAllowance, tierOf } from "./reading.ts";

/**
 * The shape is the thing being tested, not the numbers.
 *
 * LinkedIn publishes no figure and says so on its own help page: "We are not
 * able to display the exact number of searches or views you have left." What is
 * documented is the shape, and it is what the first version of this file got
 * wrong. The commercial use limit is one pooled monthly allowance fed by
 * searching and by viewing profiles outside your network, not a daily cap on
 * views. That is why a person can open eighty profiles in an afternoon and hear
 * nothing about it.
 */

test("a month cannot be emptied in a day, whatever the tier", () => {
  for (const tier of ["free", "premium", "sales_navigator"] as const) {
    const month = budgetFor(tier).actionsPerMonth;
    const firstDay = dayAllowance(tier, 0, 365);
    assert.ok(
      firstDay < month / 4,
      `${tier} could spend ${firstDay} of its ${month} on day one`
    );
  }
});

test("the pace slows on its own as the month is spent", () => {
  const fresh = dayAllowance("free", 0, 365);
  const half = dayAllowance("free", budgetFor("free").actionsPerMonth / 2, 365);
  assert.ok(half < fresh, "a half-spent month must read less than an empty one");
  assert.equal(dayAllowance("free", budgetFor("free").actionsPerMonth, 365), 0);
});

test("a spent month reads nothing rather than a little", () => {
  assert.equal(dayAllowance("premium", 10_000, 365), 0);
});

test("a new account reads less than an established one", () => {
  assert.ok(dayAllowance("free", 0, 0) < dayAllowance("free", 0, 60));
});

test("a nearly empty month still returns the floor, so a pass is never pointless", () => {
  const nearly = budgetFor("free").actionsPerMonth - 12;
  assert.ok(dayAllowance("free", nearly, 365) > 0);
});

test("each tier reads more than the one below it", () => {
  assert.ok(budgetFor("premium").actionsPerMonth > budgetFor("free").actionsPerMonth);
  assert.ok(
    budgetFor("sales_navigator").actionsPerMonth > budgetFor("premium").actionsPerMonth
  );
});

test("free stays under the bottom of the range the industry reports", () => {
  // 250 to 350 actions a month is what tool vendors observe on a free account.
  assert.ok(budgetFor("free").actionsPerMonth < 250);
});

test("an unknown or missing tier is treated as the tightest one", () => {
  assert.equal(tierOf(null), "free");
  assert.equal(tierOf("something else"), "free");
  assert.equal(tierOf("premium"), "premium");
  assert.equal(tierOf("sales_navigator"), "sales_navigator");
});

/**
 * The day this replaces. Sourcing ran 56 to 75 passes on the days before the
 * restriction, two sources each, which is over a hundred searches a day before
 * counting a single profile.
 */
test("a free account now spends less in a month than it used to spend in a day", () => {
  const whatOneDayUsedToCost = 112;
  assert.ok(dayAllowance("free", 0, 365) < whatOneDayUsedToCost / 4);
});
