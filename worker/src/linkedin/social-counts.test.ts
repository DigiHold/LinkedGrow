import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseSocialCounts } from "./summary-dom.ts";

// Read off Nicolas's own post page, 2026-09-25: the counts sit on the buttons.
test("the layout that puts the counts on the buttons", () => {
  const counts = parseSocialCounts({
    commentText: "3",
    repostText: "​",
    likeText: "7",
    reactedText: "",
    rowTexts: [],
    hasReactionIcon: true,
  });
  assert.deepEqual(counts, { reactions: 7, comments: 3, reposts: 0 });
});

// Read off Mohamed's post page the same day: the buttons are words and the numbers sit above them.
test("the layout that says it in words above the buttons", () => {
  const counts = parseSocialCounts({
    commentText: "Comment",
    repostText: "Repost",
    likeText: null,
    reactedText: "Vidhi Toshniwal and 17 others reacted",
    rowTexts: ["14 comments"],
    hasReactionIcon: true,
  });
  assert.deepEqual(counts, { reactions: 18, comments: 14, reposts: 0 });
});

test("a repost count in the same row is read after the comments", () => {
  const counts = parseSocialCounts({
    commentText: "Commenter",
    repostText: "Republier",
    likeText: null,
    reactedText: "Marie Dupont et 5 autres personnes ont réagi",
    rowTexts: ["8 commentaires", "2 republications"],
    hasReactionIcon: true,
  });
  assert.deepEqual(counts, { reactions: 6, comments: 8, reposts: 2 });
});

test("one named person and no number is one reaction", () => {
  const counts = parseSocialCounts({
    commentText: "Comment",
    repostText: "Repost",
    likeText: null,
    reactedText: "Maria Lecocq reacted",
    rowTexts: [],
    hasReactionIcon: true,
  });
  assert.equal(counts.reactions, 1);
  assert.equal(counts.comments, 0);
});

test("a bar that draws reaction icons but gives no number is unknown, never zero", () => {
  const counts = parseSocialCounts({
    commentText: "Comment",
    repostText: "Repost",
    likeText: null,
    reactedText: null,
    rowTexts: [],
    hasReactionIcon: true,
  });
  assert.deepEqual(counts, { reactions: null, comments: null, reposts: null });
});

// Enrique's post of 2026-09-04: 194 impressions, an action bar, and no engagement line at all.
test("a post nobody engaged with draws no reaction icon, and that is a real zero", () => {
  const counts = parseSocialCounts({
    commentText: "Comentar",
    repostText: "Compartir",
    likeText: null,
    reactedText: null,
    rowTexts: [],
    hasReactionIcon: false,
  });
  assert.deepEqual(counts, { reactions: 0, comments: 0, reposts: 0 });
});

test("thousands are read with their separator", () => {
  const counts = parseSocialCounts({
    commentText: "1,204",
    repostText: "31",
    likeText: "2.4K",
    reactedText: "",
    rowTexts: [],
    hasReactionIcon: true,
  });
  assert.deepEqual(counts, { reactions: 2400, comments: 1204, reposts: 31 });
});

/**
 * The bar LinkedIn served from 2026-10-27 renamed its icons, comment-small to comment-feed-compact
 * and repost-small to repost-feed-compact, and dropped like-consumption-small: the reaction count
 * sits on the reaction button, whose icon changes with the account's own reaction. The reader
 * started from comment-small, found nothing, and every post read since showed impressions with no
 * reactions or comments (Enrique's post of 2026-10-21: 1,609 impressions, 7 reactions, 4 comments).
 */
test("the reader knows the bar LinkedIn served from 2026-10-27", () => {
  const src = readFileSync(new URL("./summary-dom.ts", import.meta.url), "utf8");
  assert.match(src, /comment-feed-compact/, "the Comment button of the new bar is never found");
  assert.match(src, /repost-feed-compact/, "the Repost button of the new bar is never found");
  assert.match(
    src,
    /previousElementSibling/,
    "the reaction count is not found by where it sits beside the Comment button"
  );
});
