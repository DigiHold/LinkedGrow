import { test } from "node:test";
import assert from "node:assert/strict";
import { pointIsOn } from "./human.ts";

/**
 * The check that decides whether a press is still aimed at its element.
 *
 * Both of the 2026-09-09 incidents on Nicolas's account were a press landing
 * where the element used to be: one reposted his own post, one missed the
 * composer's Add media button and failed the post three times.
 */
test("a point on the element presses it", () => {
  const box = { x: 100, y: 200, width: 40, height: 20 };
  assert.equal(pointIsOn({ x: 120, y: 210 }, box), true);
  assert.equal(pointIsOn({ x: 100, y: 200 }, box), true, "the top left corner is on it");
  assert.equal(pointIsOn({ x: 140, y: 220 }, box), true, "so is the bottom right");
});

test("a point the element has moved away from is not pressed", () => {
  // The composer grew under a long post and its bottom bar went down 60px.
  const moved = { x: 100, y: 260, width: 40, height: 20 };
  assert.equal(pointIsOn({ x: 120, y: 210 }, moved), false);

  // The comment box slid down while the post's image finished loading, and
  // the action bar with Repost on it took the old spot.
  const slid = { x: 100, y: 340, width: 200, height: 60 };
  assert.equal(pointIsOn({ x: 150, y: 300 }, slid), false);
});
