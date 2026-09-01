import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import type { AgentContext, Config } from "../config.ts";
import { leadsAtStep, setDbForTests, db as sharedDb } from "../db.ts";
import { getProspects } from "../store.ts";

/**
 * The line between a lead being found and a lead being written to.
 *
 * There was none. leadsAtStep ordered by score and filtered by nothing, so a
 * lead the scorer had judged 0 sat at the bottom of the list and was contacted
 * anyway as soon as the queue above it ran out, which on a young agent is most
 * days. Scoring the co-founder of a rival product 0 achieves nothing without
 * this file.
 *
 * A real in-memory libsql rather than a fake, for the same reason the sequence
 * tests use one: the thing being tested is a WHERE clause.
 */

let counter = 0;

async function freshDb(): Promise<void> {
  setDbForTests(createClient({ url: ":memory:" }));
  await sharedDb().execute(
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
       outcome TEXT, outcome_at INTEGER)`
  );
}

function ctxWith(
  matchLevel: AgentContext["matchLevel"],
  icp = "Salon owners and independent therapists who take bookings by phone"
): AgentContext {
  return {
    agentId: "agent-test",
    workspaceId: "ws-test",
    matchLevel,
    cfg: { leads: { icp } } as unknown as Config,
  } as AgentContext;
}

async function seed(name: string, score: number | null): Promise<void> {
  const id = `lead-${++counter}`;
  await sharedDb().execute({
    sql: `INSERT INTO agent_leads
            (id, workspace_id, agent_id, profile_id, profile_url, full_name,
             match_score, step, found_at, created_at, updated_at)
          VALUES (?, 'ws-test', 'agent-test', ?, ?, ?, ?, 'found', 1, 1, 1)`,
    args: [id, id, `https://www.linkedin.com/in/${id}/`, name, score],
  });
}

/** A lead sitting in the invitation queue, with a score and an age. */
async function seedQueued(
  name: string,
  score: number | null,
  ageRank: number,
  signalType = "reaction:someone"
): Promise<void> {
  const id = `q-${++counter}`;
  await sharedDb().execute({
    sql: `INSERT INTO agent_leads
            (id, workspace_id, agent_id, profile_id, profile_url, full_name, match_score,
             signal_type, sequence_status, step, found_at, created_at, updated_at)
          VALUES (?, 'ws-test', 'agent-test', ?, ?, ?, ?, ?, 'queued', 'found', ?, ?, ?)`,
    args: [id, id, `https://www.linkedin.com/in/${id}/`, name, score, signalType, ageRank, ageRank, ageRank],
  });
}

async function names(ctx: AgentContext): Promise<string[]> {
  const rows = await leadsAtStep(ctx, "found", 50);
  return rows.map((r) => String(r.full_name));
}

test("a competitor scored 0 is never handed to the sequence", async () => {
  await freshDb();
  await seed("Zhanya Qin", 0); // Founder at GDPRChecker, messaged for real on 2026-08-08
  await seed("A real prospect", 72);
  assert.deepEqual(await names(ctxWith("balanced")), ["A real prospect"]);
  setDbForTests(null);
});

test("an empty queue does not become a reason to write to the 0", async () => {
  await freshDb();
  await seed("Shibam B.", 0); // Co-founder, RazorBooking.com
  assert.deepEqual(await names(ctxWith("balanced")), []);
  assert.deepEqual(await names(ctxWith("volume")), [], "volume asked for reach, not for rivals");
  assert.deepEqual(await names(ctxWith("precision")), []);
  setDbForTests(null);
});

test("each match level draws its own line", async () => {
  await freshDb();
  await seed("Weak", 20);
  await seed("Middling", 55);
  await seed("Strong", 85);
  assert.deepEqual(await names(ctxWith("precision")), ["Strong"]);
  assert.deepEqual(await names(ctxWith("balanced")), ["Strong", "Middling"]);
  assert.deepEqual(await names(ctxWith("volume")), ["Strong", "Middling", "Weak"]);
  setDbForTests(null);
});

test("an unscored lead waits for its score rather than being written to", async () => {
  await freshDb();
  await seed("Not judged yet", null);
  assert.deepEqual(await names(ctxWith("balanced")), []);
  setDbForTests(null);
});

test("an agent with no ICP still works, because it never scores anybody", async () => {
  // Waiting for a score that will never arrive would silence the agent
  // completely, which is a worse failure than the one being prevented.
  await freshDb();
  await seed("Not judged yet", null);
  await seed("Rival", 0);
  assert.deepEqual(await names(ctxWith("balanced", "")), ["Not judged yet"]);
  setDbForTests(null);
});

