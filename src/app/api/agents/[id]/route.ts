import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  agents,
  agentActions,
  agentLeads,
  agentMessages,
  agentSources,
  agentEvents,
  agentQueue,
  linkedinAccounts,
} from "@/lib/db/schema";
import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
} from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";

async function resolveWorkspaceId(userId: string) {
  const data = await loadSessionUser(userId);
  if (!data) return null;
  return data.teamOwnerId ?? data.user.id;
}

/**
 * The engine's own words for what it did.
 *
 * An invitation is recorded as "connect" and every message as "dm", in
 * agent_actions, which is the same table the daily caps are counted from. The
 * chart reads that rather than the queue, so a column can never show a number
 * the limiter did not also see.
 */
const INVITATION = "connect";
const MESSAGE = "dm";

type ChartDay = {
  day: string;
  leads: number;
  invitations: number;
  messages: number;
};

/**
 * The last seven days, one column per day, three series in each.
 *
 * Bucketed here rather than in SQL because SQLite has no timezone-aware date
 * grouping, and a week of one agent is a few hundred rows at most.
 */
function sevenDays(
  found: Date[],
  sent: Array<{ action: string; at: Date }>
): ChartDay[] {
  const days: ChartDay[] = [];
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);

  for (let back = 6; back >= 0; back--) {
    const from = new Date(midnight.getTime() - back * 86_400_000);
    const to = new Date(from.getTime() + 86_400_000);
    const within = (d: Date) => d >= from && d < to;
    days.push({
      day: from.toLocaleDateString("en-US", { weekday: "short" }),
      leads: found.filter(within).length,
      invitations: sent.filter((s) => s.action === INVITATION && within(s.at)).length,
      messages: sent.filter((s) => s.action === MESSAGE && within(s.at)).length,
    });
  }
  return days;
}

