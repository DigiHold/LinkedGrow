import { test } from "node:test";
import assert from "node:assert/strict";
import { analyticsUrlFor, readStatsFromText, readSummaryStats, postImageFrom, parseCount } from "./insights.ts";

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


/**
 * The real banner, captured off Nicolas's account on 2026-09-07 when all nine of his posts came
 * back wearing his cover image. The first version excluded profile photos and company logos and
 * had never heard of profile-displaybackgroundimage, which is the lesson: a blacklist is only as
 * complete as the last mistake, so this one accepts what a post picture IS instead.
 */
const BANNER =
  "https://media.licdn.com/dms/image/v2/D4D16AQFdCm8n2BGIYA/profile-displaybackgroundimage-shrink_200_800/B4DZ4shtRkG4AQ-/0/1778863494518?e=1790208000";
const AVATAR =
  "https://media.licdn.com/dms/image/v2/D4E03AQx/profile-displayphoto-shrink_100_100/0/1?e=1";
const POST_IMAGE =
  "https://media.licdn.com/dms/image/v2/D5622AQy/feedshare-shrink_2048_1536/0/2?e=2";

test("the banner is never mistaken for the post", () => {
  assert.equal(postImageFrom([BANNER]), null);
  assert.equal(postImageFrom([BANNER, AVATAR]), null);
  assert.equal(postImageFrom([BANNER, AVATAR, POST_IMAGE]), POST_IMAGE);
});

test("only shared media, article covers and document covers count as the post", () => {
  assert.equal(
    postImageFrom(["https://media.licdn.com/dms/image/v2/X/article-cover_image-shrink_720_1280/0/9"]),
    "https://media.licdn.com/dms/image/v2/X/article-cover_image-shrink_720_1280/0/9"
  );
  assert.equal(postImageFrom(["https://media.licdn.com/dms/image/v2/X/company-logo_100_100/0/3"]), null);
  assert.equal(postImageFrom(["https://static.licdn.example/icon.svg"]), null);
});

/** No thumbnail beats the wrong one, which is exactly what the first version shipped. */
test("a page with nothing recognisable keeps no picture", () => {
  assert.equal(postImageFrom(["https://media.licdn.com/dms/image/v2/X/unknown-thing/0/1"]), null);
  assert.equal(postImageFrom([]), null);
});


/**
 * The same page on a Spanish account, which is what a customer had been looking at for four days
 * while every read succeeded and every number came back null. An unknown language does not fail
 * loudly, it reads as a post nobody saw, so each locale gets a test rather than a promise.
 */
test("the statistics page is read in Spanish too", () => {
  const stats = readSummaryStats(`Descubrimiento

312

Impresiones

En la red

58%

104

Miembros alcanzados

Interacciones

Reacciones

9

Comentarios

4

Republicaciones

1`);
  assert.equal(stats.impressions, 312);
  assert.equal(stats.reactions, 9);
  assert.equal(stats.comments, 4);
  assert.equal(stats.reposts, 1);
  assert.equal(stats.membersReached, 104);
});

test("German and Italian labels answer as well", () => {
  assert.equal(readSummaryStats("1.204\n\nEindrücke").impressions, 1204);
  assert.equal(readSummaryStats("842\n\nImpressioni").impressions, 842);
  assert.equal(readSummaryStats("Reaktionen\n\n17").reactions, 17);
});
