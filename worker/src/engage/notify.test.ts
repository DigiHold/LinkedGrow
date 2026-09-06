import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEmail } from "./notify.ts";
import type { CommentDraft } from "./store.ts";

const draft = (over: Partial<CommentDraft> = {}): CommentDraft => ({
  id: "d1",
  agentId: "a1",
  linkedinAccountId: "l1",
  activityId: "7502221755894222848",
  postUrl: "https://www.linkedin.com/feed/update/urn:li:activity:7502221755894222848/",
  postAuthor: "Alex Garcia",
  postAuthorUrl: "https://www.linkedin.com/in/alexgarcia/",
  postExcerpt: "Last night I had a nightmare about a bill.",
  comment: "We watch that number every week now, it moves faster than anyone expects.",
  originalComment: "We watch that number every week now, it moves faster than anyone expects.",
  verifyOk: true,
  verifyNote: "",
  status: "pending",
  minutesOldAtDraft: 12,
  createdAt: 0,
  ...over,
});

test("the subject counts what is waiting", () => {
  assert.match(buildEmail([draft()], "https://linkedgrow.ai").subject, /^1 LinkedIn comment/);
  assert.match(buildEmail([draft(), draft()], "https://linkedgrow.ai").subject, /^2 LinkedIn comments/);
});

/**
 * The decision has to be possible from the mail itself. Somebody on a phone should know what the
 * agent wrote before choosing whether to open anything.
 */
test("every comment is in the mail in full, not summarised", () => {
  const { html } = buildEmail([draft()], "https://linkedgrow.ai");
  assert.ok(html.includes("We watch that number every week now, it moves faster than anyone expects."));
  assert.ok(html.includes("Alex Garcia"));
  assert.ok(html.includes("12 minutes"));
});

test("the deadline is stated, because a late comment is worse than none", () => {
  const { html } = buildEmail([draft()], "https://linkedgrow.ai");
  assert.match(html, /30 minutes is dropped/);
});

/** A post author naming their company with an ampersand must not break the mail. */
test("author names and comments are escaped", () => {
  const { html } = buildEmail(
    [draft({ postAuthor: 'Ben & "Co"', comment: "We looked at <script> once and dropped it fast." })],
    "https://linkedgrow.ai"
  );
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&amp;"));
});

/**
 * The fact check advises rather than blocks, so its worry has to travel with the comment. A warning
 * that stays in a log is a warning nobody acts on.
 */
test("a comment the fact check doubted says so in the mail", () => {
  const { html } = buildEmail(
    [draft({ verifyOk: false, verifyNote: "This says something that is not on your fact sheet." })],
    "https://linkedgrow.ai"
  );
  assert.ok(html.includes("not on your fact sheet"));
  assert.ok(html.includes("Read it before you approve it."));
});

test("a clean comment carries no warning", () => {
  const { html } = buildEmail([draft()], "https://linkedgrow.ai");
  assert.ok(!html.includes("Read it before you approve it."));
});

test("the link points at the page where the decision is made", () => {
  const { html } = buildEmail([draft()], "https://linkedgrow.ai");
  assert.ok(html.includes("https://linkedgrow.ai/dashboard/comments"));
});
