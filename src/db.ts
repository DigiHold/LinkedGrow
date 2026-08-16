import { createClient, type Client } from "@libsql/client";
import { requireEnv } from "./config.ts";
import type { AgentContext, Config } from "./config.ts";
import { DEFAULTS } from "./config.ts";
import { timezoneForCountry } from "./browser/fingerprint.ts";
import { firstNameOf } from "./names.ts";
import { minimumScore } from "./linkedin/competitor.ts";

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

/**
 * The days an agent works, Sunday being 0.
 *
 * The worker used to apply Monday to Friday from a constant, with nowhere for a customer to say
 * otherwise. An empty or broken value falls back to the default rather than to no days at all,
 * because an agent that never runs is the worst reading of a bad input.
 */
/**
 * Sunday is 0 when the customer ticks it and 7 everywhere it is read.
 *
 * The wizard maps DAY_NAMES starting at "Sun", so the index it stores is the
 * JavaScript convention: Sunday 0, Saturday 6. Both clocks in the worker return
 * the ISO one: Monday 1, Sunday 7. Monday to Saturday happen to agree, so
 * nothing ever looked wrong, and Sunday could never match anything: a customer
 * who ticked it got an agent that stayed silent all day and never said why.
 *
 * Normalised here, once, so every consumer downstream can assume ISO.
 */
