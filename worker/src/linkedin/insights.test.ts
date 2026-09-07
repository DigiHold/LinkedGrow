import { test } from "node:test";
import assert from "node:assert/strict";
import { analyticsUrlFor, readStatsFromText, parseCount } from "./insights.ts";

/**
 * The permalink shows reactions, comments and reposts. Impressions are the author's own number and
 * live on a separate page, which is why that column was zero for everybody while the other three
 * came through.
 */
test("the impressions page is built from the post's own identifier", () => {
  assert.equal(
    analyticsUrlFor("https://www.linkedin.com/feed/update/urn:li:activity:7502444594626830336/"),
    "https://www.linkedin.com/analytics/post-summary/urn:li:activity:7502444594626830336/"
  );
  assert.equal(
    analyticsUrlFor("/feed/update/urn%3Ali%3Aactivity%3A7502444594626830336"),
    "https://www.linkedin.com/analytics/post-summary/urn:li:activity:7502444594626830336/"
  );
  assert.equal(
    analyticsUrlFor("/posts/nicolas_something-activity-7502444594626830336-Ab1c"),
    "https://www.linkedin.com/analytics/post-summary/urn:li:activity:7502444594626830336/"
  );
});

test("a link with no post in it asks for no page", () => {
  assert.equal(analyticsUrlFor("https://www.linkedin.com/feed/"), null);
  assert.equal(analyticsUrlFor(""), null);
});

/** Null and zero are different answers: one is "nobody saw it", the other is "we could not read". */
test("a missing count reads as null, never as zero", () => {
  assert.equal(readStatsFromText("12 reactions 3 comments").impressions, null);
  assert.equal(readStatsFromText("1,204 impressions").impressions, 1204);
  assert.equal(readStatsFromText("1 204 impressions").impressions, 1204);
  assert.equal(readStatsFromText("2,4 k vues").impressions, 2400);
});

test("both languages and both orders", () => {
  assert.equal(readStatsFromText("impressions : 842").impressions, 842);
  assert.equal(readStatsFromText("18 réactions").reactions, 18);
  assert.equal(parseCount("1.2k"), 1200);
});
