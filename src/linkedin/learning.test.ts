import { test } from "node:test";
import assert from "node:assert/strict";
import { effortOf, isDead, miningOrder, parseGrown, worthOf, type SourceScore } from "./learn.ts";

/**
 * The agent was supposed to follow what works. It never could.
 *
 * Read off a live agent on 2026-08-10, from the leads themselves rather than
 * from the counters:
 *
 *   indie SaaS founder   23 leads,  7 good,  passes 0
 *   Lovable               6 leads,  2 good,  passes 1
 *   website security     10 leads,  1 good,  passes 1
 *   Cursor                0 leads,  0 good,  passes 0, mined and produced nobody
 *
 * Three separate things sent that ranking to zero. good_leads was written
 * before the scoring that fills it, so every source reported no good leads at
 * all. The yield divided by a passes counter that was never incremented, so the
 * whole history counted for nothing. And untried was read off that same
 * counter, so a competitor that had been opened and had produced nobody was
 * treated as an unexplored opportunity and jumped the queue every pass.
 *
 * The numbers below are the real ones.
 */

function score(over: Partial<SourceScore>): SourceScore {
  const counts = {
    good: over.good ?? 0,
    accepted: over.accepted ?? 0,
    interested: over.interested ?? 0,
    neutral: over.neutral ?? 0,
    refused: over.refused ?? 0,
    rejected: over.rejected ?? 0,
    meetings: over.meetings ?? 0,
    customers: over.customers ?? 0,
    notAFit: over.notAFit ?? 0,
  };
  const passes = over.passes ?? 0;
  return {
    id: over.id ?? "s",
    label: over.label ?? "s",
    type: over.type ?? "keyword",
    passes,
    leads: over.leads ?? 0,
    ...counts,
    yield: worthOf(counts) / effortOf(passes, over.untried ? null : 1),
    untried: over.untried ?? false,
    ...over,
  } as SourceScore;
}

const INDIE = score({ id: "indie", label: "indie SaaS founder", leads: 23, good: 7, passes: 0 });
const LOVABLE = score({ id: "lovable", label: "Lovable", leads: 6, good: 2, passes: 1 });
const SECURITY = score({ id: "sec", label: "website security", leads: 10, good: 1, passes: 1 });
const DEAD = score({ id: "cursor", label: "Cursor", leads: 0, good: 0, passes: 0, untried: false });
const FRESH = score({ id: "new", label: "never opened", leads: 0, good: 0, passes: 0, untried: true });

test("the source with the most good leads is mined first", () => {
  const order = miningOrder(
    [{ id: "sec" }, { id: "lovable" }, { id: "indie" }],
    [SECURITY, LOVABLE, INDIE],
    new Map()
  );
  assert.deepEqual(
    order.map((s) => s.id),
    ["indie", "lovable", "sec"]
  );
});

test("a source that produced nothing does not outrank one that produced seven", () => {
  const order = miningOrder([{ id: "cursor" }, { id: "indie" }], [DEAD, INDIE], new Map());
  assert.equal(order[0]?.id, "indie", "Cursor had been opened and had found nobody");
});

test("something never opened still gets its turn first, which is the point", () => {
  const order = miningOrder([{ id: "indie" }, { id: "new" }], [INDIE, FRESH], new Map());
  assert.equal(order[0]?.id, "new", "an unexplored source is the cheapest information available");
});

test("a source with no recorded passes is not worth zero", () => {
  // passes was never written on any row predating the fix, and dividing by it
  // threw away every source's entire history.
  assert.ok(INDIE.yield > 0, "23 leads and 7 good ones is not a yield of zero");
  assert.ok(INDIE.yield > LOVABLE.yield);
});

test("equal yields fall back to whoever has waited longest", () => {
  const a = score({ id: "a", good: 2, passes: 1 });
  const b = score({ id: "b", good: 2, passes: 1 });
  const order = miningOrder([{ id: "a" }, { id: "b" }], [a, b], new Map([["a", 200], ["b", 100]]));
  assert.equal(order[0]?.id, "b", "nothing should starve");
});

/**
 * A reply is ground truth. It was worth eight times zero.
 *
 * The weights have always said accepted counts three times and replied eight,
 * and both columns were written by nothing at all. On a live agent running
 * since July they were 0 on every source while four people had actually
 * replied, so the only signal reaching the ranking was a cheap model's opinion
 * of a headline. The whole promise of an agent that learns rests on the
 * opposite: that what humans really did outranks what a model guessed.
 */
test("a source whose people wanted it outranks one that only scored well", () => {
  const guessedWell = score({ id: "guess", leads: 20, good: 9, passes: 3 });
  const actuallyWorked = score({ id: "real", leads: 6, good: 2, accepted: 4, interested: 2, passes: 3 });
  const order = miningOrder(
    [{ id: "guess" }, { id: "real" }],
    [guessedWell, actuallyWorked],
    new Map()
  );
  assert.equal(
    order[0]?.id,
    "real",
    "two people who wanted it beat nine headlines a model liked"
  );
});

test("acceptance counts, and somebody wanting it counts for far more", () => {
  const quiet = score({ id: "q", good: 2, accepted: 2, passes: 2 });
  const answering = score({ id: "a", good: 2, accepted: 2, interested: 1, passes: 2 });
  assert.ok(answering.yield > quiet.yield, "somebody asking for it is the strongest evidence there is");
});