// GET /api/agents/[id] - the agent, its sources, its queue and its recent events
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(session.user.id);
    if (!workspaceId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ownership lives in the WHERE clause, so a wrong id is a 404 rather than
    // someone else's agent.
    const [agent] = await db
      .select({
        id: agents.id,
        name: agents.name,
        status: agents.status,
        pausedReason: agents.pausedReason,
        icpSummary: agents.icpSummary,
        goal: agents.goal,
        tone: agents.tone,
        matchLevel: agents.matchLevel,
        skipConnected: agents.skipConnected,
        reviewMode: agents.reviewMode,
        smartLeadFinder: agents.smartLeadFinder,
        observeOnly: agents.observeOnly,
        // The messages the customer wrote by hand, as JSON keyed by step. Empty
        // means the agent writes that step itself, for each person.
        sequence: agents.sequence,
        testRecipients: agents.testRecipients,
        dailyInviteCap: linkedinAccounts.dailyInviteCap,
        timezone: agents.timezone,
        workdayStart: agents.workdayStart,
        workdayEnd: agents.workdayEnd,
        workdayDays: agents.workdayDays,
        jobRoles: agents.jobRoles,
        industries: agents.industries,
        locations: agents.locations,
        companySizes: agents.companySizes,
        warmupStartPerDay: agents.warmupStartPerDay,
        warmupIncrementPerWeek: agents.warmupIncrementPerWeek,
        warmupWeeks: agents.warmupWeeks,
        warmupStartedAt: linkedinAccounts.warmupStartedAt,
        lastRunAt: agents.lastRunAt,
        createdAt: agents.createdAt,
        accountName: linkedinAccounts.fullName,
        accountAvatar: linkedinAccounts.avatarUrl,
        accountHeadline: linkedinAccounts.headline,
        accountStatus: linkedinAccounts.status,
        accountCountry: linkedinAccounts.country,
        accountId: linkedinAccounts.id,
      })
      .from(agents)
      .innerJoin(
        linkedinAccounts,
        eq(linkedinAccounts.id, agents.linkedinAccountId)
      )
      .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
      .limit(1);

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const weekAgo = new Date(Date.now() - 7 * 86_400_000);

    // Independent reads, so they go together rather than in sequence.
    const [
      sources,
      funnel,
      events,
      drafted,
      nextUp,
      siblings,
      found,
      sent,
      replies,
    ] = await Promise.all([
      db
        .select()
        .from(agentSources)
        .where(eq(agentSources.agentId, id)),
      db
        .select({ step: agentLeads.step, total: count() })
        .from(agentLeads)
        .where(eq(agentLeads.agentId, id))
        .groupBy(agentLeads.step),
      db
        .select()
        .from(agentEvents)
        .where(eq(agentEvents.agentId, id))
        .orderBy(desc(agentEvents.createdAt))
        .limit(20),
      // Everything still waiting to go out: the drafted messages held in the
      // queue, plus the people next in line for an invitation, which is the
      // other half of what the Today's queue tab shows. An approved row is
      // still waiting, so both states count.
      db
        .select({ total: count() })
        .from(agentQueue)
        .where(
          and(
            eq(agentQueue.agentId, id),
            inArray(agentQueue.state, ["pending", "approved"])
          )
        ),
      db
        .select({ total: count() })
        .from(agentLeads)
        .where(
          and(
            eq(agentLeads.agentId, id),
            eq(agentLeads.sequenceStatus, "queued")
          )
        ),
      // How many agents send from the same LinkedIn account. They divide its
      // daily budget, so the screen cannot present the cap as this agent's own.
      db
        .select({ total: count() })
        .from(agents)
        .where(
          and(
            eq(agents.linkedinAccountId, agent.accountId),
            eq(agents.workspaceId, workspaceId)
          )
        ),
      // The two series behind the Activity chart.
      db
        .select({ at: agentLeads.foundAt })
        .from(agentLeads)
        .where(and(eq(agentLeads.agentId, id), gte(agentLeads.foundAt, weekAgo))),
      db
        .select({ action: agentActions.type, at: agentActions.createdAt })
        .from(agentActions)
        .where(
          and(
            eq(agentActions.agentId, id),
            gte(agentActions.createdAt, weekAgo)
          )
        ),
      // Replies nobody has read yet. The overview mentions them only when there
      // are any, rather than printing a zero somebody has to interpret.
      db
        .select({
          id: agentMessages.id,
          body: agentMessages.body,
          sentAt: agentMessages.sentAt,
          leadId: agentMessages.leadId,
          leadName: agentLeads.fullName,
          leadAvatar: agentLeads.avatarUrl,
        })
        .from(agentMessages)
        .innerJoin(agentLeads, eq(agentLeads.id, agentMessages.leadId))
        .where(
          and(
            eq(agentMessages.agentId, id),
            eq(agentMessages.direction, "in"),
            isNull(agentMessages.readAt)
          )
        )
        .orderBy(desc(agentMessages.sentAt))
        .limit(5),
    ]);

    const steps: Record<string, number> = {};
    for (const row of funnel) steps[row.step] = row.total;

    return NextResponse.json({
      agent: { ...agent, accountAgentCount: siblings[0]?.total ?? 1 },
      sources,
      steps,
      events,
      queuedToday:
        (drafted[0]?.total ?? 0) +
        Math.min(nextUp[0]?.total ?? 0, agent.dailyInviteCap),
      chart: sevenDays(
        found.map((row) => row.at),
        sent
      ),
      replies,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load agent" },
      { status: 500 }
    );
  }
}

/** Text columns holding JSON, so an array in the body becomes a string in the row. */
const LIST_FIELDS: readonly string[] = [
  "jobRoles", "industries", "locations", "companySizes", "workdayDays", "testRecipients",
];
/** Minutes from midnight. */
const MINUTE_FIELDS: readonly string[] = ["workdayStart", "workdayEnd"];
/** Optional overrides, where null means go back to the safe ramp. */
const WARMUP_FIELDS: readonly string[] = [
  "warmupStartPerDay", "warmupIncrementPerWeek", "warmupWeeks",
];

/**
 * The columns that only accept certain words, checked here rather than trusted.
 *
 * SQLite does not enforce a Drizzle enum, so a screen offering the wrong values
 * writes them straight into the column and the worker then reads a setting it
 * has no branch for. That is exactly what happened: the settings screen offered
 * "relationship" and "meeting" for a column holding "conversations" and
 * "meetings", so the goal was both unselectable and unsaveable.
 */
const CHOICES: Record<string, readonly string[]> = {
  goal: ["conversations", "meetings"],
  tone: ["professional", "conversational", "direct"],
  matchLevel: ["precision", "balanced", "volume"],
};

