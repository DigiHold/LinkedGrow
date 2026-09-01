import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import type { AgentContext } from "../config.ts";
import { claimLead, safeText, setDbForTests, signalKind, db as sharedDb, unscoredLeads } from "../db.ts";
import { clip } from "./miner.ts";

/**
 * The second sighting, which the claim used to throw on the floor.
 *
 * `INSERT OR IGNORE` treated "we found this person again" as nothing happened,
 * and it is close to the opposite. Somebody who comments under one rival, comes
 * up in a search for the role, and then reacts to another rival is visibly in
 * the market, repeatedly, and it costs the agent nothing to notice. Trigify
 * sells that as its own trigger and we were discarding it silently: most passes
 * on the live account reported "0 new people" while doing exactly this.
 *
 * The rule that makes it honest is that only a NEW KIND counts. The miner walks
 * a competitor's feed and one loud commenter appears under three of their posts
 * in a single pass, which is one interest rather than three, and counting each
 * one would put the noisiest person on LinkedIn at the top of every queue.
 */

let counter = 0;

async function freshDb(): Promise<AgentContext> {
  setDbForTests(createClient({ url: ":memory:" }));
  await sharedDb().batch([
    `CREATE TABLE agent_leads (
       id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, agent_id TEXT,
       source_id TEXT, profile_id TEXT NOT NULL, profile_url TEXT NOT NULL,
       full_name TEXT NOT NULL, first_name TEXT, headline TEXT, job_title TEXT,
       company TEXT, location TEXT, avatar_url TEXT, match_score INTEGER,
       match_reason TEXT, signal_type TEXT, signal_text TEXT, signal_url TEXT,
       signal_author TEXT, step TEXT NOT NULL DEFAULT 'found', step_at INTEGER,
       found_at INTEGER NOT NULL, rejected_at INTEGER, excluded_reason TEXT,
       created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
       sequence_status TEXT NOT NULL DEFAULT 'queued', angle TEXT,
       reply_intent TEXT, signal_hits INTEGER NOT NULL DEFAULT 1, signal_kinds TEXT,
       outcome TEXT, outcome_at INTEGER)`,
    `CREATE UNIQUE INDEX uq_leads ON agent_leads(workspace_id, profile_id)`,
  ]);
  return { agentId: "agent-a", workspaceId: "ws-1" } as AgentContext;
}

function person(signalType: string, id = "lena") {
  return {
    profileId: id,
    profileUrl: `https://www.linkedin.com/in/${id}/`,
    // One rendered name per id. The claim treats a same-name row under a
    // different id as the same human since 2026-08-17, and the ids in these
    // tests model genuinely different people.
    fullName: id === "lena" ? "Lena Ostrom" : `Lena ${id}`,
    headline: "Founder, small booking SaaS",
    signalType,
  };
}

async function read(profileId: string) {
  const { rows } = await sharedDb().execute({
    sql: `SELECT signal_hits, signal_kinds, match_score, step FROM agent_leads WHERE profile_id = ?`,
    args: [profileId],
  });
  return rows[0];
}

test("the kind of a signal is its family, not the page it came from", () => {
  assert.equal(signalKind("comment:lovable-dev"), "comment");
  assert.equal(signalKind("reaction:cal-com"), "reaction");
  assert.equal(signalKind("own:comment"), "own");
  assert.equal(signalKind(null), "unknown");
});

test("the first sighting claims them, the second only counts", async () => {
  const ctx = await freshDb();
  assert.equal(await claimLead(ctx, person("comment:lovable-dev")), true);
  assert.equal(
    await claimLead(ctx, person("search:indie founder")),
    false,
    "a repeat is not a new lead and must never be announced as one"
  );
  const row = await read("lena");
  assert.equal(Number(row?.signal_hits), 2);
  assert.equal(String(row?.signal_kinds), "comment,search");
  setDbForTests(null);
});

test("the same kind twice is one interest, however many posts it appeared under", async () => {
  const ctx = await freshDb();
  await claimLead(ctx, person("comment:lovable-dev"));
  await claimLead(ctx, person("comment:cal-com"));
  await claimLead(ctx, person("comment:calendly"));
  const row = await read("lena");
  assert.equal(Number(row?.signal_hits), 1, "one loud commenter is not three prospects");
  setDbForTests(null);
});

