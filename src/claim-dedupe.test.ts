import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import type { AgentContext } from "./config.ts";
import { setDbForTests, db as sharedDb, claimLead } from "./db.ts";

/**
 * One human, two LinkedIn ids. Reaction lists serve the hashed member URN and
 * the viewers page serves the public slug, so the (workspace, profile_id) key
 * saw two people. Devargho got two hellos 99 seconds apart on 2026-08-17.
 * The rendered name is what both doors share, so it is the tie-breaker.
 */
async function fresh(): Promise<AgentContext> {
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
       sequence_status TEXT NOT NULL DEFAULT 'queued',
       signal_hits INTEGER NOT NULL DEFAULT 1, signal_kinds TEXT)`,
    `CREATE UNIQUE INDEX uq_leads ON agent_leads(workspace_id, profile_id)`,
  ]);
  return { workspaceId: "ws-1", agentId: "ag-1" } as AgentContext;
}

const person = (profileId: string, name: string) => ({
  profileId,
  profileUrl: `https://www.linkedin.com/in/${profileId}/`,
  fullName: name,
});

test("the same name under a second LinkedIn id is one person, not a new lead", async () => {
  const ctx = await fresh();
  assert.equal(await claimLead(ctx, person("ACoAAFhX_urn-hash", "Devargho Chakraborty")), true);
  assert.equal(await claimLead(ctx, person("devargho", "Devargho Chakraborty")), false);
  const { rows } = await sharedDb().execute("SELECT COUNT(*) AS n FROM agent_leads");
  assert.equal(Number(rows[0]?.n), 1);
  setDbForTests(null);
});

test("a rejected duplicate does not block the name from being claimed again", async () => {
  const ctx = await fresh();
  assert.equal(await claimLead(ctx, person("jane-doe", "Jane Doe")), true);
  await sharedDb().execute(`UPDATE agent_leads SET rejected_at = 1 WHERE profile_id = 'jane-doe'`);
  assert.equal(await claimLead(ctx, person("ACoAAjane-urn", "Jane Doe")), true);
  setDbForTests(null);
});
