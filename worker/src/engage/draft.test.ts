import { test } from "node:test";
import assert from "node:assert/strict";
import { drawShape, buildPrompt, parseDraft, SYSTEM, FACTS } from "./draft.ts";

/** A deterministic stand-in for Math.random, so a draw can be pinned. */
function seq(...values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length]!;
}

test("the ceiling is drawn short, and never reaches the length Nicolas rejected", () => {
  let longest = 0;
  const rand = (() => {
    let s = 1;
    return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  })();
  for (let i = 0; i < 5000; i += 1) longest = Math.max(longest, drawShape(rand).words);
  assert.ok(longest <= 23, `longest ceiling was ${longest}`);
});

test("most drafts get no emoji at all", () => {
  const rand = (() => {
    let s = 7;
    return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  })();
  let withEmoji = 0;
  for (let i = 0; i < 5000; i += 1) if (drawShape(rand).emoji) withEmoji += 1;
  assert.ok(withEmoji / 5000 < 0.3, `emoji rate was ${withEmoji / 5000}`);
  assert.ok(withEmoji > 0, "an emoji should appear sometimes");
});

test("the shape and the ceiling reach the prompt, the floor never does", () => {
  const shape = drawShape(seq(0.01, 0.9, 0.5, 0.9));
  const prompt = buildPrompt(
    { author: "Jason M. Lemkin", headline: "SaaStr", text: "Could Block be the death of the AI SDR?" },
    shape,
    ["We stopped doing that"]
  );
  assert.ok(prompt.includes("Jason M. Lemkin"));
  assert.ok(prompt.includes("Ceiling: about"));
  assert.ok(prompt.includes('- "We stopped doing that"'));
  assert.ok(!/\bat least\b/i.test(prompt), "the prompt must never suggest a minimum length");
});

test("a post with no recent openings still builds a prompt", () => {
  const prompt = buildPrompt({ author: "A", headline: "", text: "x" }, drawShape(seq(0.5)), []);
  assert.ok(prompt.includes("(none yet)"));
});

test("fenced JSON is read, because the models fence it about a third of the time", () => {
  const raw = '```json\n{"decision":"comment","reason":"r","comment":"We stopped that last year."}\n```';
  assert.deepEqual(parseDraft(raw), {
    decision: "comment",
    reason: "r",
    comment: "We stopped that last year.",
  });
});

test("anything unreadable becomes a skip, never a comment", () => {
  assert.equal(parseDraft("I think you should say hello").decision, "skip");
  assert.equal(parseDraft("").decision, "skip");
  assert.equal(parseDraft("{").comment, "");
});

test("a comment decision with no text is a skip", () => {
  assert.equal(parseDraft('{"decision":"comment","reason":"r","comment":"   "}').decision, "skip");
});

test("a skip never carries a comment through", () => {
  const d = parseDraft('{"decision":"skip","reason":"bait","comment":"Great post!"}');
  assert.equal(d.decision, "skip");
  assert.equal(d.comment, "");
});

/** The rules Nicolas set in conversation have to survive an edit to the prompt. */
test("the prompt still carries the rules that took four rounds to find", () => {
  assert.ok(/NEVER name LinkedGrow/.test(SYSTEM));
  assert.ok(/no line break, ever/i.test(SYSTEM));
  assert.ok(/Under 20 words/.test(SYSTEM));
  assert.ok(/never the word "part"|Never the word "part"/i.test(SYSTEM));
  assert.ok(/never a customer/i.test(FACTS));  // wrapped across lines in the template
  assert.ok(/Never say you lost all of it/.test(FACTS));
});
