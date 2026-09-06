import { test } from "node:test";
import assert from "node:assert/strict";
import { activityIdsIn, publishedAt, minutesOld, permalinkFor, freshPosts } from "./urn.ts";

/**
 * Every href below was read off Nicolas's own notifications page on 2026-09-06. They are kept
 * verbatim, escapes included, because the encoding is the thing most likely to change and a
 * paraphrased fixture would not notice.
 */
const REAL_HREFS = [
  "/analytics/profile-views",
  "/analytics/post-summary/urn:li:activity:7501989520926593026",
  "/in/bendik%2Dnyheim%2Db60257223",
  "/feed/update/urn%3Ali%3Aactivity%3A7501989520926593026",
  "/in/neilkpatel",
  "/feed/?highlightedUpdateUrn=urn%3Ali%3Aactivity%3A7502123482869329921&highlightedUpdateType=TOPIC_TRENDING_CONVERSATION_IN_YOUR_NETWORK&showCommentBox=true&origin=INAPP",
  "/feed/?highlightedUpdateUrn=urn%3Ali%3Aactivity%3A7502221755894222848&highlightedUpdateType=TOPIC_TRENDING_CONVERSATION_IN_YOUR_NETWORK&showCommentBox=true",
  "/analytics/post-summary/urn:li:activity:7500991063969468416",
  "/feed/update/urn%3Ali%3Aactivity%3A7501989520926593026?commentUrn=urn%3Ali%3Acomment%3A%28activity%3A7501989520926593026%2C7501995214723506176%29&dashCommentUrn=urn%3Ali%3Afsd%5Fcomment%3A%287501995214723506176%2Curn%3Ali%3Aactivity%3A7501989520926593026%29",
  "/in/ankit%2Dsinha%2D44984039",
  "/feed/?highlightedUpdateUrn=urn%3Ali%3Aactivity%3A7501872885138014208&highlightedUpdateType=TOPIC_TRENDING_CONVERSATION_IN_YOUR_NETWORK",
];

test("the id carries the publication time, checked against four real posts", () => {
  assert.equal(publishedAt("7501619935706648576").toISOString(), "2026-09-04T12:39:26.031Z");
  assert.equal(publishedAt("7501989520926593026").toISOString(), "2026-09-05T13:08:02.014Z");
  assert.equal(publishedAt("7502221755894222848").toISOString(), "2026-09-06T04:30:51.145Z");
  assert.equal(publishedAt("7499453470400348160").toISOString(), "2026-08-29T13:10:40.451Z");
});

/**
 * The check that turns a plausible trick into a verified one. This comment was written on that
 * post, so its own id has to decode later than the post's, and it does, by 22 minutes.
 */
test("a comment on a post decodes to after the post", () => {
  const post = publishedAt("7501989520926593026").getTime();
  const comment = publishedAt("7501995214723506176").getTime();
  assert.ok(comment > post);
  assert.equal(Math.floor((comment - post) / 60_000), 22);
});

/**
 * Number() rounds a Snowflake and JavaScript's >> then truncates to 32 bits, so a naive
 * implementation returns a date in 1970 rather than a wrong date near the right one. Worth a test
 * of its own: this is the failure that would look like "the feature finds nothing" for a week.
 */
test("ids beyond MAX_SAFE_INTEGER survive the shift", () => {
  assert.ok(Number("7502221755894222848") > Number.MAX_SAFE_INTEGER);
  assert.equal(publishedAt("7502221755894222848").getUTCFullYear(), 2026);
});

test("an id is read whether the href escapes it or not", () => {
  assert.deepEqual(activityIdsIn("/feed/update/urn%3Ali%3Aactivity%3A7501989520926593026"), [
    "7501989520926593026",
  ]);
  assert.deepEqual(
    activityIdsIn("/feed/?highlightedUpdateUrn=urn%3Ali%3Aactivity%3A7502123482869329921&showCommentBox=true"),
    ["7502123482869329921"]
  );
});

