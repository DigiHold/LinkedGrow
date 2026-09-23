import { test } from "node:test";
import assert from "node:assert/strict";
import { hasOurComment } from "./publish.ts";

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
