import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanPostText, splitAuthor } from "./read.ts";

/** The shape the live run actually produced, controls and counters included. */
const RAW = `Jeremy Guillo

 • Following

AI Expert | Founder of Bootcamp | Author of the best seller

13h • 

I asked the model to rewrite my profile. Here is the result.

Not a generic prompt, a real system with three precise outputs.

Show translation
118
77
1
Like
Comment
Repost
Send`;

test("the controls and the counters are dropped, the words are not", () => {
  const out = cleanPostText(RAW);
  assert.ok(out.includes("I asked the model to rewrite my profile."));
  assert.ok(out.includes("a real system with three precise outputs"));
  for (const noise of ["Show translation", "Like", "Comment", "Repost", "Send", "118", "77", "Following", "13h"]) {
    assert.ok(!out.split("\n").includes(noise), `${noise} should be gone`);
  }
});

test("the author and the headline are the first two lines", () => {
  const post = splitAuthor(cleanPostText(RAW));
  assert.equal(post.author, "Jeremy Guillo");
  assert.ok(post.headline.startsWith("AI Expert"));
});

/**
 * The first run handed the model Nicolas's own sidebar, private numbers included. Nothing here can
 * put them back, but a repeated line is exactly how they arrived, so duplicates are collapsed.
 */
test("a line repeated by the layout appears once", () => {
  const out = cleanPostText("Jeremy Guillo\nJeremy Guillo\nThe post itself is here and it is long enough to keep.");
  assert.equal(out.split("\n").length, 2);
});

test("a line that is only digits is a counter and never prose", () => {
  const out = cleanPostText("Author\n1,204\nThe real sentence survives because it carries words.");
  assert.ok(!out.includes("1,204"));
  assert.ok(out.includes("The real sentence survives"));
});
