import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agents, agentSources } from "@/lib/db/schema";
import { loadSessionUser } from "@/lib/auth-user";

/**
 * Adding a place for an agent to hunt, after it was created.
 *
 * The wizard collected the first sources and then there was no way to add a
 * competitor whose page went quiet, or the creator whose comment section is
 * full of your buyers. A person's audience is the densest room on LinkedIn,
 * and until now it could only be chosen on day one.
 */

const TYPES = ["competitor", "creator", "keyword", "buying_event"] as const;
const EVENTS = ["jobchange", "hiring", "funding", "event"] as const;

/** The company or person a URL points at, or null when it points elsewhere. */
function linkedinUrl(raw: string, want: "company" | "in"): string | null {
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (!/(^|\.)linkedin\.com$/.test(url.hostname)) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] !== want || !parts[1]) return null;
    const slug = parts[1];
    return want === "company"
      ? `https://www.linkedin.com/company/${slug}/posts/`
      : `https://www.linkedin.com/in/${slug}/recent-activity/all/`;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await loadSessionUser(session.user.id);
    if (!data) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const workspaceId = data.teamOwnerId ?? data.user.id;

    // Ownership in the WHERE clause, so somebody else's agent id finds nothing.
    const [agent] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
      .limit(1);
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const body = await request.json();
    const type = typeof body?.type === "string" ? body.type : "";
    const value = typeof body?.value === "string" ? body.value.trim() : "";
    if (!TYPES.includes(type as (typeof TYPES)[number])) {
      return NextResponse.json({ error: "Unknown source type" }, { status: 400 });
    }
    if (!value || value.length > 300) {
      return NextResponse.json({ error: "Fill the field in" }, { status: 400 });
    }

    let label = value;
    let config: Record<string, unknown> = {};

    if (type === "competitor" || type === "creator") {
      const want = type === "competitor" ? "company" : "in";
      // A name is allowed for a creator: the worker resolves it with one
      // search. A company has to be a URL, because names collide.
      if (value.startsWith("http") || value.includes("linkedin.com")) {
        const url = linkedinUrl(value, want);
        if (!url) {
          return NextResponse.json(
            {
              error:
                want === "company"
                  ? "That is not a LinkedIn company page address"
                  : "That is not a LinkedIn profile address",
            },
            { status: 400 }
          );
        }
        config = { url };
        label = url.split("/")[4] ?? value;
      } else if (type === "creator") {
        config = {};
        label = value;
      } else {
        return NextResponse.json(
          { error: "Paste the company page address, like linkedin.com/company/acme" },
          { status: 400 }
        );
      }
    } else if (type === "keyword") {
      const queries = value
        .split(",")
        .map((q: string) => q.trim())
        .filter((q: string) => q.length > 0)
        .slice(0, 6);
      if (queries.length === 0) {
        return NextResponse.json({ error: "Give at least one phrase" }, { status: 400 });
      }
      config = { queries };
      label = queries[0] as string;
    } else {
      if (!EVENTS.includes(value as (typeof EVENTS)[number])) {
        return NextResponse.json({ error: "Unknown event" }, { status: 400 });
      }
      const EVENT_LABEL: Record<string, string> = {
        jobchange: "Just changed role",
        hiring: "Hiring for the work",
        funding: "Just raised money",
        event: "Going to an event",
      };
      config = { kind: value };
      label = EVENT_LABEL[value] ?? value;
    }

    const now = new Date();
    const sourceId = randomUUID();
    await db.insert(agentSources).values({
      id: sourceId,
      workspaceId,
      agentId: id,
      type,
      label: label.slice(0, 120),
      config: JSON.stringify(config),
      enabled: true,
      origin: "customer",
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id: sourceId, label, type }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "The source could not be added" }, { status: 500 });
  }
}