function parseDays(value: unknown): number[] {
  const toIso = (n: number): number => (n === 0 ? 7 : n);
  const parsed = parseList(value)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 7)
    .map(toIso);
  if (parsed.length) return [...new Set(parsed)].sort();
  if (typeof value === "string") {
    try {
      const raw = JSON.parse(value) as unknown;
      if (Array.isArray(raw)) {
        const nums = raw
          .filter((n): n is number => Number.isInteger(n) && n >= 0 && n <= 7)
          .map((n) => (n === 0 ? 7 : n));
        if (nums.length) return [...new Set(nums)].sort();
      }
    } catch {
      // fall through to the default
    }
  }
  return [...DEFAULTS.businessHours.days];
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
      a.website           AS website,
      a.smart_lead_finder AS smart_lead_finder,
      a.icp_summary       AS icp_summary,
      a.job_roles         AS job_roles,
      a.industries        AS industries,
      a.locations         AS locations,
      a.company_info      AS company_info,
      a.timezone          AS timezone,
      a.workday_start     AS workday_start,
      a.workday_end       AS workday_end,
      a.workday_days      AS workday_days,
      a.warmup_start_per_day     AS warmup_start_per_day,
      a.warmup_increment_per_week AS warmup_increment_per_week,
      a.warmup_weeks      AS warmup_weeks,
      a.match_level       AS match_level,
      a.tone              AS tone,
      a.skip_connected    AS skip_connected,
      a.company_sizes     AS company_sizes,
      a.review_mode       AS review_mode,
      a.observe_only      AS observe_only,
      a.test_recipients   AS test_recipients,
      a.sequence          AS sequence_templates,
      a.status            AS status,
      a.last_run_at       AS last_run_at,
      l.full_name         AS account_full_name,
      l.profile_url       AS account_profile_url,
      l.country           AS country,
      l.tier              AS tier,
      l.maturity          AS maturity,
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
    JOIN users u ON u.id = a.workspace_id
    WHERE a.status IN ('active', 'warming')
      -- Demo rows exist for the dashboard preview and nothing else. Their
      -- account and proxy look provisioned but are fake, so demo-agent-1 ran
      -- for real, failed its address check every 5 minutes and emailed about
      -- an agent no customer ever started (2026-08-14).
      AND a.id NOT LIKE 'demo-%'
      -- Signed in, and nothing else. 'pending' used to be accepted here, which
      -- meant an agent could be handed an account that had never signed in and
      -- would open a browser onto a login page every five minutes.
      AND l.status = 'active'
      -- Somebody has to be paying for the agents specifically. The app pauses
      -- them when a subscription ends, but the app and this process are
      -- separate deploys and this query is re-read every pass, so it is the
      -- guarantee: a missed webhook cannot leave a cancelled customer's
      -- LinkedIn account being driven on our AI budget.
      --
      -- A lifetime holder is deliberately NOT in this list. What they bought
      -- outright in v1 is the content half, and it stays theirs for ever; the
      -- agents are the thing they have to subscribe for. Exempting them here
      -- would have run agents for free for anybody holding a v1 code.
      AND (u.plan IN ('pro', 'business') OR u.is_admin = 1)
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
      businessHours: { startHour, endHour, days: parseDays(r.workday_days) },
      // Null means the safe ramp. A customer who raised these was told plainly what they were
      // taking on, and the floor of 1 exists so a typo cannot stop the agent dead.
      warmup: {
        startPerDay: Math.max(1, Number(r.warmup_start_per_day ?? DEFAULTS.warmup.startPerDay)),
        incrementPerWeek: Math.max(0, Number(r.warmup_increment_per_week ?? DEFAULTS.warmup.incrementPerWeek)),
        weeks: Math.max(1, Number(r.warmup_weeks ?? DEFAULTS.warmup.weeks)),
      },
      // An agent restricted to a handful of named people is somebody trying the product out, not
      // running a campaign, so its ceilings come down to match. The allowlist is the guarantee and
      // this is the second one: if a write ever escaped the wrapper, it could escape three times
      // rather than twenty. Belt and braces, on somebody's real account.
      limits: Number(r.observe_only ?? 0) === 1 || parseList(r.test_recipients).length > 0
        ? { connectPerWeekMax: 3, dmPerDayMax: 3, dmPerWeekMax: 3 }
        : { ...DEFAULTS.limits },
      delaysMs: { ...DEFAULTS.delaysMs },
      sequence: { ...DEFAULTS.sequence },
      skipConnected: Number(r.skip_connected ?? 1) === 1,
      leads: {
        topics: [],
        competitors: splitLines(r.competitor_labels),
        hashtags: [],
        icp: String(r.icp_summary ?? ""),
        /**
         * Roles only. Industries qualified people, and they must not.
         *
         * The wizard collects the two separately and this concatenated them
         * into one list matched with `some`, so an industry could only ever
         * widen the net. On 2026-08-10 an enterprise sales rep was claimed as a
         * lead for a founder audience because her headline said "Scaling CDN,
         * Cloud, SaaS, GPU-aaS". SaaS is the market she sells into. It says
         * nothing whatever about her being a founder.
         *
         * A role is a property of a person. An industry is a property of a
         * company, and only the person is in front of us.
         */
        icpKeywords: parseList(r.job_roles),
        industries: parseList(r.industries),
        /**
         * Where the customer wants their buyers, which filtered nobody.
         *
         * `a.locations` was selected, and used in exactly one place: to write
         * "You are Maria, based in Montreux" into the message prompts. It is
         * the SENDER's location. No prospect was ever dropped for being on the
         * wrong continent, so an agent aimed at France was claiming people in
         * Bangalore and Sofia, and the customer read that as bad targeting
         * because it is.
         */
        locations: parseList(r.locations),
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
      ownProfileUrl: String(r.account_profile_url ?? ""),
      country: String(r.country ?? ""),
      tier: String(r.tier ?? "free"),
      maturity: String(r.maturity ?? "new"),
      /**
       * The timezone the customer chose, not the one their passport implies.
       *
       * This read timezoneForCountry(country), which maps a whole country to
       * one zone: every US account got America/New_York. An agent set up in Los
       * Angeles therefore woke, worked and closed three hours early, and its
       * daily reading budget reset in the middle of its own afternoon. The
       * browser fingerprint already used the agent's own setting, so the two
       * halves of the same account disagreed about what time it was.
       *
       * The country stays the fallback, for a row saved before the field
       * existed.
       */
      timezone: String(r.timezone ?? "").trim() || timezoneForCountry(String(r.country ?? "")),
      accountDailyInviteCap: Number(r.account_cap ?? 8),
      agentsOnAccount: Math.max(1, Number(r.agents_on_account ?? 1)),
      lastRunAt: r.last_run_at ? new Date(Number(r.last_run_at) * 1000) : null,
      warmupStartedAt: r.warmup_started_at ? new Date(Number(r.warmup_started_at) * 1000) : null,
      matchLevel:
        String(r.match_level ?? "balanced") === "precision"
          ? "precision"
          : String(r.match_level ?? "balanced") === "volume"
            ? "volume"
            : "balanced",
      tone:
        String(r.tone ?? "conversational") === "professional"
          ? "professional"
          : String(r.tone ?? "conversational") === "direct"
            ? "direct"
            : "conversational",
      skipConnected: Number(r.skip_connected ?? 1) === 1,
      companySizes: parseList(r.company_sizes),
      reviewMode: Number(r.review_mode ?? 0) === 1,
      observeOnly: Number(r.observe_only ?? 0) === 1,
      testRecipients: parseList(r.test_recipients),
      /**
       * Messages the customer wrote themselves, keyed by step.
       *
       * A step with one here is sent word for word with the placeholders
       * filled, and no model is called for it. A step without one is written
       * for each person as before. An unreadable column is no templates rather
       * than a broken agent.
       */
      templates: (() => {
        const raw = r.sequence_templates;
        if (typeof raw !== "string" || !raw.trim()) return {};
        try {
          const parsed: unknown = JSON.parse(raw);
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
          const out: Record<string, string> = {};
          for (const [step, body] of Object.entries(parsed as Record<string, unknown>)) {
            if (typeof body === "string" && body.trim()) out[step] = body.trim();
          }
          return out;
        } catch {
          return {};
        }
      })(),
      // The wizard offers two, and until now the worker read neither.
      goal: String(r.goal ?? "conversations") === "meetings" ? "meetings" : "conversations",
      website: String(r.website ?? ""),
      smartLeadFinder: Number(r.smart_lead_finder ?? 1) === 1,
      sender: {
        // The account's own first name. LinkedIn shows it beside every message,
        // so signing with anything else would read as a different person.
        firstName: String(r.account_full_name ?? "").trim().split(/\s+/)[0] ?? "",
        companyInfo: String(r.company_info ?? ""),
        // locations is a JSON array in the row, and reading it raw put the
        // literal string "[]" into the prompt as "based in []". First real
        // entry or nothing; the 2-letter account country is never prose.
        location: parseList(r.locations)[0] ?? "",
      },
      cfg,
    };
  });
}

