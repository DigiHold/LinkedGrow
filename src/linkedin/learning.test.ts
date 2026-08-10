import { test } from "node:test";
import assert from "node:assert/strict";
import { miningOrder, type SourceScore } from "./learn.ts";

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
  const good = over.good ?? 0;
  const accepted = over.accepted ?? 0;
  const replied = over.replied ?? 0;
  const passes = over.passes ?? 0;
  return {
    id: over.id ?? "s",
    label: over.label ?? "s",
    type: over.type ?? "keyword",
    passes,
    leads: over.leads ?? 0,
    good,
    accepted,
    replied,
    yield: (good * 1 + accepted * 3 + replied * 8) / Math.max(1, passes),
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
test("a source whose people replied outranks one that only scored well", () => {
  const guessedWell = score({ id: "guess", leads: 20, good: 9, passes: 3 });
  const actuallyWorked = score({ id: "real", leads: 6, good: 2, accepted: 4, replied: 2, passes: 3 });
  const order = miningOrder(
    [{ id: "guess" }, { id: "real" }],
    [guessedWell, actuallyWorked],
    new Map()
  );
  assert.equal(
    order[0]?.id,
    "real",
    "two replies and four acceptances beat nine headlines a model liked"
  );
});

test("acceptance counts, and a reply counts for more", () => {
  const quiet = score({ id: "q", good: 2, accepted: 2, passes: 2 });
  const answering = score({ id: "a", good: 2, accepted: 2, replied: 1, passes: 2 });
  assert.ok(answering.yield > quiet.yield, "somebody writing back is the strongest evidence there is");
});
