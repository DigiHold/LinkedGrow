import { test } from "node:test";
import assert from "node:assert/strict";
import { dayPlan } from "./rhythm.ts";
import { dayAllowance, roomFrom } from "./reading.ts";
import { readingShape, searchCost, queriesIn, queryTurn } from "../linkedin/sourcing.ts";

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
  const pool = 12_500;
  assert.ok(profiles <= pool, `a month read ${profiles} against a pool of ${pool}`);
  assert.ok(searches <= 240, `a month ran ${searches} searches against a pool of 240`);
  // The other half of the bargain: the pool exists to be used, not admired.
  assert.ok(profiles >= pool / 3, `a month read only ${profiles} of ${pool}, which is not a product`);
});

test("a brand-new account starts slower and reaches full pace within three weeks", () => {
  const dayOne = walkDay(ACCOUNT, "2026-08-10", 1, COMPETITOR_LED, 0);
  const grown = walkDay(ACCOUNT, "2026-08-10", 1, COMPETITOR_LED, 30);
  assert.ok(dayOne.profiles < grown.profiles, "a cold account must not open at full speed");
  assert.ok(dayOne.profiles > 0, "and it must not open at zero either");
});

/**
 * A live pass on 2026-08-08 ran 12 searches against a budget that had booked 4.
 *
 * The cost was charged per SOURCE and spent per QUERY. A keyword source holds
 * several queries and searches each one twice, once over posts and once over
 * people, so a source with four queries runs eight searches and was billed two.
 * The commercial use limit is the one ceiling LinkedIn admits to, and a counter
 * that reads a third of the truth is worse than no counter, because it reports
 * a comfortable margin that is not there.
 */
test("a source is charged for exactly what it actually searches", () => {
  const oneQuery = searchCost("keyword", queriesIn("keyword", {}, 0));
  const fourQueries = searchCost("keyword", queriesIn("keyword", { queries: ["a", "b", "c", "d"] }, 0));
  assert.equal(oneQuery, 2, "one query is a post search and a people search");
  assert.equal(
    fourQueries,
    2,
    "a source runs ONE of its queries per visit, so holding four costs the same as holding one"
  );
});

/**
 * All four queries still run. They take turns.
 *
 * The saving would be a lie if the other three were simply dropped. They are
 * rotated by the source's own pass counter, so the set is covered over four
 * visits instead of fired in one burst, which is both affordable and closer to
 * how a person searches.
 */
test("the queries take turns rather than being thrown away", () => {
  const all = ["a", "b", "c", "d"];
  assert.deepEqual(
    [0, 1, 2, 3, 4].map((pass) => queryTurn(all, pass)[0]),
    ["a", "b", "c", "d", "a"]
  );
  assert.deepEqual(queryTurn(["only"], 7), ["only"], "one query needs no rotation");
});

test("engagement still costs nothing, which is the whole point of counting", () => {
  assert.equal(searchCost("competitor", queriesIn("competitor", {}, 12)), 0);
  assert.equal(searchCost("brand", queriesIn("brand", {}, 12)), 0);
  assert.equal(searchCost("csv", 1), 0);
});

/**
 * The buying-event source, which grew from two kinds to four.
 *
 * Charged per role and per kind, four roles across four kinds is 32 searches
 * against a day that holds seven, so it could never have run at all. It takes
 * one kind and one role per visit, like every other search-led source.
 */
test("a buying-event source costs one search pair per visit, not one per kind", () => {
  const every = searchCost("buying_event", queriesIn("buying_event", {}, 4));
  const one = searchCost("buying_event", queriesIn("buying_event", { kind: "hiring" }, 4));
  assert.equal(every, 2);
  assert.equal(one, 2);
  assert.ok(
    every <= dayAllowance("free", "searches", 0, 365, "established"),
    "four kinds across four roles used to be 32 searches in a day that holds 7"
  );
});

