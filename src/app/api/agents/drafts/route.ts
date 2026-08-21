import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentDrafts } from "@/lib/db/schema";
import { resolveWorkspace } from "@/lib/workspace";

/**
 * The agent a workspace configured before paying.
 *
 * One draft per workspace, overwritten on every save: the wizard is the only
 * writer and the only reader, and it always wants the latest state. GET also
 * answers whether the workspace can attach a LinkedIn account yet, so the
 * wizard knows which step 4 to show without a second request.
 */

const MAX_CONFIG_BYTES = 32_000;

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
    const [draft] = await db
      .select()
      .from(agentDrafts)
      .where(eq(agentDrafts.workspaceId, workspace.workspaceId))
      .limit(1);
    return NextResponse.json({
      agentSubscription: workspace.agentSubscription,
      draft: draft
        ? { name: draft.name, config: JSON.parse(draft.config), updatedAt: draft.updatedAt }
        : null,
    });
  } catch (error) {
    return NextResponse.json({ error: "Could not load the draft" }, { status: 500 });
  }
}

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
    const raw = await request.text();
    if (!raw || raw.length > MAX_CONFIG_BYTES) {
      return NextResponse.json({ error: "Invalid draft" }, { status: 400 });
    }
    let parsed: { name?: unknown; config?: unknown };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Invalid draft" }, { status: 400 });
    }
    const name =
      typeof parsed.name === "string" && parsed.name.trim()
        ? parsed.name.trim().slice(0, 80)
        : null;
    if (typeof parsed.config !== "object" || parsed.config === null) {
      return NextResponse.json({ error: "Invalid draft" }, { status: 400 });
    }
    const now = Math.floor(Date.now() / 1000);
    const config = JSON.stringify(parsed.config);
    const [existing] = await db
      .select({ id: agentDrafts.id })
      .from(agentDrafts)
      .where(eq(agentDrafts.workspaceId, workspace.workspaceId))
      .limit(1);
    if (existing) {
      await db
        .update(agentDrafts)
        .set({ name, config, updatedAt: now })
        .where(eq(agentDrafts.workspaceId, workspace.workspaceId));
    } else {
      await db.insert(agentDrafts).values({
        id: randomUUID(),
        workspaceId: workspace.workspaceId,
        createdBy: session.user.id,
        name,
        config,
        createdAt: now,
        updatedAt: now,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Could not save the draft" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const workspace = await resolveWorkspace(session.user.id);
    if (!workspace) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    await db.delete(agentDrafts).where(eq(agentDrafts.workspaceId, workspace.workspaceId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Could not delete the draft" }, { status: 500 });
  }
}
