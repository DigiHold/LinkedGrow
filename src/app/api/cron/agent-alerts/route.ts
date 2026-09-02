/**
 * The agent's own emails, sent from the events it already writes.
 *
 * The worker never sends mail. It records what happened in agent_events, and
 * this pass turns the three kinds worth waking somebody for into an email:
 * an account LinkedIn wants verified, an agent that stopped, and a reply.
 * agent_events.notified_at is the marker, so an event is emailed once even if
 * the pass runs twice or overlaps itself.
 *
 * Backlog guard: events older than 12 hours are marked notified without being
 * sent. Coming back from an outage should not empty a week of alerts into
 * somebody's inbox at once.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";
import { db } from "@/lib/db";
import {
  users,
  agents,
  agentEvents,
  agentLeads,
  agentMessages,
} from "@/lib/db/schema";
import { and, desc, eq, isNull, inArray } from "drizzle-orm";
import {
  sendVerificationNeededEmail,
  sendAgentStoppedEmail,
  sendReplyEmail,
} from "@/lib/email/notify";

/** Types that earn an immediate email. Everything else is dashboard-only. */
const ALERTING = ["challenged", "error", "paused", "budget", "reply"] as const;

const TOO_OLD_MS = 12 * 60 * 60 * 1000;

/**
 * How long an agent has to stay down before its own recoverable error is worth
 * telling somebody about. Below this it is almost always back already.
 */
const STILL_DOWN_MS = 45 * 60 * 1000;
const MAX_PER_RUN = 50;

/** An agent that stops on its own budget or a pause is not coming back alone. */
function retriesItself(type: string): boolean {
  return type === "error";
}

