import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { engagementLists, engagementListProfiles, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { canAccessFeature, type PlanId } from "@/lib/plans";

// PUT /api/engagement/lists/[id] - Rename a list
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Verify ownership
    const [list] = await db
      .select()
      .from(engagementLists)
      .where(and(eq(engagementLists.id, id), eq(engagementLists.userId, session.user.id)));

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    await db
      .update(engagementLists)
      .set({ name: name.trim() })
      .where(eq(engagementLists.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
return NextResponse.json({ error: "Failed to rename list" }, { status: 500 });
  }
}

// DELETE /api/engagement/lists/[id] - Delete a list and its profiles
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const [list] = await db
      .select()
      .from(engagementLists)
      .where(and(eq(engagementLists.id, id), eq(engagementLists.userId, session.user.id)));

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Delete profiles first (FK cascade should handle this, but be explicit)
    await db.delete(engagementListProfiles).where(eq(engagementListProfiles.listId, id));
    await db.delete(engagementLists).where(eq(engagementLists.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
return NextResponse.json({ error: "Failed to delete list" }, { status: 500 });
  }
}
