import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  agents,
  agentLeads,
  agentMessages,
  agentEvents,
  agentSources,
  linkedinAccounts,
  users,
} from "@/lib/db/schema";
import { and, count, desc, eq, gte, isNull, inArray, sql } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";

/**
 * Everything the dashboard home shows, in one round trip.
 *
 * The home used to be about posts. It is about leads now, so the numbers it
 * opens with are the ones a customer checks in the morning: who was found, who
 * was contacted, and who wrote back. Posting is still there, at the bottom,
 * because it is no longer the reason anyone opens the page.
 */

const WEEK = 7 * 86400000;

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await loadSessionUser(session.user.id);
    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const workspaceId = data.teamOwnerId ?? data.user.id;
    const since = new Date(Date.now() - WEEK);
    const mine = eq(agentLeads.workspaceId, workspaceId);

    const [
      agentRows,
      accountRows,
      sourceCount,
      funnel,
      foundThisWeek,
      interested,
      unread,
      best,
      events,
      keys,
      series,
    ] = await Promise.all([
      db
        .select({ id: agents.id, name: agents.name, status: agents.status })
        .from(agents)
        .where(eq(agents.workspaceId, workspaceId)),
      db
        .select({
          id: linkedinAccounts.id,
          fullName: linkedinAccounts.fullName,
          status: linkedinAccounts.status,
          statusReason: linkedinAccounts.statusReason,
        })
        .from(linkedinAccounts)
        .where(eq(linkedinAccounts.workspaceId, workspaceId)),
      db
        .select({ total: count() })
        .from(agentSources)
        .where(
          and(
            eq(agentSources.workspaceId, workspaceId),
            eq(agentSources.enabled, true)
          )
        ),
      db
        .select({ step: agentLeads.step, total: count() })
        .from(agentLeads)
        .where(mine)
        .groupBy(agentLeads.step),
      db
        .select({ total: count() })
        .from(agentLeads)
        .where(and(mine, gte(agentLeads.foundAt, since))),
      db
        .select({ total: count() })
        .from(agentLeads)
        .where(and(mine, eq(agentLeads.step, "replied"))),
      // A reply nobody has opened is the one thing on this page that is a task.
      db
        .select({
          id: agentMessages.id,
          body: agentMessages.body,
          sentAt: agentMessages.sentAt,
          agentId: agentMessages.agentId,
          leadId: agentMessages.leadId,
          fullName: agentLeads.fullName,
          avatarUrl: agentLeads.avatarUrl,
          profileUrl: agentLeads.profileUrl,
        })
        .from(agentMessages)
        .innerJoin(agentLeads, eq(agentMessages.leadId, agentLeads.id))
        .where(
          and(
            eq(agentMessages.workspaceId, workspaceId),
            eq(agentMessages.direction, "in"),
            isNull(agentMessages.readAt)
          )
        )
        .orderBy(desc(agentMessages.sentAt))
        .limit(5),
      db
        .select({
          id: agentLeads.id,
          fullName: agentLeads.fullName,
          jobTitle: agentLeads.jobTitle,
          company: agentLeads.company,
          avatarUrl: agentLeads.avatarUrl,
          profileUrl: agentLeads.profileUrl,
          matchScore: agentLeads.matchScore,
          signalText: agentLeads.signalText,
          agentId: agentLeads.agentId,
        })
        .from(agentLeads)
        .where(and(mine, inArray(agentLeads.step, ["found", "queued"])))
        .orderBy(desc(agentLeads.matchScore), desc(agentLeads.foundAt))
        .limit(4),
      db
        .select({
          id: agentEvents.id,
          type: agentEvents.type,
          message: agentEvents.message,
          createdAt: agentEvents.createdAt,
          leadName: agentLeads.fullName,
          leadAvatar: agentLeads.avatarUrl,
        })
        .from(agentEvents)
        .leftJoin(agentLeads, eq(agentEvents.leadId, agentLeads.id))
        .where(eq(agentEvents.workspaceId, workspaceId))
        .orderBy(desc(agentEvents.createdAt))
        .limit(6),
      db
        .select({
          openai: users.openaiApiKey,
          anthropic: users.anthropicApiKey,
          google: users.googleApiKey,
          grok: users.grokApiKey,
          perplexity: users.perplexityApiKey,
          kimi: users.kimiApiKey,
        })
        .from(users)
        .where(eq(users.id, workspaceId))
        .limit(1),
      // Leads found per day for the last week, grouped in SQL rather than by
      // pulling every row back and counting them here.
      db
        .select({
          day: sql<string>`strftime('%Y-%m-%d', ${agentLeads.foundAt}, 'unixepoch')`,
          total: count(),
        })
        .from(agentLeads)
        .where(and(mine, gte(agentLeads.foundAt, since)))
        .groupBy(sql`1`),
    ]);

    const steps: Record<string, number> = {};
    for (const row of funnel) steps[row.step] = row.total;
    const sum = (...names: string[]) =>
      names.reduce((n, key) => n + (steps[key] ?? 0), 0);

    const key = keys[0];
    // Presence only. A key never leaves the server, not even as a length.
    const hasAiKey = Boolean(
      key &&
        (key.openai ||
          key.anthropic ||
          key.google ||
          key.grok ||
          key.perplexity ||
          key.kimi)
    );

    const needsAttention = accountRows.filter(
      (a) => a.status === "checkpoint" || a.status === "restricted" || a.status === "disconnected"
    );

    return NextResponse.json({
      agents: agentRows,
      accounts: accountRows.map((a) => ({
        id: a.id,
        fullName: a.fullName,
        status: a.status,
        statusReason: a.statusReason,
      })),
      sourcesWatched: sourceCount[0]?.total ?? 0,
      stats: {
        found: sum(
          "found",
          "queued",
          "invited",
          "accepted",
          "messaged",
          "replied",
          "finished"
        ),
        foundThisWeek: foundThisWeek[0]?.total ?? 0,
        contacted: sum("invited", "accepted", "messaged", "replied", "finished"),
        accepted: sum("accepted", "messaged", "replied", "finished"),
        replied: sum("replied"),
        interested: interested[0]?.total ?? 0,
      },
      waiting: {
        replies: unread.length,
        accounts: needsAttention.length,
      },
      unread,
      bestLeads: best,
      events,
      series,
      hasAiKey,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load the dashboard" },
      { status: 500 }
    );
  }
}