/**
 * The enabled sources an agent should mine.
 *
 * Ordered oldest-first here and re-ordered by what each one has been worth in
 * sourcing.ts. This query stays dumb on purpose: the ranking needs the outcome
 * columns and a policy, and both belong in learn.ts where they can be read and
 * tested on their own.
 */
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
 * Text that will survive the trip to the database, with half-emoji removed.
 *
 * ## The 400 that killed 36 sourcing passes in five days
 *
 * A comment body is cut to 400 characters with `slice`, and `slice` counts
 * UTF-16 code units. An emoji is two of them, so a cut landing inside one
 * leaves a lone surrogate: a half-character that is not valid UTF-8. libsql
 * puts arguments into a JSON body and POSTs it, Turso refuses to parse it, and
 * the whole request comes back as `SERVER_ERROR: Server returned HTTP status
 * 400`, which names neither the column nor the statement.
 *
 * It was not intermittent, which is what made it look like a server having a
 * bad day. It was the SAME comment under the SAME Calendly post failing on
 * every pass that reached it: 17 times on 2026-08-06, 16 the next day, and
 * every one of them took the rest of the pass down with it. Nothing found in
 * those passes was ever scored, no source was ever ranked, and the memory was
 * never revised, because all three run after the claim.
 *
 * Applied at the boundary rather than at each call site, so a field added later
 * cannot reintroduce it.
 */
