import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import type { AgentContext, Config } from "../config.ts";
import { leadsAtStep, setDbForTests, db as sharedDb } from "../db.ts";

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
       sequence_status TEXT NOT NULL DEFAULT 'queued', angle TEXT)`
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
