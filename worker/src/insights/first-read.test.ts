import { test } from "node:test";
import assert from "node:assert/strict";
import { isStale, FIRST_READ_MAX_AGE } from "./store.ts";

const DAY = 24 * 3600;
const now = 2_000_000_000;

test("a post never read gets its first read even past the thirty day schedule", () => {
  assert.equal(isStale(now - 120 * DAY, null, now), true);
});

test("the first read stops at six months", () => {
  assert.equal(isStale(now - FIRST_READ_MAX_AGE - DAY, null, now), false);
});

test("a post read once and older than thirty days is left alone", () => {
  assert.equal(isStale(now - 120 * DAY, now - 90 * DAY, now), false);
});

test("a fresh post keeps its frequent schedule", () => {
  assert.equal(isStale(now - 1 * DAY, now - 4 * 3600, now), true);
  assert.equal(isStale(now - 1 * DAY, now - 1 * 3600, now), false);
});

test("a first read that failed is tried again the next day, not frozen", () => {
  assert.equal(isStale(now - 120 * DAY, now - 2 * DAY, now, false), true);
  assert.equal(isStale(now - 120 * DAY, now - 3600, now, false), false);
});

test("a post with no numbers past six months is let go", () => {
  assert.equal(isStale(now - FIRST_READ_MAX_AGE - DAY, now - 2 * DAY, now, false), false);
});
