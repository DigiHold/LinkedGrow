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
    // The warm-up ramp is a property of the LinkedIn account, so the sequence
    // reads and seeds it here. It used to keep its own copy per agent in
    // agent_meta, which the dashboard never saw.
    `CREATE TABLE linkedin_accounts (
       id TEXT PRIMARY KEY, warmup_started_at INTEGER, updated_at INTEGER)`,
    `CREATE TABLE agent_activity (
       agent_id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, verb TEXT NOT NULL,
       subject_name TEXT, subject_avatar TEXT, subject_url TEXT, detail TEXT,
       started_at INTEGER NOT NULL, beat_at INTEGER)`,
  ]);
  await c.execute({
    sql: `INSERT INTO linkedin_accounts (id, warmup_started_at, updated_at) VALUES (?, NULL, ?)`,
    args: ["acct-test", 0],
  });
  return {
    agentId: "agent-test",
    workspaceId: "ws-test",
    linkedinAccountId: "acct-test",
    country: "FR",
    accountDailyInviteCap: 25,
    agentsOnAccount: 1,
    warmupStartedAt: null,
    reviewMode: false,
    sender: { firstName: "Maria", companyInfo: "website security scans", location: "Montreux" },
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
    readThread: async () => [],
    sendDm: async () => true,
    withdrawInvite: async () => true,
    ...over,
  };
}

