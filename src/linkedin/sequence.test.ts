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
       sequence_status TEXT NOT NULL DEFAULT 'queued', angle TEXT,
       reply_intent TEXT, signal_hits INTEGER NOT NULL DEFAULT 1, signal_kinds TEXT,
       outcome TEXT, outcome_at INTEGER)`,
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
  over: { headline?: string; source?: string; score?: number | null } = {},
): Promise<string> {
  const pid = `p-${++counter}`;
  const id = crypto.randomUUID();
  const at = Math.floor(new Date(updatedAt).getTime() / 1000);
  await sharedDb().execute({
    sql: `INSERT INTO agent_leads
            (id, workspace_id, agent_id, profile_id, profile_url, full_name, first_name,
             headline, signal_type, sequence_status, step, match_score, found_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'Jane Doe', 'Jane', ?, ?, ?, 'queued', ?, ?, ?, ?)`,
    args: [
      id, db.workspaceId, db.agentId, pid,
      `https://www.linkedin.com/in/${pid}/`,
      over.headline ?? "Head of Security",
      over.source ?? "reaction:snyk",
      status,
      over.score === undefined ? 80 : over.score,
      at, at, at,
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
    sendConnect: async () => "sent" as const,
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
    deps(actions, (m) => alerts.push(m), async () => ({ handOver: true, why: "asked what it costs", intent: "interested" as const }))
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
    deps(actions, (m) => alerts.push(m), async () => ({ handOver: false, why: "a question about us", intent: "neutral" as const }))
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
  // No readReply: the words alone have to settle this one. And a no ends the
  // thread quietly (stopped, no alert): nobody wants to inherit a refusal.
  await runSequence(baseCfg(), db, deps(actions, (m) => alerts.push(m)));
  assert.equal(await countProspectsByStatus(db, STATUS.stopped), 1);
  assert.equal(await countProspectsByStatus(db, STATUS.handedOver), 0);
  assert.equal(alerts.length, 0);
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
    deps(actions, () => {}, async () => ({ handOver: false, why: "", intent: "neutral" as const }))
  );
  assert.equal(await countProspectsByStatus(db, STATUS.handedOver), 1);
  drop();
});