test("a new kind reopens the scoring, because the score was formed without it", async () => {
  const ctx = await freshDb();
  await claimLead(ctx, person("reaction:lovable-dev"));
  await sharedDb().execute(`UPDATE agent_leads SET match_score = 20, match_reason = 'a like'`);
  await claimLead(ctx, person("question:booking"));
  const row = await read("lena");
  assert.equal(row?.match_score, null, "somebody now asking about the problem deserves rejudging");
  setDbForTests(null);
});

test("a lead already in the sequence keeps the score it was let in on", async () => {
  // Clearing it mid-conversation could drop them under the floor and strand
  // them halfway through a thread somebody is actually reading.
  const ctx = await freshDb();
  await claimLead(ctx, person("reaction:lovable-dev"));
  await sharedDb().execute(`UPDATE agent_leads SET match_score = 80, step = 'invited'`);
  await claimLead(ctx, person("search:indie founder"));
  const row = await read("lena");
  assert.equal(Number(row?.match_score), 80);
  assert.equal(Number(row?.signal_hits), 2, "the sighting still counts");
  setDbForTests(null);
});

test("another agent seeing them does not touch the row it does not own", async () => {
  const ctx = await freshDb();
  await claimLead(ctx, person("comment:lovable-dev"));
  const other = { agentId: "agent-b", workspaceId: "ws-1" } as AgentContext;
  assert.equal(await claimLead(other, person("search:indie founder")), false);
  const row = await read("lena");
  assert.equal(Number(row?.signal_hits), 1, "the claim has not changed hands, so nothing is learned");
  setDbForTests(null);
});

test("the people seen most often are scored first", async () => {
  const ctx = await freshDb();
  await claimLead(ctx, person("reaction:lovable-dev", `quiet-${++counter}`));
  const loud = `loud-${++counter}`;
  await claimLead(ctx, person("reaction:lovable-dev", loud));
  await claimLead(ctx, person("comment:cal-com", loud));
  const waiting = await unscoredLeads(ctx, 10);
  assert.equal(String(waiting[0]?.signal_hits), "2");
  setDbForTests(null);
});

test("a rejected lead is never scored again, because there is nothing left to judge", async () => {
  const ctx = await freshDb();
  await claimLead(ctx, person("reaction:lovable-dev"));
  await sharedDb().execute(`UPDATE agent_leads SET rejected_at = 123`);
  assert.equal((await unscoredLeads(ctx, 10)).length, 0);
  setDbForTests(null);
});

/**
 * The half-emoji that killed 36 sourcing passes in five days.
 *
 * A comment body is cut to 400 characters with `slice`, which counts UTF-16
 * code units. An emoji is two of them, so a cut landing inside one leaves a
 * lone surrogate: not valid UTF-8, rejected by Turso when libsql puts it in a
 * JSON body, and reported as `SERVER_ERROR: Server returned HTTP status 400`
 * with no column and no statement named.
 *
 * It looked intermittent and it was not. It was the same comment under the same
 * Calendly post failing every single pass that reached it, and each failure
 * took the scoring, the source ranking and the memory revision down with it,
 * because all three run after the claim.
 */
test("a comment cut mid-emoji never reaches the database in halves", () => {
  const body = "x".repeat(399) + "🚀 and the rest of what they wrote";
  const cut = clip(body, 400);
  assert.equal(cut.length, 399, "the half emoji is dropped rather than kept");
  assert.ok(!/[\uD800-\uDFFF]/.test(cut), "no lone surrogate survives the cut");
  // The plain case still behaves exactly like slice.
  assert.equal(clip("short", 400), "short");
  assert.equal(clip("x".repeat(500), 400).length, 400);
  // A whole emoji sitting inside the range is untouched.
  assert.equal(clip("hi 🚀 there", 400), "hi 🚀 there");
});

test("anything half a character is stripped at the database boundary", () => {
  // Belt and braces: clip fixes the known cut, safeText covers every field and
  // every future call site, including text LinkedIn itself served broken.
  assert.equal(safeText("ok \uD83D"), "ok ");
  assert.equal(safeText("\uDE00 ok"), " ok");
  assert.equal(safeText("keeps 🚀 whole"), "keeps 🚀 whole");
  assert.equal(safeText(null), null);
  assert.equal(safeText(undefined), undefined);
});