/** A zone the runtime can actually resolve. A typo here breaks the workday. */
function isRealTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const EDITABLE = [
  "name",
  "icpSummary",
  "goal",
  "tone",
  "matchLevel",
  "skipConnected",
  "reviewMode",
  "smartLeadFinder",
  "observeOnly",
  "timezone",
  // Set once in the wizard and then frozen, which meant rebuilding an agent and losing every lead
  // it had found in order to move its working hours by an hour.
  "jobRoles",
  "industries",
  "locations",
  "companySizes",
  "workdayDays",
  "workdayStart",
  "workdayEnd",
  "warmupStartPerDay",
  "warmupIncrementPerWeek",
  "warmupWeeks",
  "testRecipients",
  // The messages written by hand, as JSON keyed by step.
  "sequence",
] as const;

/** Steps a customer may write themselves. The invitation carries no text. */
const WRITABLE_STEPS: readonly string[] = ["hello", "intro", "converse", "ask"];
const MAX_TEMPLATE = 1200;

/**
 * A hand-written message per step, or nothing.
 *
 * Stored as JSON in one column, validated here rather than trusted, because the
 * worker sends whatever is in it word for word. An unknown step is dropped
 * instead of rejected: it costs the customer nothing and it cannot reach
 * anybody, since the engine only ever asks for the four steps it has.
 */
function cleanSequence(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const kept: Record<string, string> = {};
  for (const [step, body] of Object.entries(parsed as Record<string, unknown>)) {
    if (!WRITABLE_STEPS.includes(step)) continue;
    if (typeof body !== "string") continue;
    const text = body.trim();
    if (!text) continue;
    if (text.length > MAX_TEMPLATE) return null;
    kept[step] = text;
  }
  return JSON.stringify(kept);
}

