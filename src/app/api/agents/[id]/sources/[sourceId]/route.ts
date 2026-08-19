import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentSources } from "@/lib/db/schema";
import { loadSessionUser } from "@/lib/auth-user";

/** The workspace this request may touch, or null. */
async function workspaceOf(userId: string): Promise<string | null> {
  const data = await loadSessionUser(userId);
  if (!data) return null;
  return data.teamOwnerId ?? data.user.id;
}

/** Turning a source off, which is what you want before deleting one. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  try {
    const { id, sourceId } = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const workspaceId = await workspaceOf(session.user.id);
    if (!workspaceId) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    if (typeof body?.enabled !== "boolean") {
      return NextResponse.json({ error: "enabled must be true or false" }, { status: 400 });
    }

    // Agent, source and workspace all in the WHERE: a wrong id changes nothing.
    await db
      .update(agentSources)
      .set({
        enabled: body.enabled,
        ...(body.enabled ? { retiredAt: null, retiredReason: null } : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(agentSources.id, sourceId),
          eq(agentSources.agentId, id),
          eq(agentSources.workspaceId, workspaceId)
        )
      );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "The source could not be updated" }, { status: 500 });
  }
}

/**
 * Removing a source for good.
 *
 * The leads it already found stay: they belong to the workspace, not to the
 * place they were found in.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  try {
    const { id, sourceId } = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const workspaceId = await workspaceOf(session.user.id);
    if (!workspaceId) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await db
      .delete(agentSources)
      .where(
        and(
          eq(agentSources.id, sourceId),
          eq(agentSources.agentId, id),
          eq(agentSources.workspaceId, workspaceId)
        )
      );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "The source could not be removed" }, { status: 500 });
  }
}
