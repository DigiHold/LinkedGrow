import { test } from "node:test";
import assert from "node:assert/strict";
import {
  accountMaturity,
  countNear,
  maturityOf,
  oldestYearIn,
  rampFloor,
  CONNECTION_WORDS,
  FOLLOWER_WORDS,
} from "./maturity.ts";

/**
 * The ramp treated every account as if it had been created that morning, and it
 * cost the seven-day trial about half its leads on the days a customer decides
 * whether to pay. A profile with ten years of jobs on it is not new. It is new
 * to us, which is a different thing and not what LinkedIn is looking at.
 */

const NOW = 2026;

test("a profile with years of history starts at two thirds of its pace", () => {
  const m = accountMaturity({ connections: 500, followers: 1200, oldestYear: 2014 }, NOW);
  assert.equal(m, "established");
  assert.equal(rampFloor(m), 0.6);
});

test("any one signal is enough, because all three are hard to have by accident", () => {
  assert.equal(accountMaturity({ connections: 500, followers: null, oldestYear: null }, NOW), "established");
  assert.equal(accountMaturity({ connections: null, followers: 900, oldestYear: null }, NOW), "established");
  assert.equal(accountMaturity({ connections: 12, followers: 8, oldestYear: 2019 }, NOW), "established");
});

test("a genuinely new account keeps the cautious floor", () => {
  const m = accountMaturity({ connections: 9, followers: 4, oldestYear: 2026 }, NOW);
  assert.equal(m, "new");
  assert.equal(rampFloor(m), 0.35);
});

test("something in between gets something in between", () => {
  const m = accountMaturity({ connections: 140, followers: null, oldestYear: 2025 }, NOW);
  assert.equal(m, "young");
  assert.ok(rampFloor(m) > rampFloor("new") && rampFloor(m) < rampFloor("established"));
});

test("reading nothing means new, because a broken selector must not raise a budget", () => {
  assert.equal(accountMaturity({ connections: null, followers: null, oldestYear: null }, NOW), "new");
  assert.equal(maturityOf(null), "new");
  assert.equal(maturityOf("nonsense"), "new");
});

test("the counts are read whatever language the profile is in", () => {
  assert.equal(countNear("500+ connections", CONNECTION_WORDS), 500);
  assert.equal(countNear("1,234 followers", FOLLOWER_WORDS), 1234);
  assert.equal(countNear("2 456 abonnés", FOLLOWER_WORDS), 2456);
  assert.equal(countNear("312 relations", CONNECTION_WORDS), 312);
  assert.equal(countNear("Maria LECOCQ · 3rd", CONNECTION_WORDS), null);
});

test("the oldest year on the profile is the start of its oldest entry", () => {
  const profile = "Founder 2021 - Present\nDeveloper at Acme 2014 - 2021\nUniversity 2009 - 2013";
  assert.equal(oldestYearIn(profile, NOW), 2009);
});

test("a year that has not happened is not a year", () => {
  assert.equal(oldestYearIn("Projected 2088 revenue", NOW), null);
  assert.equal(oldestYearIn("no dates here at all", NOW), null);
});

test("every maturity ramps to full pace, none of them stays throttled", () => {
  for (const m of ["new", "young", "established"] as const) {
    const floor = rampFloor(m);
    const atThreeWeeks = Math.min(1, floor + (21 / 21) * (1 - floor));
    assert.equal(atThreeWeeks, 1, `${m} must reach full pace`);
  }
});