test("a conversation gets an answer, and the answer is not the ask", async () => {
  const db = await freshDb();
  const id = await seed(db, STATUS.conversing, daysAgo(1));
  // Conversing means they wrote last; without their message there is nothing
  // to answer and the guard below holds the agent's tongue.
  const past = Math.floor(Date.now() / 1000) - 7200;
  await sharedDb().execute({
    sql: `INSERT INTO agent_messages (id, workspace_id, agent_id, lead_id, direction, step, body, sent_at, created_at)
          VALUES (?, ?, ?, ?, 'in', NULL, 'That sounds a lot like what I run into too', ?, ?)`,
    args: [crypto.randomUUID(), db.workspaceId, db.agentId, id, past, past],
  });
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

/**
 * The Gibran DM of 2026-08-17: a converse turn fired while the last word in
 * the thread was ours, and the model shipped "Gibran didn't answer yet, so
 * nothing to reply to there" as a real message. When the agent asked last,
 * it waits; silence is the ask's business, on its own clock.
 */
test("the agent never nudges a conversation where it spoke last", async () => {
  const db = await freshDb();
  const id = await seed(db, STATUS.conversing, daysAgo(1));
  const past = Math.floor(Date.now() / 1000) - 7200;
  await sharedDb().execute({
    sql: `INSERT INTO agent_messages (id, workspace_id, agent_id, lead_id, direction, step, body, sent_at, created_at)
          VALUES (?, ?, ?, ?, 'out', 'converse', 'What are you building these days, mostly client work or your own thing?', ?, ?)`,
    args: [crypto.randomUUID(), db.workspaceId, db.agentId, id, past, past],
  });
  await runSequence(baseCfg(), db, deps(fakeActions()));
  const { rows } = await sharedDb().execute({
    sql: "SELECT COUNT(*) AS n FROM agent_messages WHERE lead_id = ? AND direction = 'out'",
    args: [id],
  });
  assert.equal(Number(rows[0]?.n), 1, "no second message while they owe the reply");
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

test("a message that cannot be generated sends nothing and keeps the prospect in place", async () => {
  const db = await freshDb();
  let dmCalls = 0;
  await seed(db, STATUS.helloAnswered, daysAgo(1));
  const d = deps(fakeActions({ sendDm: async () => { dmCalls++; return true; } }));
  d.writeMessage = async () => {
    throw new Error("no clean message after 4 tries");
  };
  await runSequence(baseCfg(), db, d);
  // Nothing sent, nothing thrown away: the step is retried on the next pass
  // (2026-08-17, the cycle runs to its end unless the lead is hot, refused or gone).
  assert.equal(dmCalls, 0);
  assert.equal(await countProspectsByStatus(db, STATUS.skipped), 0);
  assert.equal(await countProspectsByStatus(db, STATUS.helloAnswered), 1);
  drop();
});

/**
 * The hello that could not be delivered, 2026-08-08.
 *
 * Three prospects sat at connected and every hello to them failed. Their
 * profiles read "2nd" with a Pending invitation: they had never accepted. A
 * free account writing to a second-degree connection is answered by LinkedIn
 * with a Premium upsell rather than a composer, which is what the log line
 * "could not open a conversation" was actually reporting.
 */
test("a hello that cannot be delivered puts the prospect back to waiting on the invite", async () => {
  const db = await freshDb();
  const id = await seed(db, STATUS.connected, daysAgo(1));
  await runSequence(
    baseCfg(),
    db,
    deps(fakeActions({ sendDm: async () => false }))
  );
  const { rows } = await sharedDb().execute({
    sql: `SELECT sequence_status FROM agent_leads WHERE id = ?`,
    args: [id],
  });
  assert.equal(
    String(rows[0]?.sequence_status),
    STATUS.connectSent,
    "believing they accepted a second time costs a profile visit on every pass, for ever"
  );
  drop();
});

test("rewinding does not restart the clock, or the invite is never withdrawn", async () => {
  const db = await freshDb();
  // Invited long enough ago that the stale check should be able to fire.
  const id = await seed(db, STATUS.connected, daysAgo(30));
  const before = await sharedDb().execute({
    sql: `SELECT updated_at FROM agent_leads WHERE id = ?`,
    args: [id],
  });
  await runSequence(baseCfg(), db, deps(fakeActions({ sendDm: async () => false })));
  const after = await sharedDb().execute({
    sql: `SELECT updated_at, sequence_status FROM agent_leads WHERE id = ?`,
    args: [id],
  });
  assert.equal(String(after.rows[0]?.sequence_status), STATUS.connectSent);
  assert.equal(
    Number(after.rows[0]?.updated_at),
    Number(before.rows[0]?.updated_at),
    "a rewind that stamps updated_at makes every stale invite look fresh for ever"
  );
  drop();
});

test("a failure after the hello does not rewind anybody", async () => {
  // The intro follows a message that was delivered, so a failure there is a
  // different problem and must not rewind somebody who is plainly connected.
  const db = await freshDb();
  const id = await seed(db, STATUS.helloSent, daysAgo(5));
  await runSequence(baseCfg(), db, deps(fakeActions({ sendDm: async () => false })));
  const { rows } = await sharedDb().execute({
    sql: `SELECT sequence_status FROM agent_leads WHERE id = ?`,
    args: [id],
  });
  assert.equal(String(rows[0]?.sequence_status), STATUS.helloSent);
  drop();
});

/**
 * Why Today's queue showed the same names since the day the agent started.
 *
 * Measured on a live pass on 2026-08-10: of thirteen attempts to connect,
 * eleven came back false. Six were profiles with no Connect control at all,
 * which will never change, and five already had an invitation pending from an
 * earlier pass. All eleven stayed queued and were tried again next pass, and
 * every pass after that. Two real invitations a day were going out against an
 * allowance of sixteen, so the queue never drained and the customer looked at
 * the same list every morning.
 */
test("a profile that cannot be invited leaves the queue instead of being retried for ever", async () => {
  const db = await freshDb();
  const id = await seed(db, STATUS.queued, daysAgo(1));
  await runSequence(
    baseCfg(),
    db,
    deps(fakeActions({ sendConnect: async () => "cannot-connect" as const }))
  );
  const { rows } = await sharedDb().execute({
    sql: `SELECT sequence_status FROM agent_leads WHERE id = ?`,
    args: [id],
  });
  assert.equal(String(rows[0]?.sequence_status), STATUS.skipped);
  drop();
});

test("an invitation already out there catches the record up rather than being resent", async () => {
  const db = await freshDb();
  const id = await seed(db, STATUS.queued, daysAgo(1));
  await runSequence(
    baseCfg(),
    db,
    deps(fakeActions({ sendConnect: async () => "already-pending" as const }))
  );
  const { rows } = await sharedDb().execute({
    sql: `SELECT sequence_status FROM agent_leads WHERE id = ?`,
    args: [id],
  });
  assert.equal(
    String(rows[0]?.sequence_status),
    STATUS.connectSent,
    "the sweep cannot watch for an acceptance while they sit in the queue"
  );
  // Nothing was sent today, so nothing is charged against the day's allowance.
  assert.equal(await countActionsSince(db, "connect", daysAgo(1)), 0);
  drop();
});

test("a transient failure leaves them queued, to be tried again", async () => {
  const db = await freshDb();
  const id = await seed(db, STATUS.queued, daysAgo(1));
  await runSequence(baseCfg(), db, deps(fakeActions({ sendConnect: async () => "failed" as const })));
  const { rows } = await sharedDb().execute({
    sql: `SELECT sequence_status FROM agent_leads WHERE id = ?`,
    args: [id],
  });
  assert.equal(String(rows[0]?.sequence_status), STATUS.queued);
  drop();
});

/**
 * ZHANYA QIN, and the floor that was guarding nothing.
 *
 * "Founder at GDPRChecker | Cookie Consent & Privacy Readiness", scored 0 with
 * the reason "Founder of a compliance/privacy tool", against a customer whose
 * product includes a cookie consent banner. The scorer read her perfectly.
 *
 * A score floor had been added to leadsAtStep two days earlier and reported as
 * the fix. leadsAtStep is called by nothing: the sequence reads its people
 * through getProspects at all seven steps. So she received a hello, answered
 * it, and sat at hello_answered waiting for the next message to go out.
 */
function scoringCfg(): Config {
  return baseCfg({ leads: { icp: "Founders who ship their own product" } } as Partial<Config>);
}

test("a lead below the floor is never written to, at any step", async () => {
  for (const status of [STATUS.connected, STATUS.helloSent, STATUS.introSent]) {
    const db = await freshDb();
    const id = await seed(db, status, daysAgo(9), { score: 0 });
    let sent = 0;
    await runSequence(scoringCfg(), db, deps(fakeActions({ sendDm: async () => { sent += 1; return true; } })));
    assert.equal(sent, 0, `a 0 was written to from ${status}`);
    const { rows } = await sharedDb().execute({
      sql: `SELECT sequence_status FROM agent_leads WHERE id = ?`,
      args: [id],
    });
    assert.equal(String(rows[0]?.sequence_status), STATUS.skipped);
    drop();
  }
});

/**
 * Who inherits a weak lead's reply, decided by what the reply was worth.
 *
 * The old rule handed over anybody below the line who had written back, and
 * on 2026-08-15 the customer's Yours-now list was 7 conversations of "Hi" and
 * a thumbs-up, none of them interested. Interest goes to the customer;
 * small talk fades out with the agent.
 */
test("small talk from a weak lead fades out instead of landing on the customer", async () => {
  const db = await freshDb();
  const id = await seed(db, STATUS.helloAnswered, daysAgo(9), { score: 0 });
  await runSequence(scoringCfg(), db, deps(fakeActions()));
  const { rows } = await sharedDb().execute({
    sql: `SELECT sequence_status FROM agent_leads WHERE id = ?`,
    args: [id],
  });
  assert.equal(
    String(rows[0]?.sequence_status),
    STATUS.skipped,
    "nobody inherits a greeting from a mismatch"
  );
  drop();
});

test("a weak lead who wrote back interested still goes to the customer, with an alert", async () => {
  const db = await freshDb();
  const alerts: string[] = [];
  const id = await seed(db, STATUS.helloAnswered, daysAgo(9), { score: 0 });
  await sharedDb().execute({
    sql: `UPDATE agent_leads SET reply_intent = 'interested' WHERE id = ?`,
    args: [id],
  });
  await runSequence(scoringCfg(), db, deps(fakeActions(), (m) => alerts.push(m)));
  const { rows } = await sharedDb().execute({
    sql: `SELECT sequence_status FROM agent_leads WHERE id = ?`,
    args: [id],
  });
  assert.equal(String(rows[0]?.sequence_status), STATUS.handedOver);
  assert.equal(alerts.length, 1);
  assert.match(alerts[0] ?? "", /interested/);
  drop();
});

test("a good lead is unaffected by the floor", async () => {
  const db = await freshDb();
  await seed(db, STATUS.connected, daysAgo(9), { score: 85 });
  let sent = 0;
  await runSequence(scoringCfg(), db, deps(fakeActions({ sendDm: async () => { sent += 1; return true; } })));
  assert.equal(sent, 1);
  drop();
});

test("an agent with no ICP writes to everybody, because it never scores anybody", async () => {
  const db = await freshDb();
  await seed(db, STATUS.connected, daysAgo(9), { score: null });
  let sent = 0;
  await runSequence(baseCfg(), db, deps(fakeActions({ sendDm: async () => { sent += 1; return true; } })));
  assert.equal(sent, 1, "gating on a score that never arrives would silence the agent");
  drop();
});

/**
 * No Connect button means two opposite things, and this treated them as one.
 *
 * A follow-only profile has no Connect and never will, so letting it go is
 * right. Somebody who is ALREADY a first-degree connection has no Connect
 * either, for the best possible reason, and they were marked skipped and never
 * spoken to again. That is the warmest lead the product can produce: it is
 * exactly the person who commented under the customer's own post and is already
 * in their network, with nothing at all to wait for.
 */
test("somebody already connected is written to instead of being thrown away", async () => {
  const db = await freshDb();
  await seed(db, STATUS.queued, daysAgo(0));
  await runSequence(
    baseCfg(),
    db,
    deps(
      fakeActions({
        sendConnect: async () => "cannot-connect" as const,
        canMessageNow: async () => true,
      })
    )
  );
  assert.equal(await countProspectsByStatus(db, STATUS.connected), 1);
  assert.equal(await countProspectsByStatus(db, STATUS.skipped), 0);
  drop();
});

test("a follow-only profile is still let go, because there is no way to reach them", async () => {
  const db = await freshDb();
  await seed(db, STATUS.queued, daysAgo(0));
  await runSequence(
    baseCfg(),
    db,
    deps(
      fakeActions({
        sendConnect: async () => "cannot-connect" as const,
        canMessageNow: async () => false,
      })
    )
  );
  assert.equal(await countProspectsByStatus(db, STATUS.skipped), 1);
  assert.equal(await countProspectsByStatus(db, STATUS.connected), 0);
  drop();
});

/**
 * What the reply was worth, recorded separately from who answers it.
 *
 * The two questions have opposite answers all the time. "Not interested" hands
 * over and is worthless; "what does it cost" hands over and is the best thing
 * that can happen; "thanks for connecting" does neither. Counting all three the
 * same at a weight of eight is what taught one live agent that a competitor was
 * a good prospect.
 */
test("the reply is graded, and a polite hello is not recorded as interest", async () => {
  const db = await freshDb();
  const id = await seed(db, STATUS.helloSent, daysAgo(1));
  await runSequence(
    baseCfg(),
    db,
    deps(
      fakeActions({
        inboxRepliers: async () => ["Jane Doe"],
        readThread: async () => [{ from: "them" as const, body: "Thanks for connecting!" }],
      }),
      () => {},
      async () => ({ handOver: false, why: "polite thanks", intent: "neutral" as const })
    )
  );
  const { rows } = await sharedDb().execute({
    sql: `SELECT reply_intent FROM agent_leads WHERE id = ?`,
    args: [id],
  });
  assert.equal(String(rows[0]?.reply_intent), "neutral");
  drop();
});

test("a refusal caught by the words alone ends the thread quietly, without a model call", async () => {
  const db = await freshDb();
  const alerts: string[] = [];
  const id = await seed(db, STATUS.helloSent, daysAgo(1));
  await runSequence(
    baseCfg(),
    db,
    // No readReply at all: the words have to settle it and still record it.
    deps(
      fakeActions({
        inboxRepliers: async () => ["Jane Doe"],
        readThread: async () => [{ from: "them" as const, body: "Not interested, thanks" }],
      }),
      (m) => alerts.push(m)
    )
  );
  const { rows } = await sharedDb().execute({
    sql: `SELECT reply_intent, sequence_status FROM agent_leads WHERE id = ?`,
    args: [id],
  });
  assert.equal(String(rows[0]?.reply_intent), "refused");
  // Stopped, not handed over: nobody wants to inherit a no, and no email goes out about one.
  assert.equal(String(rows[0]?.sequence_status), STATUS.stopped);
  assert.equal(alerts.length, 0);
  drop();
});

test("a seller pitching us is wound down quietly, never handed over", async () => {
  const db = await freshDb();
  const alerts: string[] = [];
  await seed(db, STATUS.introSent, daysAgo(1));
  const actions = fakeActions({
    inboxRepliers: async () => ["Jane Doe"],
    readThread: async () => [
      { from: "them" as const, body: "I am actually looking for a co founder from abroad to be my partner" },
    ],
  });
  await runSequence(
    baseCfg(),
    db,
    // Even a model calling it HUMAN cannot forward a solicitation: refused wins.
    deps(actions, (m) => alerts.push(m), async () => ({ handOver: true, why: "asks to partner", intent: "refused" as const }))
  );
  assert.equal(await countProspectsByStatus(db, STATUS.stopped), 1);
  assert.equal(await countProspectsByStatus(db, STATUS.handedOver), 0);
  assert.equal(alerts.length, 0);
  drop();
});

/**
 * A draft that fails the gate costs the pass, never the person. It used to
 * set skipped, which threw a lead away for good because one message came out
 * unwritable four times in a row (Nicolas, 2026-08-17: the cycle runs to its
 * end unless the lead is hot, refused or gone).
 */
test("a message that cannot pass the gate leaves the lead in place for the next pass", async () => {
  const db = await freshDb();
  const id = await seed(db, STATUS.connected, daysAgo(1));
  const failing = deps(fakeActions());
  failing.writeMessage = async () => {
    throw new Error("Could not write a message that passes the gate");
  };
  await runSequence(baseCfg(), db, failing);
  const { rows } = await sharedDb().execute({
    sql: `SELECT sequence_status FROM agent_leads WHERE id = ?`,
    args: [id],
  });
  assert.equal(String(rows[0]?.sequence_status), STATUS.connected, "the step is retried, not abandoned");
  drop();
});
