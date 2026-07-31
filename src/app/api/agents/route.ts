import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  agents,
  agentSources,
  agentLeads,
  agentMessages,
  linkedinAccounts,
} from "@/lib/db/schema";
import { and, count, eq, inArray, isNull } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";
import { agentQuotaFor, effectivePlan, type PlanId } from "@/lib/plans";

/**
 * The workspace owns agents, not the individual user, so a team member sees
 * the same agents as the owner. loadSessionUser is the cached read auth()
 * already performed for this request, so this costs no extra round trip.
 */
async function resolveWorkspace(userId: string) {
  const data = await loadSessionUser(userId);
  if (!data) return null;
  return {
    workspaceId: data.teamOwnerId ?? data.user.id,
    // effectivePlan, not the raw column: an admin runs on the top plan and a
    // local copy of that rule is how the session and an API route end up
    // disagreeing about what someone is allowed to do.
    plan: effectivePlan({
      plan: data.owner?.plan ?? data.user.plan,
      isAdmin: data.user.isAdmin,
    }) as PlanId,
  };
}

// GET /api/agents - every agent in the workspace, with its funnel counts
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await resolveWorkspace(session.user.id);
    if (!workspace) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rows = await db
      .select({
        id: agents.id,
        name: agents.name,
        status: agents.status,
        pausedReason: agents.pausedReason,
        icpSummary: agents.icpSummary,
        dailyInviteCap: linkedinAccounts.dailyInviteCap,
        warmupStartedAt: linkedinAccounts.warmupStartedAt,
        warmupStartPerDay: agents.warmupStartPerDay,
        warmupIncrementPerWeek: agents.warmupIncrementPerWeek,
        warmupWeeks: agents.warmupWeeks,
        lastRunAt: agents.lastRunAt,
        createdAt: agents.createdAt,
        // The card says when the agent next wakes up, which needs its own
        // working window rather than the reader's clock.
        timezone: agents.timezone,
        workdayStart: agents.workdayStart,
        workdayEnd: agents.workdayEnd,
        workdayDays: agents.workdayDays,
        accountId: linkedinAccounts.id,
        accountName: linkedinAccounts.fullName,
        accountAvatar: linkedinAccounts.avatarUrl,
        accountStatus: linkedinAccounts.status,
        accountCountry: linkedinAccounts.country,
      })
      .from(agents)
      .innerJoin(
        linkedinAccounts,
        eq(linkedinAccounts.id, agents.linkedinAccountId)
      )
      .where(eq(agents.workspaceId, workspace.workspaceId));

    if (rows.length === 0) {
      return NextResponse.json({
        agents: [],
        quota: { used: 0, limit: agentQuotaFor(workspace.plan) },
      });
    }

    // One grouped query for the funnel rather than four per agent. The list
    // page shows found / contacted / accepted / replied for every row, and
    // doing that per agent would be a round trip each.
    const ids = rows.map((r) => r.id);
    const [funnel, unread] = await Promise.all([
      db
        .select({
          agentId: agentLeads.agentId,
          step: agentLeads.step,
          total: count(),
        })
        .from(agentLeads)
        .where(inArray(agentLeads.agentId, ids))
        .groupBy(agentLeads.agentId, agentLeads.step),
      db
        .select({ agentId: agentMessages.agentId, total: count() })
        .from(agentMessages)
        .where(
          and(
            inArray(agentMessages.agentId, ids),
            eq(agentMessages.direction, "in"),
            isNull(agentMessages.readAt)
          )
        )
        .groupBy(agentMessages.agentId),
    ]);

    const CONTACTED = ["invited", "accepted", "messaged", "replied", "finished"];
    const ACCEPTED = ["accepted", "messaged", "replied", "finished"];

    const byAgent = new Map(
      ids.map((id) => [
        id,
        { found: 0, contacted: 0, accepted: 0, replied: 0, unread: 0 },
      ])
    );
    for (const row of funnel) {
      if (!row.agentId) continue;
      const bucket = byAgent.get(row.agentId);
      if (!bucket) continue;
      bucket.found += row.total;
      if (CONTACTED.includes(row.step)) bucket.contacted += row.total;
      if (ACCEPTED.includes(row.step)) bucket.accepted += row.total;
      if (row.step === "replied") bucket.replied += row.total;
    }
    for (const row of unread) {
      const bucket = byAgent.get(row.agentId);
      if (bucket) bucket.unread = row.total;
    }

    return NextResponse.json({
      agents: rows.map((row) => ({
        ...row,
        // The IP itself is never exposed, only the country it sits in.
        funnel: byAgent.get(row.id),
      })),
      quota: { used: rows.length, limit: agentQuotaFor(workspace.plan) },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load agents" },
      { status: 500 }
    );
  }
}

