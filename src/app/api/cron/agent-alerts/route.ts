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
import { Receiver } from "@upstash/qstash";
import { auth } from "@/lib/auth";
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

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

/** Types that earn an immediate email. Everything else is dashboard-only. */
const ALERTING = ["challenged", "error", "paused", "budget", "reply"] as const;

const TOO_OLD_MS = 12 * 60 * 60 * 1000;
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

  for (const event of pending) {
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
        const OVER = ["handed_over", "ask_sent", "stopped", "skipped"];
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
      }
      sent += 1;
    } catch {
      skipped += 1;
    }
  }

  return { sent, skipped };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("upstash-signature") || "";

    const isValid = await receiver.verify({
      body,
      signature,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/agent-alerts`,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

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
