/**
 * One email a week per agent, with the people it found.
 *
 * Weekly rather than daily on Nicolas's call: a mail every morning about leads
 * gets filtered by Thursday, and then the alerts that matter go with it.
 * An agent that found nothing sends nothing, because a digest reading zero is
 * a reason to cancel that we would have posted ourselves.
 */

import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, agents, agentLeads } from "@/lib/db/schema";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { sendLeadsDigestEmail } from "@/lib/email/notify";
import type { Lead } from "@/lib/email/templates/agent-alert-emails";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const BEST_SHOWN = 3;

/** Statuses that mean the agent has not written to this person yet. */
const WAITING = ["found", "queued"] as const;

async function runLeadsDigest(): Promise<{ agents: number; sent: number }> {
  const since = new Date(Date.now() - WEEK_MS);

  const running = await db
    .select({
      agentId: agents.id,
      agentName: agents.name,
      email: users.email,
      name: users.name,
    })
    .from(agents)
    .innerJoin(users, eq(users.id, agents.workspaceId))
    .where(eq(agents.status, "active"));

  let sent = 0;

  for (const agent of running) {
    if (!agent.email) continue;

    const found = await db
      .select({
        name: agentLeads.fullName,
        headline: agentLeads.headline,
        reason: agentLeads.matchReason,
        score: agentLeads.matchScore,
      })
      .from(agentLeads)
      .where(and(eq(agentLeads.agentId, agent.agentId), gte(agentLeads.createdAt, since)))
      .orderBy(desc(agentLeads.matchScore));

    if (found.length === 0) continue;

    const best: Lead[] = found.slice(0, BEST_SHOWN).map((lead) => ({
      name: lead.name ?? "Unnamed",
      title: lead.headline ?? "",
      why: lead.reason ?? "",
      score: lead.score,
    }));

    const queued = await db
      .select({ id: agentLeads.id })
      .from(agentLeads)
      .where(and(eq(agentLeads.agentId, agent.agentId), inArray(agentLeads.step, WAITING)));

    try {
      await sendLeadsDigestEmail({
        to: agent.email,
        name: agent.name,
        count: found.length,
        best,
        queuedNext: queued.length,
        agentId: agent.agentId,
      });
      sent += 1;
    } catch {
      continue;
    }
  }

  return { agents: running.length, sent };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("upstash-signature") || "";

    const isValid = await receiver.verify({
      body,
      signature,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/leads-digest`,
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
    const result = await runLeadsDigest();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Leads digest failed",
        detail: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