test("the best match is still handed over first", async () => {
  await freshDb();
  await seed("Second", 60);
  await seed("First", 95);
  assert.deepEqual(await names(ctxWith("balanced")), ["First", "Second"]);
  setDbForTests(null);
});

/**
 * The invitation queue, which had no floor and no sense of what is good.
 *
 * getProspects ordered by how long somebody had waited and nothing else, so the
 * day's sixteen invitations went to whoever had been sitting in the list
 * longest whatever the agent thought of them. On a live account on 2026-08-10
 * a lead scored 15 sat ahead of one scored 92, every day, and the customer's
 * queue showed the same name for days because it faithfully mirrored that.
 *
 * And nothing stopped an invitation going to a lead scored 0, including one the
 * scorer had flagged as a competitor who can never buy.
 */
test("the best match is invited first, not the one who waited longest", async () => {
  await freshDb();
  await seedQueued("Waited longest, poor match", 15, 1);
  await seedQueued("Arrived today, strong match", 92, 9);
  const rows = await getProspects(ctxWith("balanced"), "queued", { limit: 10 });
  assert.deepEqual(
    rows.map((r) => r.full_name),
    ["Arrived today, strong match", "Waited longest, poor match"]
  );
  setDbForTests(null);
});

test("somebody who asked about the problem still goes first, whatever their score", async () => {
  await freshDb();
  await seedQueued("Strong headline", 92, 1);
  await seedQueued("Asked out loud", 55, 2, "question:cookie consent");
  const rows = await getProspects(ctxWith("balanced"), "queued", { limit: 10 });
  assert.equal(rows[0]?.full_name, "Asked out loud", "a question beats any headline");
  setDbForTests(null);
});

test("an invitation is never spent on a lead below the floor", async () => {
  await freshDb();
  await seedQueued("Rival, scored zero", 0, 1);
  await seedQueued("Real prospect", 70, 2);
  const rows = await getProspects(ctxWith("balanced"), "queued", { limit: 10, minScore: 45 });
  assert.deepEqual(rows.map((r) => r.full_name), ["Real prospect"]);
  setDbForTests(null);
});

test("an unscored lead waits for its score before being invited", async () => {
  await freshDb();
  await seedQueued("Not judged yet", null, 1);
  const held = await getProspects(ctxWith("balanced"), "queued", { limit: 10, requireScored: true });
  assert.equal(held.length, 0);
  // And an agent with no ICP never scores anybody, so it must not wait for ever.
  const free = await getProspects(ctxWith("balanced", ""), "queued", { limit: 10 });
  assert.equal(free.length, 1);
  setDbForTests(null);
});

/**
 * The reject button, which wrote a timestamp that nothing ever read.
 *
 * The column existed, the API set it, and every query in the worker ignored it,
 * so a person the customer had thrown out came back round the queue on the next
 * pass and was invited anyway. It is also the single clearest piece of training
 * data the product can collect, and it was reaching neither the queue nor the
 * ranking.
 */
test("somebody the customer threw out never comes back round", async () => {
  await freshDb();
  await seedQueued("Thrown out", 95, 1);
  await seedQueued("Still wanted", 60, 2);
  await sharedDb().execute(
    `UPDATE agent_leads SET rejected_at = 123, excluded_reason = 'You rejected this person'
      WHERE full_name = 'Thrown out'`
  );
  const rows = await getProspects(ctxWith("balanced"), "queued", { limit: 10 });
  assert.deepEqual(rows.map((r) => r.full_name), ["Still wanted"]);
  setDbForTests(null);
});

/**
 * Who goes first, and why the order is tiers rather than a weighting.
 *
 * Somebody who commented under the customer's OWN post is warmer than any
 * headline a model rated 92, because they have already read the customer's
 * words on purpose and in public. Somebody who has turned up through two
 * different doors is next, because repetition is a fact and a score is not.
 */
test("the customer's own audience goes first, then whoever turned up twice", async () => {
  await freshDb();
  await seedQueued("Strong headline", 92, 1);
  await seedQueued("Commented on your post", 40, 2, "own:comment");
  await seedQueued("Seen twice", 55, 3);
  await sharedDb().execute(
    `UPDATE agent_leads SET signal_hits = 2, signal_kinds = 'comment,search' WHERE full_name = 'Seen twice'`
  );
  const rows = await getProspects(ctxWith("balanced"), "queued", { limit: 10 });
  assert.deepEqual(
    rows.map((r) => r.full_name),
    ["Commented on your post", "Seen twice", "Strong headline"]
  );
  setDbForTests(null);
});
