import { test } from "node:test";
import assert from "node:assert/strict";
import { activityForShare } from "./insights.ts";

// Both pairs read off Enrique's own posts on 2026-10-01.
test("the activity made with the share is the one picked", () => {
  assert.equal(
    activityForShare("7493208656969162752", [
      "urn:li:activity:7493208658084986880",
    ]),
    "urn:li:activity:7493208658084986880"
  );
});

test("other activities on the page do not get in the way", () => {
  assert.equal(
    activityForShare("7460631307400736768", [
      "urn:li:activity:7508094912916127744",
      "urn:li:activity:7460631307929419777",
      "urn:li:activity:7493208658084986880",
    ]),
    "urn:li:activity:7460631307929419777"
  );
});

test("nothing made in the same seconds means no answer, never a guess", () => {
  assert.equal(
    activityForShare("7460631307400736768", [
      "urn:li:activity:7508094912916127744",
      "urn:li:activity:7493208658084986880",
    ]),
    null
  );
});