export function safeText<T extends string | null | undefined>(value: T): T {
  if (typeof value !== "string") return value;
  // Any surrogate not paired with its other half, at either end or in the
  // middle. Replaced rather than dropped so an index into the text still means
  // roughly the same thing.
  return value.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "") as T;
}

/**
 * The signal family a signal_type belongs to: "comment:lovable-dev" is a comment.
 *
 * Kept here rather than in the miner because both the claim and the repetition
 * count need the same answer, and two definitions of "the same kind of signal"
 * would drift apart within a week.
 */
export function signalKind(signalType: string | null | undefined): string {
  const raw = (signalType ?? "").trim();
  if (!raw) return "unknown";
  return (raw.split(":")[0] ?? raw).toLowerCase();
}

/**
 * Claims a lead for this workspace, or records that we have seen them again.
 *
 * Section 9c: the unique index on (workspace_id, profile_id) IS the claim. Two
 * agents mining overlapping markets will both find the same person, and the
 * winner is decided by the database rather than by a read-then-write that
 * races. A rejected insert means someone else already has them, which is the
 * correct outcome and not an error.
 *
 * ## The second sighting, which used to be thrown away
 *
 * `INSERT OR IGNORE` treated "we found this person again" as nothing at all,
 * and it is the opposite of nothing. Somebody who commented under two different
 * competitors and then came up in a search is not the same prospect as somebody
 * seen once: they are in the market, visibly, repeatedly, and every signal tool
 * worth the name ranks them higher for it. On the live account most passes
 * reported "0 new people" while quietly discarding exactly this evidence.
 *
 * So a failed insert is now followed by `recordRepeatSignal`, which bumps
 * `signal_hits` only when the KIND of signal is one this person has not
 * produced before: reading the same reactions list twice must not look like
 * growing interest. It is a separate statement rather than an upsert clause on
 * purpose, because an upsert reports the same rowsAffected either way and this
 * function's whole contract is telling a new lead apart from a repeat.
 *
 * Returns true when this call is the one that claimed them.
 */
export async function claimLead(ctx: AgentContext, lead: FoundLead): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const result = await db().execute({
    sql: `INSERT OR IGNORE INTO agent_leads
            (id, workspace_id, agent_id, source_id, profile_id, profile_url, full_name,
             first_name, headline, job_title, company, location, avatar_url, match_score,
             match_reason, signal_type, signal_text, signal_url, signal_author, step, step_at,
             found_at, created_at, updated_at, signal_hits, signal_kinds)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'found', ?, ?, ?, ?, 1, ?)`,
    args: [
      crypto.randomUUID(), ctx.workspaceId, ctx.agentId, lead.sourceId ?? null,
      lead.profileId, lead.profileUrl, safeText(lead.fullName),
      /**
       * The first name, which this insert never wrote.
       *
       * Every one of the 92 leads on the account had an empty first_name, so
       * every log line about a prospect read "hello to null was not sent",
       * "warmUp: null has no likeable recent post", "invite to null is already
       * pending". Three real failures were diagnosed through that fog on
       * 2026-08-08 and it cost hours.
       *
       * The messages themselves were never affected: the writer falls back to
       * firstNameOf(full_name) already. This is the same derivation, written
       * once at the source so the column and the logs stop lying.
       */
      safeText(firstNameOf(lead.fullName)),
      safeText(lead.headline ?? null), safeText(lead.jobTitle ?? null), safeText(lead.company ?? null),
      safeText(lead.location ?? null), lead.avatarUrl ?? null, lead.matchScore ?? null,
      safeText(lead.matchReason ?? null), lead.signalType ?? null, safeText(lead.signalText ?? null),
      lead.signalUrl ?? null, safeText(lead.signalAuthor ?? null),
      now, now, now, now, signalKind(lead.signalType),
    ],
  });
  if (result.rowsAffected > 0) return true;
  await recordRepeatSignal(ctx, lead);
  return false;
}