// POST /api/agents - create an agent against an already connected account
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await resolveWorkspace(session.user.id);
    if (!workspace) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const linkedinAccountId =
      typeof body?.linkedinAccountId === "string" ? body.linkedinAccountId : "";

    if (!name || name.length > 80) {
      return NextResponse.json(
        { error: "Name is required and must be 80 characters or fewer" },
        { status: 400 }
      );
    }
    if (!linkedinAccountId) {
      return NextResponse.json(
        { error: "A connected LinkedIn account is required" },
        { status: 400 }
      );
    }

    const limit = agentQuotaFor(workspace.plan);
    if (limit === 0) {
      return NextResponse.json(
        { error: "Agents require the Pro plan", feature: "agents" },
        { status: 403 }
      );
    }

    // Ownership is in the WHERE clause, never a check after the fetch.
    const [[existing], [account]] = await Promise.all([
      db
        .select({ total: count() })
        .from(agents)
        .where(eq(agents.workspaceId, workspace.workspaceId)),
      db
        .select({ id: linkedinAccounts.id })
        .from(linkedinAccounts)
        .where(
          and(
            eq(linkedinAccounts.id, linkedinAccountId),
            eq(linkedinAccounts.workspaceId, workspace.workspaceId)
          )
        )
        .limit(1),
    ]);

    if (!account) {
      return NextResponse.json(
        { error: "LinkedIn account not found" },
        { status: 404 }
      );
    }
    if ((existing?.total ?? 0) >= limit) {
      return NextResponse.json(
        {
          error: `Your plan includes ${limit} agent${limit === 1 ? "" : "s"}`,
          quota: { used: existing?.total ?? 0, limit },
        },
        { status: 403 }
      );
    }

    const now = new Date();
    const id = crypto.randomUUID();

    // Everything below comes off the five-step wizard. Each value is checked
    // against the column's own enum rather than trusted, because the client
    // can send anything and a bad enum would be written straight through.
    const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
      typeof value === "string" && (allowed as readonly string[]).includes(value)
        ? (value as T)
        : fallback;

    const text = (value: unknown, max: number): string | null => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      return trimmed ? trimmed.slice(0, max) : null;
    };

    // Stored as JSON in a text column, so cap the count as well as the length.
    const list = (value: unknown, max: number): string | null => {
      if (!Array.isArray(value)) return null;
      const items = value
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter(Boolean)
        .slice(0, max)
        .map((v) => v.slice(0, 80));
      return items.length ? JSON.stringify(items) : null;
    };

    const bool = (value: unknown, fallback: boolean) =>
      typeof value === "boolean" ? value : fallback;

    /** Minutes from midnight, clamped to a real day. */
    const minutes = (value: unknown, fallback: number): number => {
      const n = Number(value);
      return Number.isInteger(n) && n >= 0 && n <= 1440 ? n : fallback;
    };

    /** An optional override: a number inside the range, or null to keep the safe default. */
    const bounded = (value: unknown, min: number, max: number): number | null => {
      const n = Number(value);
      return Number.isInteger(n) && n >= min && n <= max ? n : null;
    };

    await db.insert(agents).values({
      id,
      workspaceId: workspace.workspaceId,
      createdBy: session.user.id,
      linkedinAccountId,
      name,
      website: text(body?.website, 300),
      icpSummary: text(body?.icpSummary, 2000),
      jobRoles: list(body?.jobRoles, 20),
      industries: list(body?.industries, 20),
      locations: list(body?.locations, 20),
      companySizes: list(body?.companySizes, 10),
      matchLevel: pick(body?.matchLevel, ["precision", "balanced", "volume"] as const, "balanced"),
      goal: pick(body?.goal, ["conversations", "meetings"] as const, "conversations"),
      tone: pick(body?.tone, ["professional", "conversational", "direct"] as const, "conversational"),
      companyInfo: text(body?.companyInfo, 4000),
      skipConnected: bool(body?.skipConnected, true),
      reviewMode: bool(body?.reviewMode, false),
      smartLeadFinder: bool(body?.smartLeadFinder, true),
      observeOnly: bool(body?.observeOnly, false),
      timezone: text(body?.timezone, 64) ?? "Europe/Zurich",
      workdayStart: minutes(body?.workdayStart, 540),
      workdayEnd: minutes(body?.workdayEnd, 1080),
      workdayDays: JSON.stringify(
        Array.isArray(body?.workdayDays)
          ? [
              ...new Set(
                (body.workdayDays as unknown[])
                  .map(Number)
                  .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
              ),
            ].sort()
          : [1, 2, 3, 4, 5, 6]
      ),
      // Null keeps the safe ramp. A number here is somebody who read the warning and chose.
      warmupStartPerDay: bounded(body?.warmupStartPerDay, 1, 50),
      warmupIncrementPerWeek: bounded(body?.warmupIncrementPerWeek, 0, 50),
      warmupWeeks: bounded(body?.warmupWeeks, 1, 12),
      testRecipients: Array.isArray(body?.testRecipients)
        ? JSON.stringify(
            (body.testRecipients as unknown[])
              .filter((v): v is string => typeof v === "string")
              .map((v) => v.trim())
              .filter(Boolean)
              .slice(0, 10)
          )
        : null,
      // Agents are always created paused. Activating is a separate,
      // deliberate action, per section 7b.
      status: "paused",
      createdAt: now,
      updatedAt: now,
    });

    const SOURCE_TYPES = [
      "keyword", "market", "competitor", "brand",
      "buying_event", "linkedin_search", "csv",
    ] as const;
    const sources = Array.isArray(body?.sources) ? body.sources.slice(0, 15) : [];
    const rows = sources
      .filter((r: unknown): r is { type: string; label: string; config?: unknown } =>
        !!r && typeof r === "object" &&
        SOURCE_TYPES.includes((r as { type?: string }).type as (typeof SOURCE_TYPES)[number]) &&
        typeof (r as { label?: unknown }).label === "string")
      .map((r: { type: string; label: string; config?: unknown }) => ({
        id: crypto.randomUUID(),
        workspaceId: workspace.workspaceId,
        agentId: id,
        type: r.type as (typeof SOURCE_TYPES)[number],
        label: r.label.trim().slice(0, 120),
        config: r.config ? JSON.stringify(r.config).slice(0, 4000) : null,
        createdAt: now,
        updatedAt: now,
      }))
      .filter((r: { label: string }) => r.label);

    if (rows.length) await db.insert(agentSources).values(rows);

    return NextResponse.json({ id, status: "paused" }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}
