import { test } from "node:test";
import assert from "node:assert/strict";
import { dayPlan } from "./rhythm.ts";
import { dayAllowance, roomFrom } from "./reading.ts";
import { readingShape, searchCost } from "../linkedin/sourcing.ts";

/**
 * The three pieces, run together as one day.
 *
 * rhythm.ts decides when the account is on LinkedIn, reading.ts decides how
 * much it may read while it is there, and sourcing.ts decides how deep to go
 * into each source. Each has its own tests and each was correct on its own on
 * 2026-08-08; the account was restricted anyway, because nothing checked what
 * the three of them added up to over a day. This file is that check.
 */

const ACCOUNT = "88c3d39f-1925-4ed8-a64e-a1f4d02c1b13";

/** The shape of an agent's sources, which decides what its day costs in searches. */
const COMPETITOR_LED = ["competitor", "competitor", "keyword", "brand"];
const SEARCH_LED = ["keyword", "market", "linkedin_search", "buying_event"];

interface DayResult {
  visits: number;
  profiles: number;
  searches: number;
}

/**
 * One account's day, walked visit by visit exactly as the worker walks it.
 *
 * Every number below comes from the real functions. Nothing here re-implements
 * the budget: an earlier version of this file did, the copy drifted from
 * reading.ts, and the drift hid the overrun this file exists to catch.
 */
function walkDay(accountId: string, day: string, weekday: number, types: string[], ageDays = 365): DayResult {
  const plan = dayPlan(accountId, day, weekday);
  const profileDay = dayAllowance("free", "profiles", 0, ageDays);
  const searchDay = dayAllowance("free", "searches", 0, ageDays);

  const spent = { profiles: 0, searches: 0 };

  for (let index = 0; index < plan.length; index += 1) {
    const pace = { index, count: plan.length };
    // Every visit runs several passes, because the agent loop comes round while
    // the visit is open. The second and later passes find the visit's share
    // already spent, which is what stops one visit eating the day.
    for (let pass = 0; pass < 6; pass += 1) {
      const room = roomFrom(profileDay, searchDay, spent, pace);
      if (!room.ok) break;

      const maxSources = Math.max(1, Math.min(2, Math.floor(room.profiles / 10)));
      const chosen: string[] = [];
      let left = room.searches;
      for (const type of types) {
        if (chosen.length >= maxSources) break;
        const cost = searchCost(type);
        if (cost > left) continue;
        left -= cost;
        chosen.push(type);
      }
      if (chosen.length === 0) break;

      const shape = readingShape(Math.floor(room.profiles / chosen.length), { perPost: 25, posts: 4 });
      for (const type of chosen) {
        spent.searches += searchCost(type);
        spent.profiles += shape.posts * shape.perPost;
      }
    }
  }

  return { visits: plan.length, profiles: spent.profiles, searches: spent.searches };
}

test("a working day finds enough people to be worth paying for", () => {
  const day = walkDay(ACCOUNT, "2026-08-10", 1, COMPETITOR_LED);
  assert.ok(day.visits >= 3, `only ${day.visits} visits planned`);
  assert.ok(
    day.profiles >= 60,
    `${day.profiles} people a day is the 16-a-day failure again`
  );
});

test("a day never reads more than the day allows, however many passes run", () => {
  const allowed = dayAllowance("free", "profiles", 0, 365);
  for (const types of [COMPETITOR_LED, SEARCH_LED]) {
    for (let i = 1; i <= 28; i += 1) {
      const day = `2026-08-${String(i).padStart(2, "0")}`;
      const weekday = (((i + 4) % 7) + 1) as number;
      const result = walkDay(ACCOUNT, day, weekday, types);
      assert.ok(
        result.profiles <= allowed,
        `${day} read ${result.profiles} against an allowance of ${allowed}`
      );
    }
  }
});

test("a search-led agent runs out of searches long before it runs out of reading", () => {
  const searchLed = walkDay(ACCOUNT, "2026-08-10", 1, SEARCH_LED);
  const engagementLed = walkDay(ACCOUNT, "2026-08-10", 1, COMPETITOR_LED);
  assert.ok(
    searchLed.searches <= dayAllowance("free", "searches", 0, 365),
    "the commercial use limit is the one LinkedIn admits to, so it must bind"
  );
  assert.ok(
    engagementLed.profiles >= searchLed.profiles,
    "reading comment sections must never be the more expensive option"
  );
});

test("a month stays inside the monthly pools", () => {
  let profiles = 0;
  let searches = 0;
  for (let i = 1; i <= 31; i += 1) {
    const day = `2026-08-${String(i).padStart(2, "0")}`;
    const weekday = (((i + 4) % 7) + 1) as number;
    const result = walkDay(ACCOUNT, day, weekday, COMPETITOR_LED);
    profiles += result.profiles;
    searches += result.searches;
  }
  assert.ok(profiles <= 2_400, `a month read ${profiles} against a pool of 2400`);
  assert.ok(searches <= 240, `a month ran ${searches} searches against a pool of 240`);
  // The other half of the bargain: the pool exists to be used, not admired.
  assert.ok(profiles >= 1_000, `a month found only ${profiles} people, which is not a product`);
});

test("a brand-new account starts slower and reaches full pace within three weeks", () => {
  const dayOne = walkDay(ACCOUNT, "2026-08-10", 1, COMPETITOR_LED, 0);
  const grown = walkDay(ACCOUNT, "2026-08-10", 1, COMPETITOR_LED, 30);
  assert.ok(dayOne.profiles < grown.profiles, "a cold account must not open at full speed");
  assert.ok(dayOne.profiles > 0, "and it must not open at zero either");
});
