import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentLeads, agentMessages, agents } from "@/lib/db/schema";
import { loadSessionUser } from "@/lib/auth-user";
import { workspaceMembers } from "@/lib/team-utils";

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

    const [people, everyMessage, mine, members] = await Promise.all([
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
          outcome: agentLeads.outcome,
          assignedTo: agentLeads.assignedTo,
        })
        .from(agentLeads)
        .where(
          and(
            eq(agentLeads.workspaceId, workspaceId),
            inArray(agentLeads.id, leadIds),
            // A rejected row is a duplicate or a discard, and on 2026-08-17 a
            // duplicate of a live lead showed up here as its own dead thread.
            isNull(agentLeads.rejectedAt)
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
      workspaceMembers(workspaceId),
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
          // Needed so the page can post the outcome back: the lead route is
          // keyed on the agent, and ownership lives in its WHERE clause.
          agentId: last.agentId,
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
          // What the customer already told us came of this one, so the buttons
          // show the answer rather than asking again every time.
          outcome: who.outcome,
          assignedTo: who.assignedTo,
          messages: everyMessage
            .filter((m) => m.leadId === leadId)
            .map((m) => ({ from: m.direction, body: m.body, at: m.sentAt })),
        },
      ];
    });

    return NextResponse.json({
      threads,
      unread: threads.filter((t) => t.unread).length,
      /* Who could own a thread, and who is reading. A solo workspace gets one
         member back and the page hides the whole idea. */
      members,
      me: data.user.id,
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

    /**
     * Taking the conversation over by hand.
     *
     * The agent keeps talking to most people who reply, which is the point of
     * it, but the customer has to be able to step in on any one of them without
     * pausing the whole agent. Writing `handed_over` is the same state the
     * engine sets when it decides a reply needs a person, so the sequence
     * already knows to leave this thread alone for good.
     *
     * Ownership is in the WHERE. A lead id from another workspace changes
     * nothing and still answers ok, because telling a stranger which ids exist
     * is its own small leak.
     */
    if (body?.action === "take-over") {
      if (!leadId) {
        return NextResponse.json({ error: "Which conversation?" }, { status: 400 });
      }
      await db
        .update(agentLeads)
        .set({ sequenceStatus: "handed_over", updatedAt: new Date() })
        .where(and(eq(agentLeads.id, leadId), eq(agentLeads.workspaceId, workspaceId)));
      return NextResponse.json({ ok: true, sequenceStatus: "handed_over" });
    }

    /**
     * Giving a conversation an owner, or taking the owner off it.
     *
     * The assignee has to be somebody in this workspace, checked against the
     * member list rather than trusted from the body: an id from anywhere else
     * would otherwise print a stranger's name on a customer's thread. Null is
     * allowed and means nobody has it.
     */
    if (body?.action === "assign") {
      if (!leadId) {
        return NextResponse.json({ error: "Which conversation?" }, { status: 400 });
      }
      const assignee = typeof body?.assignee === "string" ? body.assignee : null;
      if (assignee && assignee.length > 64) {
        return NextResponse.json({ error: "Unknown teammate" }, { status: 400 });
      }
      if (assignee) {
        const members = await workspaceMembers(workspaceId);
        if (!members.some((m) => m.id === assignee)) {
          return NextResponse.json({ error: "Unknown teammate" }, { status: 400 });
        }
      }
      await db
        .update(agentLeads)
        .set({
          assignedTo: assignee,
          assignedAt: assignee ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(and(eq(agentLeads.id, leadId), eq(agentLeads.workspaceId, workspaceId)));
      return NextResponse.json({ ok: true, assignedTo: assignee });
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
