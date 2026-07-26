import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import type { Config, AgentContext } from "../config.ts";
import type { DB } from "../store.ts";
import { countProspectsByStatus, countActionsSince, resetIdMap } from "../store.ts";
import { setDbForTests, db as sharedDb } from "../db.ts";
import { epochIso } from "../time.ts";
import type { LinkedInActions } from "./actions.ts";
import { runSequence, STATUS, type SequenceDeps } from "./sequence.ts";

let counter = 0;

/**
 * A real in-memory libsql, not a fake.
 *
 * The store layer is new code and the sequence is ported code, and these tests
 * are the only place both run together. A fake store would test the sequence
 * against an idea of the database rather than against the one it will use.
 */
async function freshDb(): Promise<DB> {
  setDbForTests(createClient({ url: ":memory:" }));
  resetIdMap();
  const c = sharedDb();
  await c.batch([
    `CREATE TABLE agent_leads (
       id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, agent_id TEXT,
       source_id TEXT, profile_id TEXT NOT NULL, profile_url TEXT NOT NULL,
       full_name TEXT NOT NULL, first_name TEXT, headline TEXT, job_title TEXT,
       company TEXT, location TEXT, avatar_url TEXT, match_score INTEGER,
       match_reason TEXT, signal_type TEXT, signal_text TEXT, signal_url TEXT,
       signal_author TEXT, step TEXT NOT NULL DEFAULT 'found', step_at INTEGER,
       found_at INTEGER NOT NULL, rejected_at INTEGER, excluded_reason TEXT,
       created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
       sequence_status TEXT NOT NULL DEFAULT 'queued', angle TEXT)`,
    `CREATE UNIQUE INDEX uq_leads ON agent_leads(workspace_id, profile_id)`,
    `CREATE TABLE agent_messages (
       id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, agent_id TEXT NOT NULL,
       lead_id TEXT NOT NULL, direction TEXT NOT NULL, step TEXT, body TEXT NOT NULL,
       sent_at INTEGER NOT NULL, read_at INTEGER, created_at INTEGER NOT NULL)`,
    `CREATE TABLE agent_actions (
       id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, agent_id TEXT NOT NULL,
       linkedin_account_id TEXT NOT NULL, lead_id TEXT, type TEXT NOT NULL,
       detail TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL)`,
    `CREATE TABLE agent_meta (
       agent_id TEXT NOT NULL, workspace_id TEXT NOT NULL, key TEXT NOT NULL,
       value TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (agent_id, key))`,
  ]);
  return {
    agentId: "agent-test",
    workspaceId: "ws-test",
    linkedinAccountId: "acct-test",
    country: "FR",
    accountDailyInviteCap: 25,
    agentsOnAccount: 1,
    warmupStartedAt: null,
    reviewMode: false,
    cfg: baseCfg(),
  } as AgentContext;
}