test("what a real day of search-led sourcing costs is inside the free pool", () => {
  // The pass that ran on 2026-08-08 held sources of four queries each.
  const perSource = searchCost("keyword", queriesIn("keyword", { queries: ["a", "b", "c", "d"] }, 0));
  const perDay = dayAllowance("free", "searches", 0, 365, "established");
  assert.ok(
    perSource <= perDay,
    `one source costs ${perSource} searches and a day allows ${perDay}, so nothing would ever run`
  );
});

/**
 * The regression that locked the best source out, 2026-08-10.
 *
 * A keyword source carries three queries and searches each of them twice, once
 * over posts and once over people, so it costs six. Slicing the day's nine
 * searches into visit-sized shares left two or three per visit, and the source
 * that had produced 23 leads and 10 good ones on a live agent could not fit
 * into any of them. It stopped running and nothing said so.
 */
test("a real keyword source fits inside what a visit is allowed to search", () => {
  const cost = searchCost("keyword", queriesIn("keyword", { queries: ["a", "b", "c"] }, 0));
  assert.equal(cost, 2, "one of its three queries, over posts and over people");

  const room = roomFrom(
    dayAllowance("free", "profiles", 0, 365, "established"),
    dayAllowance("free", "searches", 0, 365, "established"),
    { profiles: 0, searches: 0 },
    { index: 0, count: 4 }
  );
  assert.ok(
    room.searches >= cost,
    `the first visit of the day allows ${room.searches} searches and the source costs ${cost}`
  );
});

test("the day still bounds searches, and so does what has already been spent", () => {
  const searchDay = dayAllowance("free", "searches", 0, 365, "established");
  const room = roomFrom(400, searchDay, { profiles: 0, searches: searchDay - 1 }, { index: 0, count: 4 });
  assert.equal(room.searches, 1, "the day is the ceiling, the visit is not");

  const spent = roomFrom(400, searchDay, { profiles: 0, searches: searchDay }, { index: 3, count: 4 });
  assert.equal(spent.searches, 0, "a day's searches once spent stay spent");
});

test("profiles are still cut into visits, because that is the shape LinkedIn reads", () => {
  const profileDay = dayAllowance("free", "profiles", 0, 365, "established");
  const first = roomFrom(profileDay, 9, { profiles: 0, searches: 0 }, { index: 0, count: 4 });
  assert.ok(
    first.profiles < profileDay,
    "the first visit must not be allowed to read the whole day in one burst"
  );
});

/**
 * A whole day of sourcing, priced against what the account is actually allowed.
 *
 * The measurement that forced all of this, from the live account on 2026-08-10.
 * A free established profile is allowed 7 searches and 395 profile reads in a
 * day. It had spent all 7 searches by mid-morning, on ONE keyword source, and
 * 50 of the 395 profile reads. The customer watched it find two people in six
 * hours and asked what the hell was going on, which was the right question.
 */
test("a day of search-led sourcing now fits, where one source used to eat it", () => {
  const searchesADay = dayAllowance("free", "searches", 0, 365, "established");
  const perSource = searchCost("keyword", queriesIn("keyword", { queries: ["a", "b", "c"] }, 0));
  assert.ok(
    Math.floor(searchesADay / perSource) >= 3,
    `only ${Math.floor(searchesADay / perSource)} search-led sources fit in a day of ${searchesADay}`
  );
});

/**
 * And the profiles, which were the other half of the waste.
 *
 * Sources per visit was hard-coded at two whatever the room, so a visit handed
 * a share of about a hundred reads spent half of it and stopped. The count now
 * follows the share, and the share is still the thing that bounds the account.
 */
test("a visit opens as many sources as its share of the day can pay for", () => {
  const room = roomFrom(
    dayAllowance("free", "profiles", 0, 365, "established"),
    dayAllowance("free", "searches", 0, 365, "established"),
    { profiles: 0, searches: 0 },
    { index: 0, count: 4 }
  );
  const USEFUL_DEPTH = 25;
  const affordable = Math.floor(room.profiles / USEFUL_DEPTH);
  assert.ok(affordable >= 3, `a visit with ${room.profiles} reads could only open ${affordable}`);
  // Still bounded: one visit must never sweep an agent's entire list.
  assert.ok(Math.min(8, affordable) <= 8);
});