function deps(
  actions: LinkedInActions,
  notify: (m: string) => void = () => {},
  /**
   * What the model would have said about the reply.
   *
   * Left out on purpose in most tests: the sequence has to work on a box with
   * no model access, and its behaviour there is part of the contract.
   */
  readReply?: SequenceDeps["readReply"]
): SequenceDeps {
  return {
    actions,
    notify,
    pauseMs: () => 0,
    ...(readReply ? { readReply } : {}),
    writeMessage: async (_p, step) => ({ body: `Quick question for you about your work. Maria (${step})`, angle: step }),
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

// The acceptance is noticed on the very next pass, and the introduction does NOT follow in the same
// minute. A message that lands seconds after an accept is the clearest automation tell there is.
test("an accepted invite is picked up, and the intro waits", async () => {
  const db = await freshDb();
  let dmCalls = 0;
  await seed(db, STATUS.connectSent, daysAgo(0));
  const actions = fakeActions({
    recentConnections: async () => ["Jane Doe"],
    sendDm: async () => { dmCalls++; return true; },
  });
  await runSequence(baseCfg(), db, deps(actions));
  assert.equal(await countProspectsByStatus(db, STATUS.connectSent), 0);
  assert.equal(await countProspectsByStatus(db, STATUS.connected), 1);
  assert.equal(dmCalls, 0);
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

// The first message after an accept is the hello. Two lines, nothing asked for.
test("a connected prospect receives the hello once its own wait has passed", async () => {
  const db = await freshDb();
  const id = await seed(db, STATUS.connected, daysAgo(3));
  await runSequence(baseCfg(), db, deps(fakeActions()));
  assert.equal(await countProspectsByStatus(db, STATUS.helloSent), 1);
  const { rows } = await sharedDb().execute({
    sql: "SELECT step, sent_at FROM agent_messages WHERE lead_id = ?",
    args: [id],
  });
  assert.equal(rows[0]?.step, "hello");
  assert.ok(rows[0]?.sent_at);
  assert.equal(await countActionsSince(db, "dm", epochIso()), 1);
  drop();
});

// Answering a hello that asked for nothing is not a conversation yet. It is
// permission for the message that actually has something in it.
test("answering the hello earns the real message, not a conversation reply", async () => {
  const db = await freshDb();
  await seed(db, STATUS.helloSent, daysAgo(0.2));
  const actions = fakeActions({
    inboxRepliers: async () => ["Jane Doe"],
    readThread: async () => [
      { from: "us", body: "Good to be connected Jane." },
      { from: "them", body: "You too, thanks." },
    ],
  });
  await runSequence(baseCfg(), db, deps(actions));
  assert.equal(await countProspectsByStatus(db, STATUS.helloAnswered), 1);
  assert.equal(await countProspectsByStatus(db, STATUS.conversing), 0);
  drop();
});

test("the real message follows a few hours after they answer the hello", async () => {
  const db = await freshDb();
  const id = await seed(db, STATUS.helloAnswered, daysAgo(1));
  await runSequence(baseCfg(), db, deps(fakeActions()));
  assert.equal(await countProspectsByStatus(db, STATUS.introSent), 1);
  const { rows } = await sharedDb().execute({
    sql: "SELECT step FROM agent_messages WHERE lead_id = ? AND direction = 'out'",
    args: [id],
  });
  assert.equal(rows[0]?.step, "intro");
  drop();
});

// Silence is worth less than a reply and still worth more than nothing.
test("a prospect who ignored the hello still gets the real message, later", async () => {
  const db = await freshDb();
  await seed(db, STATUS.helloSent, daysAgo(6));
  await runSequence(baseCfg(), db, deps(fakeActions()));
  assert.equal(await countProspectsByStatus(db, STATUS.introSent), 1);
  drop();
});

// The hello is two lines of nothing. It must never carry a question.
test("the hello goes out before anything with substance in it", async () => {
  const db = await freshDb();
  const steps: string[] = [];
  const d = deps(fakeActions());
  d.writeMessage = async (_p, step) => {
    steps.push(step);
    return { body: "Good to be connected Jane. Maria", angle: step };
  };
  await seed(db, STATUS.connected, daysAgo(3));
  await runSequence(baseCfg(), db, d);
  assert.deepEqual(steps, ["hello"]);
  drop();
});

// The differentiator, and the thing Nicolas asked for explicitly: silence is not a stop.
test("a prospect who never answered the intro still gets the ask", async () => {
  const db = await freshDb();
  await seed(db, STATUS.introSent, daysAgo(10));
  await runSequence(baseCfg(), db, deps(fakeActions()));
  assert.equal(await countProspectsByStatus(db, STATUS.askSent), 1);
  drop();
});

// The other half of it: a reply used to end the sequence, and must not any more.
test("a reply moves the prospect into a conversation instead of stopping", async () => {
  const db = await freshDb();
  const alerts: string[] = [];
  await seed(db, STATUS.introSent, daysAgo(1));
  const actions = fakeActions({
    inboxRepliers: async () => ["Jane Doe"],
    readThread: async () => [
      { from: "us", body: "Hi Jane, good to be connected." },
      { from: "them", body: "Thanks, likewise. What made you reach out?" },
    ],
  });
  await runSequence(baseCfg(), db, deps(actions, (m) => alerts.push(m)));
  assert.equal(await countProspectsByStatus(db, STATUS.conversing), 1);
  assert.equal(await countProspectsByStatus(db, STATUS.handedOver), 0);
  // Nothing is escalated for an ordinary reply. The agent handles it.
  assert.equal(alerts.length, 0);
  const { rows } = await sharedDb().execute("SELECT direction, body FROM agent_messages WHERE direction = 'in'");
  assert.equal(rows.length, 1);
  drop();
});

test("the same reply is not stored twice across two passes", async () => {
  const db = await freshDb();
  await seed(db, STATUS.introSent, daysAgo(1));
  const actions = fakeActions({
    inboxRepliers: async () => ["Jane Doe"],
    readThread: async () => [{ from: "them", body: "Sure, tell me more." }],
  });
  await runSequence(baseCfg(), db, deps(actions));
  await runSequence(baseCfg(), db, deps(actions));
  const { rows } = await sharedDb().execute("SELECT id FROM agent_messages WHERE direction = 'in'");
  assert.equal(rows.length, 1);
  drop();
});

/**
 * Who decides that a reply needs the customer, and on what.
 *
 * Until 2026-08-07 it was a list of keywords and it was wrong in both
 * directions: it handed over on "nice meeting you" and carried on through
 * "sounds great, send me more". Three real leads answered a hello with small
 * talk and every one was marked over-to-you. The decision is now split, and
 * these hold the split in place.
 */
test("a buying signal is handed over, and the reason travels with it", async () => {
  const db = await freshDb();
  const alerts: string[] = [];
  let dmCalls = 0;
  await seed(db, STATUS.introSent, daysAgo(1));
  const actions = fakeActions({
    inboxRepliers: async () => ["Jane Doe"],
    readThread: async () => [{ from: "them", body: "Interesting, what is your pricing?" }],
    sendDm: async () => { dmCalls++; return true; },
  });
  await runSequence(
    baseCfg(),
    db,
    deps(actions, (m) => alerts.push(m), async () => ({ handOver: true, why: "asked what it costs" }))
  );
  assert.equal(await countProspectsByStatus(db, STATUS.handedOver), 1);
  assert.equal(await countProspectsByStatus(db, STATUS.conversing), 0);
  assert.equal(dmCalls, 0);
  assert.equal(alerts.length, 1);
  assert.match(alerts[0] ?? "", /asked what it costs/);
  drop();
});

test("small talk is answered by the agent, not handed over", async () => {
  const db = await freshDb();
  const alerts: string[] = [];
  await seed(db, STATUS.introSent, daysAgo(1));
  const actions = fakeActions({
    inboxRepliers: async () => ["Jane Doe"],
    readThread: async () => [
      { from: "them", body: "Thanks Maria, nice meeting you. What made you look for solo SaaS founders?" },
    ],
  });
  await runSequence(
    baseCfg(),
    db,
    deps(actions, (m) => alerts.push(m), async () => ({ handOver: false, why: "a question about us" }))
  );
  assert.equal(await countProspectsByStatus(db, STATUS.conversing), 1);
  assert.equal(await countProspectsByStatus(db, STATUS.handedOver), 0);
  drop();
});

test("a refusal stops the agent with no model involved at all", async () => {
  const db = await freshDb();
  const alerts: string[] = [];
  await seed(db, STATUS.introSent, daysAgo(1));
  const actions = fakeActions({
    inboxRepliers: async () => ["Jane Doe"],
    readThread: async () => [{ from: "them", body: "Not interested, please remove me." }],
  });
  // No readReply: the words alone have to settle this one.
  await runSequence(baseCfg(), db, deps(actions, (m) => alerts.push(m)));
  assert.equal(await countProspectsByStatus(db, STATUS.handedOver), 1);
  assert.equal(alerts.length, 1);
  drop();
});

test("being asked whether this is a bot is never answered by the bot", async () => {
  const db = await freshDb();
  await seed(db, STATUS.introSent, daysAgo(1));
  const actions = fakeActions({
    inboxRepliers: async () => ["Jane Doe"],
    readThread: async () => [{ from: "them", body: "Hold on, is this a bot?" }],
  });
  await runSequence(baseCfg(), db, deps(actions));
  assert.equal(await countProspectsByStatus(db, STATUS.handedOver), 1);
  drop();
});

test("a model that fails leaves the conversation with the agent", async () => {
  const db = await freshDb();
  await seed(db, STATUS.introSent, daysAgo(1));
  const actions = fakeActions({
    inboxRepliers: async () => ["Jane Doe"],
    readThread: async () => [{ from: "them", body: "Thanks, good to connect." }],
  });
  await runSequence(
    baseCfg(),
    db,
    deps(actions, () => {}, async () => {
      throw new Error("the model is down");
    })
  );
  assert.equal(await countProspectsByStatus(db, STATUS.conversing), 1);
  assert.equal(await countProspectsByStatus(db, STATUS.handedOver), 0);
  drop();
});

test("once the ask has gone out the agent hands over whatever comes back", async () => {
  const db = await freshDb();
  await seed(db, STATUS.askSent, daysAgo(1));
  const actions = fakeActions({
    inboxRepliers: async () => ["Jane Doe"],
    readThread: async () => [{ from: "them", body: "Sure, sounds good." }],
  });
  // Even a model saying "keep talking" cannot reopen it: the ask is the last
  // thing the agent ever sends.
  await runSequence(
    baseCfg(),
    db,
    deps(actions, () => {}, async () => ({ handOver: false, why: "" }))
  );
  assert.equal(await countProspectsByStatus(db, STATUS.handedOver), 1);
  drop();
});

test("a conversation gets an answer, and the answer is not the ask", async () => {
  const db = await freshDb();
  const id = await seed(db, STATUS.conversing, daysAgo(1));
  await runSequence(baseCfg(), db, deps(fakeActions()));
  assert.equal(await countProspectsByStatus(db, STATUS.conversing), 1);
  const { rows } = await sharedDb().execute({
    sql: "SELECT step FROM agent_messages WHERE lead_id = ? AND direction = 'out'",
    args: [id],
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.step, "converse");
  drop();
});

// The converse loop is bounded, so an agent can never talk forever without coming to the point.
test("after the maximum number of answers the conversation moves to the ask", async () => {
  const db = await freshDb();
  const id = await seed(db, STATUS.conversing, daysAgo(5));
  const now = Math.floor(Date.now() / 1000);
  for (let i = 0; i < 3; i++) {
    await sharedDb().execute({
      sql: `INSERT INTO agent_messages (id, workspace_id, agent_id, lead_id, direction, step, body, sent_at, created_at)
            VALUES (?, ?, ?, ?, 'out', 'converse', 'earlier answer', ?, ?)`,
      args: [crypto.randomUUID(), db.workspaceId, db.agentId, id, now, now],
    });
  }
  await runSequence(baseCfg(), db, deps(fakeActions()));
  assert.equal(await countProspectsByStatus(db, STATUS.askSent), 1);
  drop();
});

test("the ask is the last message: nothing follows it", async () => {
  const db = await freshDb();
  let dmCalls = 0;
  await seed(db, STATUS.askSent, daysAgo(10));
  await runSequence(baseCfg(), db, deps(fakeActions({ sendDm: async () => { dmCalls++; return true; } })));
  assert.equal(await countProspectsByStatus(db, STATUS.handedOver), 1);
  assert.equal(dmCalls, 0);
  drop();
});

// A reply that lands after the ask goes to the customer, whatever it says. The agent is done.
test("a reply after the ask is always handed over", async () => {
  const db = await freshDb();
  const alerts: string[] = [];
  await seed(db, STATUS.askSent, daysAgo(1));
  const actions = fakeActions({
    inboxRepliers: async () => ["Jane Doe"],
    readThread: async () => [{ from: "them", body: "sounds good" }],
  });
  await runSequence(baseCfg(), db, deps(actions, (m) => alerts.push(m)));
  assert.equal(await countProspectsByStatus(db, STATUS.handedOver), 1);
  assert.equal(alerts.length, 1);
  drop();
});

// The inbox naming someone whose thread reads empty must not make the agent answer nothing.
test("a replier whose thread reads empty is left alone", async () => {
  const db = await freshDb();
  await seed(db, STATUS.introSent, daysAgo(1));
  const actions = fakeActions({
    inboxRepliers: async () => ["Jane Doe"],
    readThread: async () => [],
  });
  await runSequence(baseCfg(), db, deps(actions));
  assert.equal(await countProspectsByStatus(db, STATUS.introSent), 1);
  assert.equal(await countProspectsByStatus(db, STATUS.conversing), 0);
  drop();
});

test("the daily DM cap is respected", async () => {
  const db = await freshDb();
  await seed(db, STATUS.connected, daysAgo(3));
  await seed(db, STATUS.connected, daysAgo(3));
  await seed(db, STATUS.connected, daysAgo(3));
  const cfg = baseCfg({
    limits: { connectPerWeekMax: 100, dmPerDayMax: 2, dmPerWeekMax: 100 },
  });
  await runSequence(cfg, db, deps(fakeActions()));
  assert.equal(await countProspectsByStatus(db, STATUS.helloSent), 2);
  assert.equal(await countProspectsByStatus(db, STATUS.connected), 1);
  drop();
});

/**
 * The other message ceiling, which nothing counted until 2026-08-01.
 *
 * Twenty a day over six working days is 120 a week, and LinkedIn allows 100 on
 * a free or Premium account. The daily cap alone let an agent run 20% over it
 * every week.
 */
test("the weekly DM cap is respected even when the daily one is not reached", async () => {
  const db = await freshDb();
  await seed(db, STATUS.connected, daysAgo(3));
  await seed(db, STATUS.connected, daysAgo(3));
  await seed(db, STATUS.connected, daysAgo(3));
  const cfg = baseCfg({
    limits: { connectPerWeekMax: 100, dmPerDayMax: 20, dmPerWeekMax: 1 },
  });
  await runSequence(cfg, db, deps(fakeActions()));
  assert.equal(await countProspectsByStatus(db, STATUS.helloSent), 1);
  assert.equal(await countProspectsByStatus(db, STATUS.connected), 2);
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
  await seed(db, STATUS.helloAnswered, daysAgo(1));
  const d = deps(fakeActions({ sendDm: async () => { dmCalls++; return true; } }));
  d.writeMessage = async () => {
    throw new Error("no clean message after 4 tries");
  };
  await runSequence(baseCfg(), db, d);
  assert.equal(await countProspectsByStatus(db, STATUS.skipped), 1);
  assert.equal(dmCalls, 0);
  drop();
});
