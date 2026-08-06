import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentLeads, agentMessages, agents } from "@/lib/db/schema";
import { loadSessionUser } from "@/lib/auth-user";

/**
 * Everyone who answered, and the thread that led there.
 *
 * A reply ends the sequence for that person permanently, so this is the one
 * screen where the product hands the conversation back. It reads the whole
 * thread rather than the last line: answering somebody without seeing what
 * was already said in your name is how you contradict your own agent.
 *
 * Scoped to the workspace, which is what a team member shares with the owner.
 */

const MAX_THREADS = 60;

export async function GET() {
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

    // Every inbound message in the workspace, newest first. The people are
    // derived from these rather than queried separately, because somebody who
    // never answered has nothing to show on this page.
    const inbound = await db
      .select({
        id: agentMessages.id,
        leadId: agentMessages.leadId,
        agentId: agentMessages.agentId,
        body: agentMessages.body,
        sentAt: agentMessages.sentAt,
        readAt: agentMessages.readAt,
      })
      .from(agentMessages)
      .where(
        and(
          eq(agentMessages.workspaceId, workspaceId),
          eq(agentMessages.direction, "in")
        )
      )
      .orderBy(desc(agentMessages.sentAt))
      .limit(MAX_THREADS * 4);

    if (inbound.length === 0) {
      return NextResponse.json({ threads: [], unread: 0 });
    }

    // One entry per person, keeping their most recent answer.
    const newestByLead = new Map<string, (typeof inbound)[number]>();
    for (const row of inbound) {
      if (!newestByLead.has(row.leadId)) newestByLead.set(row.leadId, row);
    }
    const leadIds = [...newestByLead.keys()].slice(0, MAX_THREADS);

    const [people, everyMessage, mine] = await Promise.all([
      db
        .select({
          id: agentLeads.id,
          fullName: agentLeads.fullName,
          headline: agentLeads.headline,
          jobTitle: agentLeads.jobTitle,
          company: agentLeads.company,
          avatarUrl: agentLeads.avatarUrl,
          profileUrl: agentLeads.profileUrl,
          matchScore: agentLeads.matchScore,
          signalText: agentLeads.signalText,
          // The fine state, not the coarse funnel. `step` says "replied" for
          // somebody the agent is about to answer and for somebody it has
          // stopped writing to for good, and those are opposite facts.
          sequenceStatus: agentLeads.sequenceStatus,
        })
        .from(agentLeads)
        .where(
          and(
            eq(agentLeads.workspaceId, workspaceId),
            inArray(agentLeads.id, leadIds)
          )
        ),
      // The full conversation both ways, oldest first, which is reading order.
      db
        .select({
          leadId: agentMessages.leadId,
          direction: agentMessages.direction,
          body: agentMessages.body,
          sentAt: agentMessages.sentAt,
        })
        .from(agentMessages)
        .where(
          and(
            eq(agentMessages.workspaceId, workspaceId),
            inArray(agentMessages.leadId, leadIds)
          )
        )
        .orderBy(asc(agentMessages.sentAt)),
      db
        .select({ id: agents.id, name: agents.name })
        .from(agents)
        .where(eq(agents.workspaceId, workspaceId)),
    ]);

    const person = new Map(people.map((p) => [p.id, p]));
    const agentName = new Map(mine.map((a) => [a.id, a.name]));

    const threads = leadIds.flatMap((leadId) => {
      const who = person.get(leadId);
      const last = newestByLead.get(leadId);
      if (!who || !last) return [];
      return [
        {
          leadId,
          agentName: agentName.get(last.agentId) ?? "Agent",
          unread: last.readAt === null,
          repliedAt: last.sentAt,
          lastReply: last.body,
          fullName: who.fullName,
          title:
            [who.jobTitle, who.company].filter(Boolean).join(", ") || who.headline,
          avatarUrl: who.avatarUrl,
          profileUrl: who.profileUrl,
          matchScore: who.matchScore,
          signalText: who.signalText,
          sequenceStatus: who.sequenceStatus,
          messages: everyMessage
            .filter((m) => m.leadId === leadId)
            .map((m) => ({ from: m.direction, body: m.body, at: m.sentAt })),
        },
      ];
    });

    return NextResponse.json({
      threads,
      unread: threads.filter((t) => t.unread).length,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load replies" }, { status: 500 });
  }
}

/** Marks one person's replies as read, or all of them. */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const leadId = typeof body?.leadId === "string" ? body.leadId : "";
    if (leadId && leadId.length > 64) {
      return NextResponse.json({ error: "Which conversation?" }, { status: 400 });
    }

    // Ownership in the WHERE, so a lead id from another workspace marks nothing.
    const where = [
      eq(agentMessages.workspaceId, workspaceId),
      eq(agentMessages.direction, "in"),
      isNull(agentMessages.readAt),
    ];
    if (leadId) where.push(eq(agentMessages.leadId, leadId));

    await db
      .update(agentMessages)
      .set({ readAt: new Date() })
      .where(and(...where));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