/**
 * The reply that is worth nothing, and the one that is worth less than nothing.
 *
 * Read off the live account on 2026-08-10. Six people had replied and their
 * match scores were 75, 25, 15, 0, 0 and 0: an AI automation builder, a
 * solution architect, the head of an AI newsletter, an executive coach, a
 * bootcamp operator, and the founder of a directly competing product. Every one
 * of them counted as a reply at a weight of eight, which is the heaviest number
 * in the ranking, so the source that found the competitor tied for first place
 * and was mined before anything else on every pass.
 */
test("a polite hello is not the same evidence as somebody asking what it costs", () => {
  const chatty = score({ id: "chatty", leads: 10, good: 1, neutral: 4, passes: 2 });
  const buying = score({ id: "buying", leads: 10, good: 1, interested: 1, passes: 2 });
  assert.ok(
    buying.yield > chatty.yield,
    "four people saying hi must not outrank one person asking for the product"
  );
});

test("a source that produces refusals ranks below one that produces silence", () => {
  const silent = score({ id: "silent", leads: 10, good: 1, passes: 2 });
  const refused = score({ id: "refused", leads: 10, good: 1, refused: 3, passes: 2 });
  assert.ok(refused.yield < silent.yield);
  assert.ok(refused.yield < 0, "three people saying no is worse than nothing at all");
});

test("what the customer threw out weighs more than what a model liked", () => {
  const s = score({ leads: 12, good: 6, rejected: 2 });
  assert.ok(worthOf(s) < 0, "six headlines a model liked cannot outvote two hand rejections");
});

test("a booked meeting outranks everything else a source can show", () => {
  const busy = score({ id: "busy", leads: 40, good: 20, accepted: 10, passes: 4 });
  const oneMeeting = score({ id: "meeting", leads: 3, good: 1, meetings: 1, passes: 4 });
  assert.ok(oneMeeting.yield > busy.yield);
});

/**
 * The free ride a broken counter used to buy.
 *
 * `passes` was never incremented before the fix, so every older source reported
 * 0 and divided by 1. On the live account `AI search visibility` had more worth
 * than `indie SaaS founder`, 15 against 12, and ranked at half its yield purely
 * because it was the one being counted honestly.
 */
test("a source that has been mined cannot claim it never was", () => {
  assert.equal(effortOf(0, 1_754_000_000), 1);
  assert.equal(effortOf(0, null), 1);
  assert.equal(effortOf(5, 1_754_000_000), 5);
});

test("three refusals retire a source without waiting out the patience", () => {
  assert.equal(isDead(score({ leads: 9, good: 0, refused: 3, passes: 2 })), true);
  assert.equal(isDead(score({ leads: 9, good: 0, rejected: 2, notAFit: 1, passes: 2 })), true);
  // Something that is producing is never retired for a couple of noes.
  assert.equal(isDead(score({ leads: 9, good: 4, refused: 3, passes: 2 })), false);
  // And nothing untried is ever judged.
  assert.equal(isDead(score({ untried: true, refused: 5 })), false);
});

/**
 * What a winning source is allowed to grow into.
 *
 * Every variant used to be a keyword search, and on this agent's own numbers
 * that is the wrong family: a comment under a competitor's post qualifies at
 * 46% against 31% for a search, and mining a named company by URL costs the
 * account no searches at all while a keyword source spends six of the nine a
 * free account gets in a day. Growing only keywords grew the expensive half and
 * the weaker half at the same time.
 */
test("a company is recognised and takes the scarce slot before a search does", () => {
  const grown = parseGrown(
    ["search: bootstrapped saas", "company: Lovable", "search: solo founder"].join("\n"),
    1,
    new Set()
  );
  assert.deepEqual(grown, [{ type: "competitor", label: "Lovable" }]);
});

test("both kinds are kept when there is room, companies first", () => {
  const grown = parseGrown(
    ["search: indie hacker", "company: Cal.com", "company: Vercel"].join("\n"),
    3,
    new Set()
  );
  assert.deepEqual(
    grown.map((g) => `${g.type}:${g.label}`),
    ["competitor:Cal.com", "competitor:Vercel", "keyword:indie hacker"]
  );
});

test("an unprefixed line is still a search, because that is what older answers look like", () => {
  const grown = parseGrown("building in public", 2, new Set());
  assert.deepEqual(grown, [{ type: "keyword", label: "building in public" }]);
});

test("nothing already on the agent is added twice", () => {
  const grown = parseGrown(
    ["company: Lovable", "search: indie hacker"].join("\n"),
    5,
    new Set(["lovable"])
  );
  assert.deepEqual(grown, [{ type: "keyword", label: "indie hacker" }]);
});

test("a repeat inside one answer is dropped too", () => {
  const grown = parseGrown(["company: Lovable", "company: lovable"].join("\n"), 5, new Set());
  assert.equal(grown.length, 1);
});

test("bullets, numbering and stray quotes are stripped", () => {
  const grown = parseGrown(['- "company: Cal.com"', "2. search: solo founder"].join("\n"), 5, new Set());
  assert.deepEqual(
    grown.map((g) => `${g.type}:${g.label}`),
    ["competitor:Cal.com", "keyword:solo founder"]
  );
});

test("junk and empty lines produce nothing rather than a broken source", () => {
  assert.deepEqual(parseGrown("\n\n  \nab\n", 5, new Set()), []);
});