// PATCH /api/agents/[id] - settings, and start or pause
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(session.user.id);
    if (!workspaceId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const patch: Record<string, unknown> = { updatedAt: new Date() };

    for (const field of EDITABLE) {
      if (!(field in body)) continue;
      const value = body[field];
      if (field === "name") {
        if (typeof value !== "string" || !value.trim() || value.length > 80) {
          return NextResponse.json(
            { error: "Name must be between 1 and 80 characters" },
            { status: 400 }
          );
        }
        patch.name = value.trim();
      } else if (LIST_FIELDS.includes(field)) {
        // Stored as JSON in a text column, so an array arrives as one and is written as one.
        if (!Array.isArray(value)) continue;
        patch[field] = JSON.stringify(
          value.filter((v) => typeof v === "string" || typeof v === "number").slice(0, 25)
        );
      } else if (MINUTE_FIELDS.includes(field)) {
        const n = Number(value);
        if (Number.isInteger(n) && n >= 0 && n <= 1440) patch[field] = n;
      } else if (WARMUP_FIELDS.includes(field)) {
        // Null clears an override and restores the safe ramp, which has to stay possible.
        if (value === null) patch[field] = null;
        else {
          const n = Number(value);
          if (Number.isInteger(n) && n >= 0 && n <= 50) patch[field] = n;
        }
      } else if (field === "sequence") {
        const cleaned = cleanSequence(value);
        if (cleaned === null) {
          return NextResponse.json(
            { error: `Each message has to be under ${MAX_TEMPLATE} characters.` },
            { status: 400 }
          );
        }
        patch.sequence = cleaned;
      } else if (CHOICES[field]) {
        if (typeof value !== "string" || !CHOICES[field].includes(value)) {
          return NextResponse.json(
            { error: `${field} must be one of ${CHOICES[field].join(", ")}` },
            { status: 400 }
          );
        }
        patch[field] = value;
      } else if (field === "timezone") {
        if (typeof value !== "string" || !isRealTimezone(value)) {
          return NextResponse.json(
            { error: "That is not a timezone the agent can read" },
            { status: 400 }
          );
        }
        patch.timezone = value;
      } else if (typeof value === "boolean" || typeof value === "string") {
        patch[field] = value;
      }
    }

    // Status is separate: it is an action, not a field, and it is the one
    // change that has real-world consequences.
    if (typeof body.status === "string") {
      if (!["active", "paused"].includes(body.status)) {
        return NextResponse.json(
          { error: "Status must be active or paused" },
          { status: 400 }
        );
      }
      patch.status = body.status;
      patch.pausedReason = body.status === "paused" ? "Paused by you" : null;
      // Warm-up is a property of the LinkedIn ACCOUNT, not of the agent.
      // LinkedIn watches the account, so an account that already served its
      // month keeps the pace it earned even if you delete the agent and make
      // a new one. Only a freshly connected account starts the ramp.
      if (body.status === "active") {
        const [current] = await db
          .select({
            accountId: agents.linkedinAccountId,
            warmupStartedAt: linkedinAccounts.warmupStartedAt,
          })
          .from(agents)
          .innerJoin(
            linkedinAccounts,
            eq(linkedinAccounts.id, agents.linkedinAccountId)
          )
          .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
          .limit(1);

        /**
         * Starting an agent re-checks its account instead of leaving it red.
         *
         * A signed-out or challenged account never runs again on its own:
         * loadRunnableAgents wants the account active, and only a successful
         * sign-in sets that, and the sign-in pass only looks at accounts that
         * are pending. So once it went red it stayed red, and the customer who
         * had just passed LinkedIn's verification saw "LinkedIn wants a
         * verification" for ever and had nothing to press.
         *
         * Pressing Start now puts the account back in front of the sign-in
         * pass, which runs every 8 seconds and, on success, sets it active and
         * clears the message by itself. Attempts reset so a fresh press gets a
         * fresh three tries, and it is skipped while LinkedIn is actually
         * holding a checkpoint, because retrying into one helps nobody.
         */
        await db
          .update(linkedinAccounts)
          .set({
            status: "pending",
            statusReason: "Checking this account can still sign in.",
            signInAttempts: 0,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(linkedinAccounts.id, current.accountId),
              eq(linkedinAccounts.workspaceId, workspaceId),
              eq(linkedinAccounts.status, "challenged"),
              eq(linkedinAccounts.challengeState, "none")
            )
          );

        if (current && !current.warmupStartedAt) {
          await db
            .update(linkedinAccounts)
            .set({ warmupStartedAt: new Date(), updatedAt: new Date() })
            .where(eq(linkedinAccounts.id, current.accountId));
          patch.status = "warming";
        }
      }
    }

    // The sending account can be swapped after creation. Freezing it only
    // pushed people to delete the agent and build a new one, which threw away
    // its leads and its earned pace to change one field.
    if (typeof body.linkedinAccountId === "string" && body.linkedinAccountId) {
      if (body.linkedinAccountId.length > 64) {
        return NextResponse.json({ error: "Invalid account" }, { status: 400 });
      }
      const [account] = await db
        .select({
          id: linkedinAccounts.id,
          warmupStartedAt: linkedinAccounts.warmupStartedAt,
        })
        .from(linkedinAccounts)
        .where(
          and(
            eq(linkedinAccounts.id, body.linkedinAccountId),
            // Ownership sits in the WHERE: an id posted by a client must never
            // reach another workspace's account.
            eq(linkedinAccounts.workspaceId, workspaceId)
          )
        )
        .limit(1);
      if (!account) {
        return NextResponse.json(
          { error: "That account is not one of yours" },
          { status: 404 }
        );
      }
      patch.linkedinAccountId = account.id;

      // Warm-up belongs to the account, so an agent moved onto an account that
      // has never run starts that account's ramp now instead of inheriting the
      // pace the previous one had earned.
      const [existing] = await db
        .select({ status: agents.status })
        .from(agents)
        .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
        .limit(1);
      if (!existing) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }
      const nextStatus = (patch.status as string | undefined) ?? existing.status;
      if (
        (nextStatus === "active" || nextStatus === "warming") &&
        !account.warmupStartedAt
      ) {
        await db
          .update(linkedinAccounts)
          .set({ warmupStartedAt: new Date(), updatedAt: new Date() })
          .where(eq(linkedinAccounts.id, account.id));
        patch.status = "warming";
      }
    }

    const result = await db
      .update(agents)
      .set(patch)
      .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
      .returning({ id: agents.id, status: agents.status });

    if (result.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({ id: result[0].id, status: result[0].status });
  } catch {
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(session.user.id);
    if (!workspaceId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = await db
      .delete(agents)
      .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
      .returning({ id: agents.id });

    if (result.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Leads survive on purpose: they are workspace-scoped and carry the
    // contact history that section 9c's dedup depends on. Deleting an agent
    // must not make its prospects contactable again by another one.
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete agent" },
      { status: 500 }
    );
  }
}
