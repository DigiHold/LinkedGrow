import { test } from "node:test";
import assert from "node:assert/strict";
import { analyticsUrlFor, readStatsFromText, readSummaryStats, parseCount } from "./insights.ts";

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


/**
 * The real page, captured off Nicolas's own post on 2026-09-07. Kept verbatim because the layout is
 * the whole difficulty: the headline tiles put the number before the label, the engagement
 * breakdown puts it after, and a pattern built for one order silently returns the neighbour's
 * number on the other.
 */
const REAL_SUMMARY = `Nicolas Lecocq

Let our AI agents find your clients on LinkedIn

Post analytics

Nicolas Lecocq posted this • 1d

Discovery

90

Impressions

In-network (followers and connections)

61%

Out-of-network

39%

41

Members reached

Profile activity

0

Profile viewers from this post

0

Followers gained from this post

Engagement

8

Social engagements

Reactions

4

Comments

3

Reposts

0

Saves

1`;

test("the real statistics page reads correctly, both layouts at once", () => {
  const stats = readSummaryStats(REAL_SUMMARY);
  assert.equal(stats.impressions, 90);
  assert.equal(stats.reactions, 4);
  assert.equal(stats.comments, 3);
  assert.equal(stats.reposts, 0);
  assert.equal(stats.membersReached, 41);
});

/**
 * The failure this pins: the number class also matched whitespace, so " reactions" captured a lone
 * space, parsed as zero, and that zero looked exactly like an answer. It stopped the branch that
 * reads the number after the word from ever running, and it stopped the statistics page from ever
 * being opened, because the caller only reached for it when the permalink returned null.
 *
 * A capture must now contain a digit.
 */
test("a capture with no digit in it is not an answer", () => {
  assert.equal(readStatsFromText("engagements reactions").reactions, 0);
  assert.equal(readStatsFromText("no numbers here at all impressions").impressions, null);
  assert.equal(readStatsFromText("22 reactions").reactions, 22);
});

test("a page that did not load says nothing rather than zero", () => {
  const empty = readSummaryStats("");
  assert.equal(empty.impressions, null);
  assert.equal(empty.membersReached, null);
});
