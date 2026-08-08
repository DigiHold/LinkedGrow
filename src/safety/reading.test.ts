import { test } from "node:test";
import assert from "node:assert/strict";
import { budgetFor, dayAllowance, tierOf } from "./reading.ts";

/**
 * The numbers, and the two times they were wrong.
 *
 * First a flat 60 profiles a day, from the "80 a day on a free account" that
 * automation blogs copy from each other. Then 200 a month, roughly 16 a day,
 * after reading the shape of LinkedIn's commercial use limit correctly and then
 * picking a figure from the same blogs anyway. Both were refuted by evidence we
 * already had: a free account has opened 60-plus profiles by hand in a day
 * without a word from LinkedIn, and a free account on a competing tool has run
 * far above 16 a day for months.
 *
 * What LinkedIn does publish is that it publishes nothing: "We are not able to
 * display the exact number of searches or views you have left." So the shape is
 * what these tests hold, plus the one hard product constraint underneath it.
 */

test("a free account can find around a hundred people a day, or it is not a product", () => {
  // 16 leads a day is roughly 10 qualified a week. That is unsellable, and it
  // is the exact failure the 200-a-month version shipped.
  const mature = dayAllowance("free", "profiles", 0, 365);
  assert.ok(mature >= 60, `a free account reads ${mature} a day, which is too few to sell`);
  assert.ok(mature <= 120, `a free account reads ${mature} a day, which is past a human`);
});

test("searches stay tight, because that is the limit LinkedIn admits exists", () => {
  // The commercial use limit is monthly and pooled, and the industry puts a
  // free account somewhere around 250 to 300 searches in it.
  assert.ok(budgetFor("free").searchesPerMonth <= 300);
  const daily = dayAllowance("free", "searches", 0, 365);
  assert.ok(daily > 0 && daily <= 12, `${daily} searches a day is not a person browsing`);
});

test("running out of searches is far cheaper than running out of profiles", () => {
  for (const tier of ["free", "premium", "sales_navigator"] as const) {
    const b = budgetFor(tier);
    assert.ok(
      b.profilesPerMonth > b.searchesPerMonth * 2,
      `${tier} should read far more people than it searches`
    );
  }
});

test("a month cannot be emptied in a day, whatever the tier", () => {
  for (const tier of ["free", "premium", "sales_navigator"] as const) {
    const month = budgetFor(tier).profilesPerMonth;
    const firstDay = dayAllowance(tier, "profiles", 0, 365);
    assert.ok(firstDay < month / 4, `${tier} could spend ${firstDay} of its ${month} on day one`);
  }
});

test("the pace is flat, so the 28th reads like the 2nd", () => {
  const early = dayAllowance("free", "profiles", 100, 365);
  const late = dayAllowance("free", "profiles", 1_800, 365);
  assert.equal(early, late, "a share-of-what-is-left model starves the end of the month");
});

test("a spent month reads nothing rather than a little", () => {
  assert.equal(dayAllowance("free", "profiles", 2_400, 365), 0);
  assert.equal(dayAllowance("premium", "profiles", 99_999, 365), 0);
  assert.equal(dayAllowance("free", "searches", 240, 365), 0);
});

test("what is left caps the day, even when the pace would allow more", () => {
  const budget = budgetFor("free").profilesPerMonth;
  assert.equal(dayAllowance("free", "profiles", budget - 7, 365), 7);
});

test("a new account reads less than an established one", () => {
  assert.ok(
    dayAllowance("free", "profiles", 0, 0) < dayAllowance("free", "profiles", 0, 60),
    "a profile that started yesterday is read differently from one that did not"
  );
});

test("each tier reads and searches more than the one below it", () => {
  assert.ok(budgetFor("premium").profilesPerMonth > budgetFor("free").profilesPerMonth);
  assert.ok(budgetFor("premium").searchesPerMonth > budgetFor("free").searchesPerMonth);
  assert.ok(
    budgetFor("sales_navigator").profilesPerMonth > budgetFor("premium").profilesPerMonth
  );
  assert.ok(
    budgetFor("sales_navigator").searchesPerMonth > budgetFor("premium").searchesPerMonth
  );
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
 * counting a single person read.
 */
test("a free account now runs fewer searches in a month than it used to run in a day", () => {
  const whatOneDayUsedToCost = 112;
  assert.ok(dayAllowance("free", "searches", 0, 365) < whatOneDayUsedToCost / 8);
});
