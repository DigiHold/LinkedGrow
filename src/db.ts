import { createClient, type Client } from "@libsql/client";
import { requireEnv } from "./config.ts";
import type { AgentContext, Config } from "./config.ts";
import { DEFAULTS } from "./config.ts";

/**
 * The worker's view of the database.
 *
 * Plan section 7g: the local SQLite store is replaced, the shape is kept. Every
 * statement here carries both workspaceId and agentId, per section 8e, because
 * the single-tenant original could assume there was only ever one customer and
 * this one cannot. A query that reaches this file without an owner is a bug,
 * not a convenience.
 */

let client: Client | null = null;

/**
 * Testing seam. The sequence tests run against a real local libsql file rather
 * than a fake, because what they are worth testing is the store code as well as
 * the sequence logic.
 */
export function setDbForTests(override: Client | null): void {
  client = override;
}

export function db(): Client {
  if (!client) {
    client = createClient({
      url: requireEnv("TURSO_DATABASE_URL"),
      authToken: requireEnv("TURSO_AUTH_TOKEN"),
    });
  }
  return client;
}

/** group_concat gives one string; an agent with no competitor source gives null. */
function splitLines(value: unknown): string[] {
  if (typeof value !== "string" || !value) return [];
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseList(value: unknown): string[] {
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Every agent the worker should consider this pass, with the context each one
 * needs. Paused, stopped and blocked agents never leave the database.
 */
export async function loadRunnableAgents(): Promise<AgentContext[]> {
  const { rows } = await db().execute(`
    SELECT
      a.id                AS agent_id,
      a.workspace_id      AS workspace_id,
      a.linkedin_account_id AS account_id,
      a.name              AS name,
      a.goal              AS goal,
      a.icp_summary       AS icp_summary,
      a.job_roles         AS job_roles,
      a.industries        AS industries,
      a.locations         AS locations,
      a.company_info      AS company_info,
      a.timezone          AS timezone,
      a.workday_start     AS workday_start,
      a.workday_end       AS workday_end,
      a.review_mode       AS review_mode,
      a.status            AS status,
      a.last_run_at       AS last_run_at,
      l.full_name         AS account_full_name,
      l.country           AS country,
      l.daily_invite_cap  AS account_cap,
      l.warmup_started_at AS warmup_started_at,
      l.status            AS account_status,
      (SELECT COUNT(*) FROM agents s WHERE s.linkedin_account_id = a.linkedin_account_id)
                          AS agents_on_account,
      -- The competitors this agent was pointed at. The miner needs them by name so it can drop
      -- the rival's own staff, who sit at the top of every reactions list on their own posts.
      (SELECT group_concat(s.label, char(10)) FROM agent_sources s
        WHERE s.agent_id = a.id AND s.type = 'competitor' AND s.enabled = 1)
                          AS competitor_labels
    FROM agents a
    JOIN linkedin_accounts l ON l.id = a.linkedin_account_id
    WHERE a.status IN ('active', 'warming')
      AND l.status IN ('pending', 'active')
  `);

  return rows.map((r) => {
    const startHour = Math.floor(Number(r.workday_start ?? 540) / 60);
    const endHour = Math.ceil(Number(r.workday_end ?? 1080) / 60);
    const cfg: Config = {
      enabled: true,
      account: {
        label: String(r.name ?? "agent"),
        chromeProfileDir: `profiles/${String(r.account_id)}`,
        timezone: String(r.timezone ?? "Europe/Zurich"),
      },
      business: { url: "", description: String(r.company_info ?? "") },
      businessHours: { startHour, endHour, days: [...DEFAULTS.businessHours.days] },
      warmup: { ...DEFAULTS.warmup },
      limits: { ...DEFAULTS.limits },
      delaysMs: { ...DEFAULTS.delaysMs },
      sequence: { ...DEFAULTS.sequence },
      leads: {
        topics: [],
        competitors: splitLines(r.competitor_labels),
        hashtags: [],
        icp: String(r.icp_summary ?? ""),
        icpKeywords: [
          ...parseList(r.job_roles),
          ...parseList(r.industries),
        ],
        intentQueries: [],
      },
      product: {
        name: "",
        senderName: "",
        valueProps: String(r.company_info ?? "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      },
    };

    return {
      agentId: String(r.agent_id),
      workspaceId: String(r.workspace_id),
      linkedinAccountId: String(r.account_id),
      country: String(r.country ?? ""),
      accountDailyInviteCap: Number(r.account_cap ?? 8),
      agentsOnAccount: Math.max(1, Number(r.agents_on_account ?? 1)),
      lastRunAt: r.last_run_at ? new Date(Number(r.last_run_at) * 1000) : null,
      warmupStartedAt: r.warmup_started_at ? new Date(Number(r.warmup_started_at) * 1000) : null,
      reviewMode: Number(r.review_mode ?? 0) === 1,
      // The wizard offers two, and until now the worker read neither.
      goal: String(r.goal ?? "conversations") === "meetings" ? "meetings" : "conversations",
      sender: {
        // The account's own first name. LinkedIn shows it beside every message,
        // so signing with anything else would read as a different person.
        firstName: String(r.account_full_name ?? "").trim().split(/\s+/)[0] ?? "",
        companyInfo: String(r.company_info ?? ""),
        location: String(r.locations ?? r.country ?? ""),
      },
      cfg,
    };
  });
}

/** The enabled sources an agent should mine, newest last so the oldest is refreshed first. */
export async function loadSources(ctx: AgentContext) {
  const { rows } = await db().execute({
    sql: `SELECT id, type, label, config, last_mined_at
          FROM agent_sources
          WHERE agent_id = ? AND workspace_id = ? AND enabled = 1
          ORDER BY COALESCE(last_mined_at, 0) ASC`,
    args: [ctx.agentId, ctx.workspaceId],
  });
  return rows.map((r) => ({
    id: String(r.id),
    type: String(r.type),
    label: String(r.label),
    config: typeof r.config === "string" ? r.config : null,
    lastMinedAt: r.last_mined_at ? new Date(Number(r.last_mined_at) * 1000) : null,
  }));
}

export interface FoundLead {
  profileId: string;
  profileUrl: string;
  fullName: string;
  headline?: string | null;
  jobTitle?: string | null;
  company?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  matchScore?: number | null;
  matchReason?: string | null;
  signalType?: string | null;
  signalText?: string | null;
  signalUrl?: string | null;
  signalAuthor?: string | null;
  sourceId?: string | null;
}

/**
 * Claims a lead for this workspace.
 *
 * Section 9c: the unique index on (workspace_id, profile_id) IS the claim. Two
 * agents mining overlapping markets will both find the same person, and the
 * winner is decided by the database rather than by a read-then-write that
 * races. A rejected insert means someone else already has them, which is the
 * correct outcome and not an error.
 *
 * Returns true when this call is the one that claimed them.
 */
export async function claimLead(ctx: AgentContext, lead: FoundLead): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const result = await db().execute({
    sql: `INSERT OR IGNORE INTO agent_leads
            (id, workspace_id, agent_id, source_id, profile_id, profile_url, full_name,
             headline, job_title, company, location, avatar_url, match_score, match_reason,
             signal_type, signal_text, signal_url, signal_author, step, step_at, found_at,
             created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'found', ?, ?, ?, ?)`,
    args: [
      crypto.randomUUID(), ctx.workspaceId, ctx.agentId, lead.sourceId ?? null,
      lead.profileId, lead.profileUrl, lead.fullName,
      lead.headline ?? null, lead.jobTitle ?? null, lead.company ?? null,
      lead.location ?? null, lead.avatarUrl ?? null, lead.matchScore ?? null,
      lead.matchReason ?? null, lead.signalType ?? null, lead.signalText ?? null,
      lead.signalUrl ?? null, lead.signalAuthor ?? null,
      now, now, now, now,
    ],
  });
  return result.rowsAffected > 0;
}

/** Leads waiting to enter the sequence, highest score first. */
export async function leadsAtStep(ctx: AgentContext, step: string, limit: number) {
  const { rows } = await db().execute({
    sql: `SELECT id, profile_id, profile_url, full_name, headline, job_title, company,
                 match_score, match_reason, signal_text, signal_url, step_at
          FROM agent_leads
          WHERE workspace_id = ? AND agent_id = ? AND step = ?
          ORDER BY COALESCE(match_score, 0) DESC, found_at ASC
          LIMIT ?`,
    args: [ctx.workspaceId, ctx.agentId, step, limit],
  });
  return rows;
}

export async function setLeadStep(ctx: AgentContext, leadId: string, step: string) {
  const now = Math.floor(Date.now() / 1000);
  await db().execute({
    sql: `UPDATE agent_leads SET step = ?, step_at = ?, updated_at = ?
          WHERE id = ? AND workspace_id = ?`,
    args: [step, now, now, leadId, ctx.workspaceId],
  });
}

/**
 * How many invitations this LINKEDIN ACCOUNT has sent since a moment.
 *
 * Counted on the account rather than the agent, because the limit is LinkedIn's
 * and LinkedIn watches the profile. An agent-scoped count is how two agents on
 * one account each send a full day's worth and the account gets restricted.
 */
export async function invitesSentByAccount(
  ctx: AgentContext,
  sinceEpochSeconds: number
): Promise<number> {
  const { rows } = await db().execute({
    sql: `SELECT COUNT(*) AS total
          FROM agent_queue q
          JOIN agents a ON a.id = q.agent_id
          WHERE a.linkedin_account_id = ?
            AND q.workspace_id = ?
            AND q.action = 'invite'
            AND q.state = 'sent'
            AND q.sent_at >= ?`,
    args: [ctx.linkedinAccountId, ctx.workspaceId, sinceEpochSeconds],
  });
  return Number(rows[0]?.total ?? 0);
}

export async function enqueue(
  ctx: AgentContext,
  leadId: string,
  action: "visit" | "like" | "invite" | "dm1" | "dm2" | "withdraw",
  scheduledAt: Date,
  messageBody: string | null
) {
  const now = Math.floor(Date.now() / 1000);
  await db().execute({
    sql: `INSERT INTO agent_queue
            (id, workspace_id, agent_id, lead_id, action, scheduled_at, message_body,
             state, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      crypto.randomUUID(), ctx.workspaceId, ctx.agentId, leadId, action,
      Math.floor(scheduledAt.getTime() / 1000), messageBody,
      // Review mode holds every message for the customer to approve first.
      ctx.reviewMode && messageBody ? "pending" : "approved",
      now, now,
    ],
  });
}

/** Work that is due now and cleared to run. */
export async function dueQueue(ctx: AgentContext, limit: number) {
  const { rows } = await db().execute({
    sql: `SELECT q.id, q.action, q.message_body, q.lead_id,
                 l.profile_url, l.profile_id, l.full_name
          FROM agent_queue q
          JOIN agent_leads l ON l.id = q.lead_id
          WHERE q.workspace_id = ? AND q.agent_id = ?
            AND q.state = 'approved'
            AND q.scheduled_at <= ?
          ORDER BY q.scheduled_at ASC
          LIMIT ?`,
    args: [ctx.workspaceId, ctx.agentId, Math.floor(Date.now() / 1000), limit],
  });
  return rows;
}

export async function markQueue(
  ctx: AgentContext,
  queueId: string,
  state: "sent" | "failed" | "skipped",
  failureReason?: string
) {
  const now = Math.floor(Date.now() / 1000);
  await db().execute({
    sql: `UPDATE agent_queue
          SET state = ?, sent_at = ?, failure_reason = ?, updated_at = ?
          WHERE id = ? AND workspace_id = ?`,
    args: [state, state === "sent" ? now : null, failureReason ?? null, now, queueId, ctx.workspaceId],
  });
}

export async function recordMessage(
  ctx: AgentContext,
  leadId: string,
  direction: "out" | "in",
  step: string,
  body: string
) {
  const now = Math.floor(Date.now() / 1000);
  await db().execute({
    sql: `INSERT INTO agent_messages
            (id, workspace_id, agent_id, lead_id, direction, step, body, sent_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [crypto.randomUUID(), ctx.workspaceId, ctx.agentId, leadId, direction, step, body, now, now],
  });
}

/**
 * The activity feed. The message is a finished English sentence, per section
 * 2c, so the dashboard never assembles copy from a type code at render time.
 */
export async function recordEvent(
  ctx: AgentContext,
  type: string,
  message: string,
  leadId?: string
) {
  await db().execute({
    sql: `INSERT INTO agent_events
            (id, workspace_id, agent_id, lead_id, type, message, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      crypto.randomUUID(), ctx.workspaceId, ctx.agentId, leadId ?? null,
      type, message, Math.floor(Date.now() / 1000),
    ],
  });
}

/**
 * Stops an agent and says why, in words the customer will read.
 *
 * Called on any LinkedIn challenge or restriction. Section 8a layer 6: stop at
 * once, never retry, because a retry storm against a checkpoint is how a
 * warning becomes a ban.
 */
export async function pauseAgent(ctx: AgentContext, reason: string) {
  const now = Math.floor(Date.now() / 1000);
  await db().execute({
    sql: `UPDATE agents SET status = 'paused', paused_reason = ?, updated_at = ?
          WHERE id = ? AND workspace_id = ?`,
    args: [reason, now, ctx.agentId, ctx.workspaceId],
  });
  await recordEvent(ctx, "paused", reason);
}

/** Marks the account itself, which pauses every agent that sends from it. */
export async function flagAccount(
  ctx: AgentContext,
  status: "challenged" | "restricted",
  reason: string
) {
  const now = Math.floor(Date.now() / 1000);
  await db().batch([
    {
      sql: `UPDATE linkedin_accounts SET status = ?, status_reason = ?, updated_at = ?
            WHERE id = ? AND workspace_id = ?`,
      args: [status, reason, now, ctx.linkedinAccountId, ctx.workspaceId],
    },
    {
      sql: `UPDATE agents SET status = 'paused', paused_reason = ?, updated_at = ?
            WHERE linkedin_account_id = ? AND workspace_id = ?`,
      args: [reason, now, ctx.linkedinAccountId, ctx.workspaceId],
    },
  ]);
  await recordEvent(ctx, status, reason);
}

export async function touchRun(ctx: AgentContext) {
  await db().execute({
    sql: `UPDATE agents SET last_run_at = ?, updated_at = ? WHERE id = ? AND workspace_id = ?`,
    args: [
      Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000),
      ctx.agentId, ctx.workspaceId,
    ],
  });
}