/**
 * The link shape a bell notification actually uses. Missing it made every "somebody you follow has
 * posted" notification invisible, which is the one kind this feature exists to read.
 */
test("the readable /posts/ link carries an id too", () => {
  assert.deepEqual(
    activityIdsIn("/posts/samdunning_29-months-ago-i-started-activity-7486877915989843968-bmCs"),
    ["7486877915989843968"]
  );
  assert.deepEqual(
    activityIdsIn(
      "https://www.linkedin.com/posts/jasonmlemkin_could-block-be-the-death-of-the-ai-sdr-activity-7307862245307228160-A4mo"
    ),
    ["7307862245307228160"]
  );
});

test("both spellings of one post in a single href yield it once", () => {
  const href =
    "/posts/x_y-activity-7501989520926593026-ab?u=urn%3Ali%3Aactivity%3A7501989520926593026";
  assert.deepEqual(activityIdsIn(href), ["7501989520926593026"]);
});

test("the account's own post statistics are never a post to comment on", () => {
  assert.deepEqual(activityIdsIn("/analytics/post-summary/urn:li:activity:7501989520926593026"), []);
  assert.deepEqual(activityIdsIn("/analytics/profile-views"), []);
});

test("a profile link carries no post", () => {
  assert.deepEqual(activityIdsIn("/in/neilkpatel"), []);
  assert.deepEqual(activityIdsIn("/in/bendik%2Dnyheim%2Db60257223"), []);
});

test("one href naming the same post three times yields it once", () => {
  const href = REAL_HREFS[8] as string;
  assert.deepEqual(activityIdsIn(href), ["7501989520926593026"]);
});

test("a broken escape falls back to the raw text instead of throwing", () => {
  assert.deepEqual(activityIdsIn("/feed/update/urn:li:activity:7501989520926593026?q=%E0%A4%A"), [
    "7501989520926593026",
  ]);
});

test("minutes are counted forward, and a future id cannot go negative", () => {
  const now = new Date("2026-09-06T05:00:51.145Z");
  assert.equal(minutesOld("7502221755894222848", now), 30);
  assert.equal(minutesOld("7502221755894222848", new Date("2026-09-06T04:00:00.000Z")), 0);
});

test("the permalink is built, never copied from the link that was followed", () => {
  assert.equal(
    permalinkFor("7501989520926593026"),
    "https://www.linkedin.com/feed/update/urn:li:activity:7501989520926593026/"
  );
});

/**
 * The selection, run over the whole real page. At 05:00 on 2026-09-06 exactly one of those posts
 * is inside a 45 minute window: the 04:30 one. The 22:00 post from the night before is four times
 * too old, and the two analytics links are gone whatever their age.
 */
test("only the posts inside the window come back, newest first", () => {
  const now = new Date("2026-09-06T05:00:00.000Z");
  const posts = freshPosts(REAL_HREFS, { maxAgeMinutes: 45, now });
  assert.deepEqual(posts.map((p) => p.activityId), ["7502221755894222848"]);
  assert.equal(posts[0]?.minutesOld, 29);
});

test("a wider window sorts what it finds by age", () => {
  const now = new Date("2026-09-06T05:00:00.000Z");
  const posts = freshPosts(REAL_HREFS, { maxAgeMinutes: 60 * 24, now });
  assert.deepEqual(posts.map((p) => p.activityId), [
    "7502221755894222848",
    "7502123482869329921",
    "7501989520926593026",
    "7501872885138014208",
  ]);
});

/**
 * Nothing is commented twice. One post arrived three times in the same capture, and an account
 * that answers itself under one post is the most obvious automation there is.
 */
test("a post already handled is not offered again", () => {
  const now = new Date("2026-09-06T05:00:00.000Z");
  const seen = new Set(["7502221755894222848"]);
  const posts = freshPosts(REAL_HREFS, { maxAgeMinutes: 45, now, seen });
  assert.deepEqual(posts, []);
});
