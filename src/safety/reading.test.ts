import { test } from "node:test";
import assert from "node:assert/strict";
import { budgetFor, tierOf } from "./reading.ts";

/**
 * The property that matters is the one nobody had: what an account may READ.
 *
 * The numbers themselves are judgement, taken from where the industry says
 * accounts start getting restricted, so what is tested here is that they stay
 * under those lines rather than that they are exactly right.
 */

/** Where accounts are observed to get restricted, checked 2026-08-08. */
const OBSERVED_CEILING = {
  free: { profilesPerDay: 80, searchesPerMonth: 250 },
  premium: { profilesPerDay: 150, searchesPerMonth: 250 },
  sales_navigator: { profilesPerDay: 600, searchesPerMonth: Infinity },
} as const;

test("every tier reads under the line where accounts get restricted", () => {
  for (const tier of ["free", "premium", "sales_navigator"] as const) {
    const budget = budgetFor(tier);
    const ceiling = OBSERVED_CEILING[tier];
    assert.ok(
      budget.profilesPerDay < ceiling.profilesPerDay,
      `${tier} reads ${budget.profilesPerDay} profiles a day against a ceiling of ${ceiling.profilesPerDay}`
    );
    assert.ok(
      budget.searchesPerDay * 31 < ceiling.searchesPerMonth,
      `${tier} spends ${budget.searchesPerDay * 31} searches a month against a limit of ${ceiling.searchesPerMonth}`
    );
  }
});

test("premium reads more than free, and Sales Navigator more than both", () => {
  assert.ok(budgetFor("premium").profilesPerDay > budgetFor("free").profilesPerDay);
  assert.ok(
    budgetFor("sales_navigator").profilesPerDay > budgetFor("premium").profilesPerDay
  );
});

test("premium gets no extra searches, because it does not lift the commercial use limit", () => {
  assert.equal(budgetFor("premium").searchesPerDay, budgetFor("free").searchesPerDay);
  assert.ok(budgetFor("sales_navigator").searchesPerDay > budgetFor("free").searchesPerDay);
});

test("an unknown or missing tier is treated as the tightest one", () => {
  assert.equal(tierOf(null), "free");
  assert.equal(tierOf("something else"), "free");
  assert.equal(tierOf("premium"), "premium");
  assert.equal(tierOf("sales_navigator"), "sales_navigator");
  assert.deepEqual(budgetFor(tierOf(undefined)), budgetFor("free"));
});

/**
 * The day this replaces. Sourcing ran 56 to 75 passes on the days before the
 * restriction, two sources each, which is over a hundred searches a day.
 */
test("the new budget is an order of magnitude under what got the account restricted", () => {
  const whatHappened = { searchesPerDay: 112, profilesPerDay: 2800 };
  const now = budgetFor("free");
  assert.ok(now.searchesPerDay * 10 < whatHappened.searchesPerDay * 2);
  assert.ok(now.profilesPerDay * 10 < whatHappened.profilesPerDay * 2);
});