/**
 * A person we already had, showing up through a different door.
 *
 * The strongest cheap signal in the product and the one it was throwing on the
 * floor. Trigify sells "repeat interaction with competitor accounts" as its own
 * trigger, and it is right to: somebody who commented under Lovable, then came
 * up in a search for indie founders, then reacted to Cal.com is telling you
 * something a single sighting cannot.
 *
 * Only a NEW kind counts. The miner walks a competitor's feed and the same
 * person turns up under three of their posts in one pass, which is one interest,
 * not three, and counting it three times would put the loudest commenter on
 * LinkedIn at the top of every customer's queue.
 *
 * The score is cleared so the next scoring pass judges them again with the
 * repetition in front of it. Only while they are still at `found`: a lead
 * already in the sequence keeps the score the sequence let it in on, because
 * pulling it back below the floor mid-conversation would strand it.
 */
export async function recordRepeatSignal(ctx: AgentContext, lead: FoundLead): Promise<void> {
  const kind = signalKind(lead.signalType);
  await db().execute({
    sql: `UPDATE agent_leads
             SET signal_hits = signal_hits + 1,
                 signal_kinds = COALESCE(signal_kinds || ',', '') || ?,
                 match_score = CASE WHEN step = 'found' THEN NULL ELSE match_score END,
                 match_reason = CASE WHEN step = 'found' THEN NULL ELSE match_reason END,
                 updated_at = ?
           WHERE workspace_id = ? AND profile_id = ? AND agent_id = ?
             AND instr(',' || COALESCE(signal_kinds, '') || ',', ',' || ? || ',') = 0`,
    args: [
      kind, Math.floor(Date.now() / 1000),
      ctx.workspaceId, lead.profileId, ctx.agentId, kind,
    ],
  });
}

/**
 * Leads waiting to enter the sequence, highest score first and above the floor.
 *
 * The floor is the part that was missing. This ordered by score and filtered by
 * nothing, so a lead judged 0 sat at the bottom of the list and was written to
 * anyway the moment the queue above it ran out, which on a young agent is most
 * days. That is how a competitor scored 0 still received a message.
 *
 * An unscored lead is held back rather than contacted, because a score arriving
 * one pass later is a delay and a message going to the wrong person is not
 * recoverable. The exception is an agent with no ICP written down at all: it
 * never scores anybody, so waiting for a score would mean waiting for ever.
 */
export async function leadsAtStep(ctx: AgentContext, step: string, limit: number) {
  const floor = minimumScore(ctx.matchLevel);
  const scoring = Boolean(ctx.cfg.leads.icp);
  const { rows } = await db().execute({
    sql: `SELECT id, profile_id, profile_url, full_name, headline, job_title, company,
                 match_score, match_reason, signal_text, signal_url, step_at,
                 signal_hits, signal_kinds
          FROM agent_leads
          WHERE workspace_id = ? AND agent_id = ? AND step = ?
            AND ${scoring ? "match_score IS NOT NULL" : "1 = 1"}
            AND (match_score IS NULL OR match_score >= ?)
            /* Somebody the customer has thrown out is never handed back to the
               sequence, whatever their score says. */
            AND rejected_at IS NULL
          ORDER BY ${HOT_FIRST}, COALESCE(match_score, 0) DESC, found_at ASC
          LIMIT ?`,
    args: [ctx.workspaceId, ctx.agentId, step, floor, limit],
  });
  return rows;
}

/**
 * The order the warmest people come out in, shared by both queues.
 *
 * Three tiers, and they are tiers rather than a weighting because a score is an
 * opinion and these three are facts about what the person did.
 *
 * 0. They engaged with the CUSTOMER'S OWN post, or asked about the problem out
 *    loud. Nothing beats somebody who has already interacted with you.
 * 1. They turned up through more than one kind of signal. A person who
 *    commented under a rival and then came up in a search is in the market.
 * 2. Everybody else, best match first.
 */
