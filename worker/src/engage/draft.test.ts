import { test } from "node:test";
import assert from "node:assert/strict";
import { drawShape, buildPrompt, parseDraft, buildSystem, NO_FACTS } from "./draft.ts";

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

/**
 * A rewrite is the only correction this feature gets, so it has to be the loudest thing in the
 * prompt. An approval says the comment was acceptable; a rewrite says what right looks like.
 */
test("a rewrite reaches the prompt, marked as the target", () => {
  const prompt = buildPrompt(
    { author: "A", headline: "", text: "a post" },
    drawShape(seq(0.5)),
    [],
    [
      { written: "We capped ours at a fixed number.", rewritten: "Ours runs on a flat subscription." },
      { written: "One agent broke and we caught it late.", rewritten: "" },
    ]
  );
  assert.ok(prompt.includes("REWRITTEN"));
  assert.ok(prompt.includes('you wrote: "We capped ours at a fixed number."'));
  assert.ok(prompt.includes('it went up as: "Ours runs on a flat subscription."'));
  assert.ok(prompt.includes('- "One agent broke and we caught it late."'));
});

test("no lessons yet means no lesson block at all", () => {
  const prompt = buildPrompt({ author: "A", headline: "", text: "a post" }, drawShape(seq(0.5)), []);
  assert.ok(!prompt.includes("REWRITTEN"));
  assert.ok(!prompt.includes("went up exactly as written"));
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
  const system = buildSystem("You once shipped a theme that reached 500 installs.");
  assert.ok(/NEVER name LinkedGrow/.test(system));
  assert.ok(/no line break, ever/i.test(system));
  assert.ok(/Under 20 words/.test(system));
  assert.ok(/never the word "part"|Never the word "part"/i.test(system));
});

/**
 * The sheet is per agent data and must never be compiled in. This repository is published as the
 * open source product, so a biography in this file is a private history in a public git history.
 */
test("the fact sheet comes from the caller, never from this file", () => {
  const system = buildSystem("You built a boat in 1998 and it sank.");
  assert.ok(system.includes("You built a boat in 1998 and it sank."));
  // "OceanWP" appears in the ban list on purpose, which is a rule and not a biography.
  assert.ok(!/Maria|1\.5M|500,000|bad management|sold in 2019/i.test(system),
    "no biography may be compiled into the prompt");
});

test("an agent with no sheet is told to make no personal claim, not left to invent one", () => {
  const system = buildSystem("   ");
  assert.ok(system.includes(NO_FACTS));
  assert.ok(/Say nothing about what you have built/.test(system));
});
