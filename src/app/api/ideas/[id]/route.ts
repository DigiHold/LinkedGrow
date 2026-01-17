// Ideas API - Single idea operations
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ideas, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// DELETE /api/ideas/[id] - Delete an idea
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if idea exists and belongs to user
    const [idea] = await db
      .select()
      .from(ideas)
      .where(and(eq(ideas.id, id), eq(ideas.userId, user.id)))
      .limit(1);

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Delete the idea
    await db
      .delete(ideas)
      .where(and(eq(ideas.id, id), eq(ideas.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting idea:", error);
    return NextResponse.json(
      { error: "Failed to delete idea" },
      { status: 500 }
    );
  }
}