async function runAgentAlerts(): Promise<{ sent: number; skipped: number }> {
  const cutoff = new Date(Date.now() - TOO_OLD_MS);

  const pending = await db
    .select({
      id: agentEvents.id,
      type: agentEvents.type,
      message: agentEvents.message,
      createdAt: agentEvents.createdAt,
      agentId: agentEvents.agentId,
      leadId: agentEvents.leadId,
      agentName: agents.name,
      /** When this agent last completed a pass, which says whether it recovered. */
      agentLastRunAt: agents.lastRunAt,
      email: users.email,
      name: users.name,
    })
    .from(agentEvents)
    .innerJoin(agents, eq(agents.id, agentEvents.agentId))
    .innerJoin(users, eq(users.id, agentEvents.workspaceId))
    .where(and(isNull(agentEvents.notifiedAt), inArray(agentEvents.type, [...ALERTING])))
    .orderBy(desc(agentEvents.createdAt))
    .limit(MAX_PER_RUN);

  let sent = 0;
  let skipped = 0;

  /**
   * One stopped-agent email per agent per run, no matter how many events the
   * backlog holds. A leaked-Chrome pileup on 2026-08-15 wrote an error event
   * every 5 minutes for a day, and this loop faithfully turned 17 of them into
   * 17 identical emails about a single outage.
   */
  const stoppedEmailed = new Set<string>();

  for (const event of pending) {
    /**
     * An error the agent recovered from on its own is not worth an email.
     *
     * The mail this sends says so itself: "It is already trying to start itself
     * again and usually succeeds within a minute." An alert that describes its
     * own irrelevance in its second paragraph is not an alert, it is noise, and
     * noise is what makes somebody stop reading the one that matters.
     *
     * On 2026-08-10 a worker was restarted eight times in one day to ship
     * fixes. Every restart cut a pass mid-flight, every cut wrote one of these,
     * and they landed in Nicolas's inbox about an account that was working
     * perfectly the whole time.
     *
     * Checked BEFORE the row is marked, so an agent that is genuinely down is
     * reconsidered on the next pass rather than being silenced for ever by a
     * deferral. A challenge, a pause and a budget ceiling skip this entirely:
     * nobody is coming to fix those but a person.
     */
    if (retriesItself(event.type)) {
      const recovered =
        event.agentLastRunAt !== null && event.agentLastRunAt > event.createdAt;
      const tooFresh = Date.now() - event.createdAt.getTime() < STILL_DOWN_MS;
      if (recovered) {
        // It came back. Close the event so it is never reconsidered.
        await db
          .update(agentEvents)
          .set({ notifiedAt: new Date() })
          .where(eq(agentEvents.id, event.id));
        skipped += 1;
        continue;
      }
      if (tooFresh) {
        // Left open on purpose: if it is still down in forty-five minutes, the
        // next pass sends it.
        skipped += 1;
        continue;
      }
    }

    // Mark first. A send that throws after the mail left would otherwise send
    // it again on the next pass, and a duplicate alert is worse than a lost one.
    await db
      .update(agentEvents)
      .set({ notifiedAt: new Date() })
      .where(eq(agentEvents.id, event.id));

    if (event.createdAt < cutoff || !event.email) {
      skipped += 1;
      continue;
    }

    const isStoppedFamily = event.type !== "challenged" && event.type !== "reply";
    if (isStoppedFamily && stoppedEmailed.has(event.agentId)) {
      skipped += 1;
      continue;
    }


    try {
      if (event.type === "challenged") {
        await sendVerificationNeededEmail({
          to: event.email,
          name: event.name,
          accountName: event.agentName,
          agentId: event.agentId,
        });
      } else if (event.type === "reply") {
        const person = event.leadId
          ? await db
              .select({ name: agentLeads.fullName, sequenceStatus: agentLeads.sequenceStatus })
              .from(agentLeads)
              .where(eq(agentLeads.id, event.leadId))
              .limit(1)
          : [];
        const inbound = event.leadId
          ? await db
              .select({ body: agentMessages.body })
              .from(agentMessages)
              .where(
                and(eq(agentMessages.leadId, event.leadId), eq(agentMessages.direction, "in"))
              )
              .orderBy(desc(agentMessages.sentAt))
              .limit(1)
          : [];

        /**
         * Whether the agent is done with this person, read the right way round.
         *
         * This asked `status === "conversing"` and called everything else
         * finished, so a lead who answered the hello was reported as "your
         * agent has stopped writing to this person for good" while the agent
         * was about to send them the real message. Three of those went out on
         * 2026-08-07. The states where it is genuinely over are the short list;
         * everything else is the agent still working.
         */
        const status = person[0]?.sequenceStatus ?? null;
        /**
         * "skipped" is NOT in this list, and it was, which made the reply
         * email say "the agent stopped writing to this person, yours now"
         * about leads the agent was still answering: skipped only means the
         * sales sequence will not pitch them, the conversation itself goes
         * on. On 2026-08-15 Nicolas's inbox said "yours now" about a thread
         * the agent answered 2 hours later.
         */
        const OVER = ["handed_over", "ask_sent", "stopped"];
        await sendReplyEmail({
          to: event.email,
          name: event.name,
          from: person[0]?.name ?? "Somebody",
          body: inbound[0]?.body ?? event.message,
          agentContinues: !OVER.includes(status ?? ""),
        });
      } else {
        await sendAgentStoppedEmail({
          to: event.email,
          name: event.name,
          reason: event.message,
          retrying: retriesItself(event.type),
          agentId: event.agentId,
        });
        stoppedEmailed.add(event.agentId);
        // The email covers the whole outage, so the rest of this agent's error
        // backlog is closed with it rather than queuing up more of the same.
        await db
          .update(agentEvents)
          .set({ notifiedAt: new Date() })
          .where(
            and(
              eq(agentEvents.agentId, event.agentId),
              eq(agentEvents.type, "error"),
              isNull(agentEvents.notifiedAt)
            )
          );
      }
      sent += 1;
    } catch {
      skipped += 1;
    }
  }

  return { sent, skipped };
}

export async function POST(request: NextRequest) {
  const verified = await verifyCronRequest(request, "/api/cron/agent-alerts");
  if (!verified.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await runAgentAlerts();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Agent alerts failed",
        detail: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
