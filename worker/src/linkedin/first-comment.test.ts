import { test } from "node:test";
import assert from "node:assert/strict";
import { firstCommentDecision, hasOurComment } from "./publish.ts";

const COMMENT =
  "Here is the full breakdown I promised, with the numbers behind every step: https://example.com/guide";

test("a comment already under the post is recognised", () => {
  const list = `Ahmed El Deeb\n1h\n${COMMENT}\nLike Reply`;
  assert.equal(hasOurComment(list, COMMENT), true);
});

test("line breaks and stray spacing do not hide it", () => {
  const folded = "Here is the full   breakdown I promised,\n\nwith the numbers behind every step: …see more";
  assert.equal(hasOurComment(folded, COMMENT), true);
});

test("an empty comments area means nothing is there yet", () => {
  assert.equal(hasOurComment("", COMMENT), false);
  assert.equal(hasOurComment("Be the first to comment", COMMENT), false);
});

test("somebody else's comment is not ours", () => {
  const list = "Maria Lecocq\n2h\nGreat post, thanks for sharing this one.\nLike Reply";
  assert.equal(hasOurComment(list, COMMENT), false);
});

test("a comment too short to identify is always written rather than skipped", () => {
  assert.equal(hasOurComment("Thanks!", "Thanks!"), false);
});

test("a copy typed by hand with plain quotes is still ours", () => {
  const curly = "\u201cYou designed this without understanding us\u201d is what I heard \u2014 twice";
  const plain = 'Mohamed\n8h\n"You designed this without understanding us" is what I heard - twice\nLike Reply';
  assert.equal(hasOurComment(plain, curly), true);
});

const READABLE = { commentsText: "Maria Lecocq\nGreat post\nLike Reply", markers: 1, commentCount: 1 };

test("a post nobody has commented on gets the comment", () => {
  assert.equal(firstCommentDecision({ commentsText: "", markers: 0, commentCount: 0 }, COMMENT), "post");
});

test("somebody else's comment does not stop ours", () => {
  assert.equal(firstCommentDecision(READABLE, COMMENT), "post");
});

test("our comment already under the post is never written again", () => {
  const there = { ...READABLE, commentsText: `${READABLE.commentsText}\nAhmed\n${COMMENT}` };
  assert.equal(firstCommentDecision(there, COMMENT), "already-there");
});

test("comments we cannot read are a reason to stop, never to write", () => {
  // The 2026-09-23 duplicate: the reader knew one layout, read nothing on the
  // other, and took nothing for "not there yet".
  assert.equal(firstCommentDecision({ commentsText: "", markers: 0, commentCount: 2 }, COMMENT), "unverifiable");
  assert.equal(firstCommentDecision({ commentsText: null, markers: 0, commentCount: 0 }, COMMENT), "unverifiable");
  assert.equal(firstCommentDecision({ ...READABLE, commentCount: null }, COMMENT), "unverifiable");
});