function drop(): void {
  setDbForTests(null);
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

async function seed(
  db: DB,
  status: string,
  updatedAt: string,
  over: { headline?: string; source?: string } = {},
): Promise<string> {
  const pid = `p-${++counter}`;
  const id = crypto.randomUUID();
  const at = Math.floor(new Date(updatedAt).getTime() / 1000);
  await sharedDb().execute({
    sql: `INSERT INTO agent_leads
            (id, workspace_id, agent_id, profile_id, profile_url, full_name, first_name,
             headline, signal_type, sequence_status, step, found_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'Jane Doe', 'Jane', ?, ?, ?, 'queued', ?, ?, ?)`,
    args: [
      id, db.workspaceId, db.agentId, pid,
      `https://www.linkedin.com/in/${pid}/`,
      over.headline ?? "Head of Security",
      over.source ?? "reaction:snyk",
      status, at, at, at,
    ],
  });
  return id;
}

function baseCfg(over: Partial<Config> = {}): Config {
  return {
    limits: { connectPerWeekMax: 100, dmPerDayMax: 40 },
    warmup: { startPerDay: 8, incrementPerWeek: 6, weeks: 4 },
    businessHours: { startHour: 9, endHour: 18, days: [1, 2, 3, 4, 5] },
    sequence: { waitBetweenDmsDays: 3 },
    delaysMs: { minAction: 0, maxAction: 0 },
    ...over,
  } as unknown as Config;
}

function fakeActions(over: Partial<LinkedInActions> = {}): LinkedInActions {
  return {
    warmUp: async () => true,
    sendConnect: async () => true,
    canMessageNow: async () => false,
    recentConnections: async () => [],
    inboxRepliers: async () => [],
    sendDm: async () => true,
    withdrawInvite: async () => true,
    ...over,
  };
}

function deps(actions: LinkedInActions, notify: (m: string) => void = () => {}): SequenceDeps {
  return {
    actions,
    notify,
    pauseMs: () => 0,
    writeMessage: async (_p, step) => ({ body: `Quick question for you about your work. Maria Lecocq (${step})`, angle: "website security scan" }),
  };
}

test("queued prospects get a warm-up and a connection request", async () => {
  const db = await freshDb();
  const warmed: number[] = [];
  await seed(db, STATUS.queued, daysAgo(0));
  await seed(db, STATUS.queued, daysAgo(0));
  await seed(db, STATUS.queued, daysAgo(0));
  await runSequence(baseCfg(), db, deps(fakeActions({ warmUp: async () => { warmed.push(1); return true; } })));
  assert.equal(await countProspectsByStatus(db, STATUS.connectSent), 3);
  assert.equal(await countProspectsByStatus(db, STATUS.queued), 0);
  assert.equal(await countActionsSince(db, "connect", epochIso()), 3);
  assert.equal(warmed.length, 3);
  drop();
});

// Acceptances are read from the connections list, and are picked up on the very next pass rather
// than after a fixed wait: the first message is only worth sending while the invite is still fresh.
test("an accepted invite is detected and messaged in the same pass", async () => {
  const db = await freshDb();
  await seed(db, STATUS.connectSent, daysAgo(0));
  await runSequence(baseCfg(), db, deps(fakeActions({ recentConnections: async () => ["Jane Doe"] })));
  assert.equal(await countProspectsByStatus(db, STATUS.connectSent), 0);
  // Holding the message for the next pass meant a Saturday acceptance waited until Monday.
  assert.equal(await countProspectsByStatus(db, STATUS.dm1Sent), 1);
  drop();
});

// An Open Profile can be messaged without being connected, so there is nothing to wait for.
test("an open profile skips the wait and goes straight to the messaging track", async () => {
  const db = await freshDb();
  await seed(db, STATUS.queued, daysAgo(0));
  await runSequence(baseCfg(), db, deps(fakeActions({ canMessageNow: async () => true })));
  assert.equal(await countProspectsByStatus(db, STATUS.connected), 1);
  assert.equal(await countProspectsByStatus(db, STATUS.connectSent), 0);
  drop();
});

test("a connected prospect receives DM1", async () => {
  const db = await freshDb();
  const id = await seed(db, STATUS.connected, daysAgo(0));
  await runSequence(baseCfg(), db, deps(fakeActions()));
  assert.equal(await countProspectsByStatus(db, STATUS.dm1Sent), 1);
  const { rows } = await sharedDb().execute({
    sql: "SELECT step, sent_at FROM agent_messages WHERE lead_id = ?",
    args: [id],
  });
  assert.equal(rows[0]?.step, "dm1");
  assert.ok(rows[0]?.sent_at);
  assert.equal(await countActionsSince(db, "dm", epochIso()), 1);
  drop();
});

test("a dm1 prospect with no reply gets DM2 after the wait", async () => {
  const db = await freshDb();
  await seed(db, STATUS.dm1Sent, daysAgo(10));
  await runSequence(baseCfg(), db, deps(fakeActions()));
  assert.equal(await countProspectsByStatus(db, STATUS.dm2Sent), 1);
  drop();
});

test("any inbound reply stops the sequence and alerts, sending no DM", async () => {
  const db = await freshDb();
  const alerts: string[] = [];
  let dmCalls = 0;
  await seed(db, STATUS.dm1Sent, daysAgo(10));
  const actions = fakeActions({ inboxRepliers: async () => ["Jane Doe"], sendDm: async () => { dmCalls++; return true; } });
  await runSequence(baseCfg(), db, deps(actions, (m) => alerts.push(m)));
  assert.equal(await countProspectsByStatus(db, STATUS.replied), 1);
  assert.equal(await countProspectsByStatus(db, STATUS.dm2Sent), 0);
  assert.equal(dmCalls, 0);
  assert.equal(alerts.length, 1);
  drop();
});

test("never sends a third message: dm2 prospects stop, never get another DM", async () => {
  const db = await freshDb();
  let dmCalls = 0;
  await seed(db, STATUS.dm2Sent, daysAgo(10));
  await runSequence(baseCfg(), db, deps(fakeActions({ sendDm: async () => { dmCalls++; return true; } })));
  assert.equal(await countProspectsByStatus(db, STATUS.stopped), 1);
  assert.equal(dmCalls, 0);
  drop();
});

test("the daily DM cap is respected", async () => {
  const db = await freshDb();
  await seed(db, STATUS.connected, daysAgo(0));
  await seed(db, STATUS.connected, daysAgo(0));
  await seed(db, STATUS.connected, daysAgo(0));
  const cfg = baseCfg({ limits: { connectPerWeekMax: 100, dmPerDayMax: 2 } });
  await runSequence(cfg, db, deps(fakeActions()));
  assert.equal(await countProspectsByStatus(db, STATUS.dm1Sent), 2);
  assert.equal(await countProspectsByStatus(db, STATUS.connected), 1);
  drop();
});

test("a stale unaccepted invite is withdrawn and stopped", async () => {
  const db = await freshDb();
  let withdrew = 0;
  await seed(db, STATUS.connectSent, daysAgo(30));
  const actions = fakeActions({ recentConnections: async () => [], withdrawInvite: async () => { withdrew++; return true; } });
  await runSequence(baseCfg(), db, deps(actions));
  assert.equal(await countProspectsByStatus(db, STATUS.stopped), 1);
  assert.equal(withdrew, 1);
  drop();
});

test("a message that cannot be generated skips the prospect instead of sending", async () => {
  const db = await freshDb();
  let dmCalls = 0;
  await seed(db, STATUS.connected, daysAgo(0));
  const d = deps(fakeActions({ sendDm: async () => { dmCalls++; return true; } }));
  d.writeMessage = async () => {
    throw new Error("no clean message after 4 tries");
  };
  await runSequence(baseCfg(), db, d);
  assert.equal(await countProspectsByStatus(db, STATUS.skipped), 1);
  assert.equal(dmCalls, 0);
  drop();
});