export const HOT_FIRST = `CASE
  WHEN signal_type LIKE 'own:%' OR signal_type LIKE 'question:%' OR signal_type LIKE 'intent:%' THEN 0
  WHEN COALESCE(signal_hits, 1) > 1 THEN 1
  ELSE 2 END`;

/**
 * What the customer told us about a lead, once the conversation ended.
 *
 * Written from the dashboard, never by the agent, and read by the learning
 * pass above everything else it knows. Until this column is filled the agent
 * learns from proxies, and the proxies are what taught one live agent that a
 * competitor who answered politely was a good prospect.
 */
export type LeadOutcome = "meeting" | "customer" | "not_a_fit";

/**
 * What the last reply from this person actually meant.
 *
 * Separate from the hand-over decision, which answers a different question.
 * "Thanks for connecting" and "not interested" both end with the agent quiet,
 * and treating them as the same evidence is the root of the same bug.
 */
export type ReplyIntent = "interested" | "neutral" | "refused";

/**
 * Leads nobody has scored yet, oldest first.
 *
 * The score and its reason are what the leads table shows in its Match column
 * and what the sequence orders people by, and until now both columns were null
 * for every lead ever found: the scorer was written months ago and nothing
 * called it. Oldest first so a backlog drains in the order it arrived.
 */
export async function unscoredLeads(ctx: AgentContext, limit: number) {
  const { rows } = await db().execute({
    sql: `SELECT id, full_name, headline, company, signal_text, signal_hits, signal_kinds
          FROM agent_leads
          WHERE workspace_id = ? AND agent_id = ? AND match_score IS NULL
            /* Rejected by the customer, so there is nothing left to judge and
               spending a model call on it would be paying to be told twice. */
            AND rejected_at IS NULL
          ORDER BY COALESCE(signal_hits, 1) DESC, found_at ASC
          LIMIT ?`,
    args: [ctx.workspaceId, ctx.agentId, limit],
  });
  return rows;
}

export async function setLeadScore(
  ctx: AgentContext,
  leadId: string,
  score: number,
  reason: string
) {
  const now = Math.floor(Date.now() / 1000);
  await db().execute({
    sql: `UPDATE agent_leads SET match_score = ?, match_reason = ?, updated_at = ?
          WHERE id = ? AND workspace_id = ?`,
    args: [score, safeText(reason).slice(0, 300), now, leadId, ctx.workspaceId],
  });
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
/**
 * Ask for a fresh sign-in instead of giving up on the account.
 *
 * A session that is merely signed out is not a challenge. LinkedIn ends
 * sessions on its own and cookies expire, and the password is already stored:
 * nothing about that needs a human. But the only thing runAgent could do with
 * it was flagAccount("challenged"), and the sign-in pass only ever looks at
 * accounts whose status is 'pending', so a signed-out account fell into a state
 * nothing retried. On 2026-08-01 that cost this account two full days of
 * silence, and the only visible sign was a line in the event log.
 *
 * Back to 'pending' puts it in front of the sign-in pass, which counts its own
 * attempts and escalates to 'challenged' by itself after three, with the
 * message telling the customer to reconnect. So the give-up path still exists;
 * it is simply reached by trying first.
 *
 * The agents are deliberately not paused. They cost nothing while the account
 * is out, each pass ends immediately, and pausing them would mean somebody has
 * to notice and restart them by hand after a sign-out they never saw.
 */
export async function requestSignIn(ctx: AgentContext, reason: string) {
  const now = Math.floor(Date.now() / 1000);
  await db().execute({
    sql: `UPDATE linkedin_accounts
             SET status = 'pending', status_reason = ?, updated_at = ?
           WHERE id = ? AND workspace_id = ? AND challenge_state = 'none'`,
    args: [reason, now, ctx.linkedinAccountId, ctx.workspaceId],
  });
  await recordEvent(ctx, "signin", reason);
}

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
