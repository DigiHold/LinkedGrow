import { test } from "node:test";
import assert from "node:assert/strict";
import { reactionRange } from "./miner.ts";

/**
 * Why the agent stopped finding people, in one function.
 *
 * mineTarget opened a competitor's page, scrolled a little and read the first
 * few posts. Every pass, for ever. The people under those posts are claimed on
 * the first pass, and every pass after it returns the same names for the
 * deduplication to throw away.
 *
 * Measured on the real agent between 2026-08-01 and 2026-08-08: **54 of 65
 * sourcing passes found nobody**, and the 11 that found somebody were almost
 * all on the first day. 75 leads on day one, then four days of nothing, then 6
 * and 8 and 1. No reading budget was involved in any of that; the miner was
 * reading the same four posts of a feed that holds months of them.
 */

test("the first pass reads the top of the feed", () => {
  assert.deepEqual(reactionRange(20, 4, 0), [0, 1, 2, 3]);
});

test("the next pass reads posts the last one never opened", () => {
  const first = reactionRange(20, 4, 0);
  const second = reactionRange(20, 4, 4);
  assert.deepEqual(second, [4, 5, 6, 7]);
  assert.equal(
    first.filter((i) => second.includes(i)).length,
    0,
    "two consecutive passes must not read one post in common"
  );
});

test("a walk down a feed covers every post rather than circling the top", () => {
  const seen = new Set<number>();
  for (let skip = 0; skip < 24; skip += 4) {
    for (const i of reactionRange(30, 4, skip)) seen.add(i);
  }
  assert.equal(seen.size, 24, "six passes should cover twenty-four distinct posts");
});

test("a short feed is not walked off the end", () => {
  // A company with three posts, asked to start at post 13.
  const range = reactionRange(3, 4, 12);
  assert.ok(range.every((i) => i < 3), "no index may point past what is loaded");
  assert.deepEqual(range, [2]);
});

test("an empty feed asks for nothing", () => {
  assert.deepEqual(reactionRange(0, 4, 0), []);
  assert.deepEqual(reactionRange(0, 4, 8), []);
});

test("the cap still bounds a pass, however deep it starts", () => {
  assert.equal(reactionRange(100, 4, 50).length, 4);
  assert.equal(reactionRange(100, 1, 50).length, 1);
});
