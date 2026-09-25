import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSocialCounts } from "./summary-dom.ts";

// Read off Nicolas's own post page, 2026-09-25: the counts sit on the buttons.
test("the layout that puts the counts on the buttons", () => {
  const counts = parseSocialCounts({
    commentText: "3",
    repostText: "​",
    likeText: "7",
    reactedText: "",
    rowTexts: [],
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
  });
  assert.equal(counts.reactions, 1);
  assert.equal(counts.comments, 0);
});

test("a social bar that says nothing at all is unknown, never zero", () => {
  const counts = parseSocialCounts({
    commentText: "Comment",
    repostText: "Repost",
    likeText: null,
    reactedText: null,
    rowTexts: [],
  });
  assert.deepEqual(counts, { reactions: null, comments: null, reposts: null });
});

test("thousands are read with their separator", () => {
  const counts = parseSocialCounts({
    commentText: "1,204",
    repostText: "31",
    likeText: "2.4K",
    reactedText: "",
    rowTexts: [],
  });
  assert.deepEqual(counts, { reactions: 2400, comments: 1204, reposts: 31 });
});
