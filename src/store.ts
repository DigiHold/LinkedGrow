import { db } from "./db.ts";
import type { AgentContext } from "./config.ts";

/**
 * The storage layer, replaced and shaped exactly like the original.
 *
 * Plan section 7g: "Replace the storage layer, keep the shape. Same tables and
 * same queries against Turso, with workspaceId and agentId in every WHERE
 * clause." So every function below keeps the name, the argument order and the
 * row field names the ported engine already reads. Two things differ, and only
 * two:
 *
 * 1. **They are async.** libsql is over the network and better-sqlite3 was not.
 *    The call sites gain an await; the interiors of sequence.ts and miner.ts
 *    are untouched otherwise.
 * 2. **The handle carries the tenant.** The original passed a database. This
 *    passes a database plus the agent it belongs to, so ownership lands in
 *    every WHERE clause without threading two arguments through every call.
 *
 * The engine's own lifecycle lives in `sequence_status`, verbatim, and the
 * customer-facing funnel value in `step` is derived from it. Collapsing the two
 * would lose the difference between a first and a second DM, which is exactly
 * what the sequence needs to decide what comes next.
 */

export type DB = AgentContext;

export interface ProspectRow {
  id: number;
  profile_id: string | null;
  profile_url: string;
  full_name: string | null;
  first_name: string | null;
  headline: string | null;
  company: string | null;
  /** Their photo, on our own bucket. The live ticker puts a face on the row. */
  avatar_url: string | null;
  website: string | null;
  source: string | null;
  angle: string | null;
  context: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/** The row id the engine works with is a number; ours is a uuid. Kept side by side. */
const idMap = new Map<number, string>();
let nextLocalId = 1;

function localId(uuid: string): number {
  for (const [n, u] of idMap) if (u === uuid) return n;
  const n = nextLocalId++;
  idMap.set(n, uuid);
  return n;
}

function uuidFor(id: number): string {
  const uuid = idMap.get(id);
  if (!uuid) throw new Error(`Unknown prospect id ${id}`);
  return uuid;
}

/** What the customer sees, derived from what the engine is doing. */
const FUNNEL: Record<string, string> = {
  queued: "queued",
  connect_sent: "invited",
  connected: "accepted",
  hello_sent: "messaged",
  hello_answered: "replied",
  intro_sent: "messaged",
  conversing: "replied",
  ask_sent: "messaged",
  handed_over: "replied",
  stopped: "finished",
  skipped: "skipped",
};

function toRow(r: Record<string, unknown>): ProspectRow {
  return {
    id: localId(String(r.id)),
    profile_id: (r.profile_id as string) ?? null,
    profile_url: String(r.profile_url),
    full_name: (r.full_name as string) ?? null,
    first_name: (r.first_name as string) ?? null,
    headline: (r.headline as string) ?? null,
    company: (r.company as string) ?? null,
    avatar_url: (r.avatar_url as string) ?? null,
    website: null,
    source: (r.signal_type as string) ?? null,
    angle: (r.angle as string) ?? null,
    context: (r.signal_text as string) ?? null,
    status: String(r.sequence_status ?? "queued"),
    created_at: new Date(Number(r.found_at ?? 0) * 1000).toISOString(),
    updated_at: new Date(Number(r.updated_at ?? 0) * 1000).toISOString(),
  };
}

/**
 * Prospects in a status, oldest first.
 *
 * The priority clause is the original's and stays: someone who asked about the
 * problem out loud is worth contacting before the rest of an audience who
 * merely engaged, and within each tier the oldest goes first so nobody waits
 * forever.
 */
export async function getProspects(
  ctx: DB,
  status: string,
  opts: { olderThan?: string; limit?: number } = {}
): Promise<ProspectRow[]> {
  const clauses = ["workspace_id = ?", "agent_id = ?", "sequence_status = ?"];
  const args: (string | number)[] = [ctx.workspaceId, ctx.agentId, status];
  if (opts.olderThan) {
    clauses.push("updated_at <= ?");
    args.push(Math.floor(new Date(opts.olderThan).getTime() / 1000));
  }
  args.push(opts.limit ?? 1000);

  const priority = `CASE WHEN signal_type LIKE 'question:%' OR signal_type LIKE 'intent:%' THEN 0 ELSE 1 END`;
  const { rows } = await db().execute({
    sql: `SELECT * FROM agent_leads WHERE ${clauses.join(" AND ")}
          ORDER BY ${priority}, updated_at ASC LIMIT ?`,
    args,
  });
  return rows.map((r) => toRow(r as unknown as Record<string, unknown>));
}

export async function setProspectStatus(
  ctx: DB,
  id: number,
  status: string,
  angle?: string
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const step = FUNNEL[status] ?? "queued";
  await db().execute({
    sql:
      angle === undefined
        ? `UPDATE agent_leads SET sequence_status = ?, step = ?, step_at = ?, updated_at = ?
           WHERE id = ? AND workspace_id = ?`
        : `UPDATE agent_leads SET sequence_status = ?, step = ?, angle = ?, step_at = ?, updated_at = ?
           WHERE id = ? AND workspace_id = ?`,
    args:
      angle === undefined
        ? [status, step, now, now, uuidFor(id), ctx.workspaceId]
        : [status, step, angle, now, now, uuidFor(id), ctx.workspaceId],
  });
}

/** The audit trail of what was written, whether or not it went out. */
export async function recordMessage(
  ctx: DB,
  prospectId: number,
  step: string,
  body: string,
  _angle: string,
  sent: boolean
): Promise<void> {
  if (!sent) return; // an unsent draft belongs to the queue, not the thread
  const now = Math.floor(Date.now() / 1000);
  await db().execute({
    sql: `INSERT INTO agent_messages
            (id, workspace_id, agent_id, lead_id, direction, step, body, sent_at, created_at)
          VALUES (?, ?, ?, ?, 'out', ?, ?, ?, ?)`,
    args: [
      crypto.randomUUID(), ctx.workspaceId, ctx.agentId, uuidFor(prospectId),
      step, body, now, now,
    ],
  });
}

/**
 * What they wrote back.
 *
 * The converse step cannot answer a message it has not read, so an inbound
 * reply is stored the same way an outbound one is. Nothing else in the system
 * writes direction 'in'.
 */
export async function recordInbound(
  ctx: DB,
  prospectId: number,
  body: string
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db().execute({
    sql: `INSERT INTO agent_messages
            (id, workspace_id, agent_id, lead_id, direction, step, body, sent_at, created_at)
          VALUES (?, ?, ?, ?, 'in', NULL, ?, ?, ?)`,
    args: [
      crypto.randomUUID(), ctx.workspaceId, ctx.agentId, uuidFor(prospectId),
      body, now, now,
    ],
  });
}

/** The conversation so far, oldest first, which is the order it is read in. */
export async function getThread(
  ctx: DB,
  prospectId: number
): Promise<{ from: "us" | "them"; body: string }[]> {
  const res = await db().execute({
    sql: `SELECT direction, body FROM agent_messages
          WHERE workspace_id = ? AND agent_id = ? AND lead_id = ?
          ORDER BY sent_at ASC, created_at ASC`,
    args: [ctx.workspaceId, ctx.agentId, uuidFor(prospectId)],
  });
  return res.rows.map((r) => ({
    from: String(r.direction) === "in" ? ("them" as const) : ("us" as const),
    body: String(r.body),
  }));
}

/** How many times the agent has already answered. Caps the converse loop. */
export async function countOutboundStep(
  ctx: DB,
  prospectId: number,
  step: string
): Promise<number> {
  const res = await db().execute({
    sql: `SELECT COUNT(*) AS n FROM agent_messages
          WHERE workspace_id = ? AND agent_id = ? AND lead_id = ?
            AND direction = 'out' AND step = ?`,
    args: [ctx.workspaceId, ctx.agentId, uuidFor(prospectId), step],
  });
  return Number(res.rows[0]?.n ?? 0);
}

/**
 * Says what the agent is about to do, before it does it.
 *
 * Everything else in this file is written after the fact, which is why the
 * dashboard could only narrate the past. This one row per agent is overwritten
 * as the pass moves, and the dashboard polls it, so somebody watching sees
 * "liking a post by Thomas Blanc" while that is happening rather than reading
 * about it a minute later.
 *
 * Best effort on purpose. A ticker that cannot be written is not a reason to
 * stop working, so every failure here is swallowed: the caller is in the middle
 * of a LinkedIn session and this is decoration.
 */
export async function announce(
  ctx: DB,
  verb: string,
  subject?: { name?: string | null; avatarUrl?: string | null; profileUrl?: string | null },
  detail?: string
): Promise<void> {
  try {
    await db().execute({
      sql: `INSERT INTO agent_activity
              (agent_id, workspace_id, verb, subject_name, subject_avatar, subject_url, detail, started_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(agent_id) DO UPDATE SET
              verb = excluded.verb,
              subject_name = excluded.subject_name,
              subject_avatar = excluded.subject_avatar,
              subject_url = excluded.subject_url,
              detail = excluded.detail,
              started_at = excluded.started_at`,
      args: [
        ctx.agentId, ctx.workspaceId, verb,
        subject?.name ?? null, subject?.avatarUrl ?? null, subject?.profileUrl ?? null,
        detail ?? null, Math.floor(Date.now() / 1000),
      ],
    });
  } catch {
    return;
  }
}

/**
 * Stops narrating.
 *
 * Called when a pass ends. The reader also ignores anything older than a few
 * minutes, so a session the watchdog kills mid-action goes quiet on its own
 * rather than claiming forever that the agent is still working.
 */
export async function stopAnnouncing(ctx: DB): Promise<void> {
  try {
    await db().execute({
      sql: `DELETE FROM agent_activity WHERE agent_id = ?`,
      args: [ctx.agentId],
    });
  } catch {
    return;
  }
}

/**
 * Every action the engine takes, which is also what the daily caps are counted
 * from. Counted on the LinkedIn ACCOUNT rather than the agent wherever the
 * limit is LinkedIn's, because LinkedIn watches the profile and two agents on
 * one account would otherwise each spend a full day's allowance.
 */
export async function recordAction(
  ctx: DB,
  prospectId: number | null,
  type: string,
  detail = ""
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db().execute({
    sql: `INSERT INTO agent_actions
            (id, workspace_id, agent_id, linkedin_account_id, lead_id, type, detail, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      crypto.randomUUID(), ctx.workspaceId, ctx.agentId, ctx.linkedinAccountId,
      prospectId === null ? null : uuidFor(prospectId), type, detail, now,
    ],
  });
}

/**
 * How many of an action happened since a moment.
 *
 * Invitations are counted across the whole LinkedIn account. Everything else is
 * counted per agent, because those limits are ours rather than LinkedIn's.
 */
export async function countActionsSince(
  ctx: DB,
  type: string,
  sinceIso: string
): Promise<number> {
  const since = Math.floor(new Date(sinceIso).getTime() / 1000);
  // Every limit LinkedIn enforces belongs to the account, never to whatever we happen to call an
  // agent, so the counting has to match. Invitations were already account-wide and messages were
  // not, which meant two agents on one profile each sent a full day's worth: forty messages from a
  // person who is allowed twenty. Anything that touches another human counts against the account.
  const accountWide = type === "connect" || type === "invite" || type === "dm";
  const { rows } = await db().execute({
    sql: `SELECT COUNT(*) AS total FROM agent_actions
          WHERE workspace_id = ? AND ${accountWide ? "linkedin_account_id = ?" : "agent_id = ?"}
            AND type = ? AND created_at >= ?`,
    args: [
      ctx.workspaceId,
      accountWide ? ctx.linkedinAccountId : ctx.agentId,
      type,
      since,
    ],
  });
  return Number(rows[0]?.total ?? 0);
}

export async function countProspectsByStatus(ctx: DB, status: string): Promise<number> {
  const { rows } = await db().execute({
    sql: `SELECT COUNT(*) AS total FROM agent_leads
          WHERE workspace_id = ? AND agent_id = ? AND sequence_status = ?`,
    args: [ctx.workspaceId, ctx.agentId, status],
  });
  return Number(rows[0]?.total ?? 0);
}

export async function hasActionWithDetail(
  ctx: DB,
  type: string,
  detail: string
): Promise<boolean> {
  const { rows } = await db().execute({
    sql: `SELECT 1 FROM agent_actions
          WHERE workspace_id = ? AND agent_id = ? AND type = ? AND detail = ? LIMIT 1`,
    args: [ctx.workspaceId, ctx.agentId, type, detail],
  });
  return rows.length > 0;
}

/** Small per-agent key-value state, the original's meta table. */
export async function getMeta(ctx: DB, key: string): Promise<string | null> {
  const { rows } = await db().execute({
    sql: `SELECT value FROM agent_meta WHERE agent_id = ? AND key = ? LIMIT 1`,
    args: [ctx.agentId, key],
  });
  const value = rows[0]?.value;
  return typeof value === "string" ? value : null;
}

export async function setMeta(ctx: DB, key: string, value: string): Promise<void> {
  await db().execute({
    sql: `INSERT INTO agent_meta (agent_id, workspace_id, key, value, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(agent_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [ctx.agentId, ctx.workspaceId, key, value, Math.floor(Date.now() / 1000)],
  });
}

/** Testing seam: the id map is process-local and must not leak between runs. */
export function resetIdMap(): void {
  idMap.clear();
  nextLocalId = 1;
}

/**
 * The account's own past messages, used as few-shot samples so generated text
 * matches how this person actually writes.
 *
 * Keyed on the LinkedIn ACCOUNT rather than the agent: the voice belongs to the
 * human whose profile it is, and every agent sending from that profile should
 * sound like them.
 */
export async function getStyleSamplesFor(ctx: DB, limit = 8): Promise<string[]> {
  const { rows } = await db().execute({
    sql: `SELECT body FROM agent_style_samples
          WHERE linkedin_account_id = ? AND workspace_id = ?
          ORDER BY captured_at DESC LIMIT ?`,
    args: [ctx.linkedinAccountId, ctx.workspaceId, limit],
  });
  return rows.map((r) => String(r.body));
}

export async function saveStyleSample(ctx: DB, body: string): Promise<void> {
  await db().execute({
    sql: `INSERT INTO agent_style_samples
            (id, workspace_id, linkedin_account_id, body, captured_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      crypto.randomUUID(), ctx.workspaceId, ctx.linkedinAccountId,
      body, Math.floor(Date.now() / 1000),
    ],
  });
}
