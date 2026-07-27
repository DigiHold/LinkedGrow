import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agents, agentLeads } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";
import { rateLimit } from "@/lib/rate-limit";

/**
 * The leads of one agent, as a CSV.
 *
 * Capped rather than unbounded: a full table scan streamed to a browser is the
 * cheapest way for one customer to make every other customer's requests slow.
 */

const MAX_ROWS = 5000;

/** RFC 4180 quoting. A company name with a comma in it must not shift columns. */
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

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

    // An export is expensive, so it is limited per user rather than per IP.
    const limit = rateLimit(`leads-export:${session.user.id}`, {
      windowMs: 60_000,
      maxRequests: 5,
    });
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many exports. Try again in a minute." },
        { status: 429 }
      );
    }

    const data = await loadSessionUser(session.user.id);
    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const workspaceId = data.teamOwnerId ?? data.user.id;

    const [agent] = await db
      .select({ id: agents.id, name: agents.name })
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
      .limit(1);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const rows = await db
      .select({
        fullName: agentLeads.fullName,
        jobTitle: agentLeads.jobTitle,
        company: agentLeads.company,
        location: agentLeads.location,
        profileUrl: agentLeads.profileUrl,
        matchScore: agentLeads.matchScore,
        matchReason: agentLeads.matchReason,
        signalText: agentLeads.signalText,
        signalUrl: agentLeads.signalUrl,
        step: agentLeads.step,
        foundAt: agentLeads.foundAt,
      })
      .from(agentLeads)
      .where(
        and(
          eq(agentLeads.agentId, id),
          eq(agentLeads.workspaceId, workspaceId)
        )
      )
      .orderBy(desc(agentLeads.foundAt))
      .limit(MAX_ROWS);

    const header = [
      "Name",
      "Job title",
      "Company",
      "Location",
      "Profile",
      "Match score",
      "Why it matched",
      "Signal",
      "Signal link",
      "Step",
      "Found on",
    ];
    const body = rows.map((row) =>
      [
        row.fullName,
        row.jobTitle,
        row.company,
        row.location,
        row.profileUrl,
        row.matchScore,
        row.matchReason,
        row.signalText,
        row.signalUrl,
        row.step,
        row.foundAt ? new Date(row.foundAt).toISOString().slice(0, 10) : "",
      ]
        .map(cell)
        .join(",")
    );

    // The BOM keeps accented names readable when the file opens in Excel.
    const csv = `﻿${[header.join(","), ...body].join("\r\n")}`;
    const slug = agent.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug || "leads"}-leads.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
