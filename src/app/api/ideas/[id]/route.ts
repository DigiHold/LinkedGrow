// Ideas API - Single idea operations
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ideas, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH /api/ideas/[id] - Update an idea
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content, createdAt } = body;

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

    // Update the idea
    const updateData: Record<string, unknown> = {
      title: title || idea.title,
      content: content !== undefined ? content : idea.content,
    };
    if (createdAt) {
      updateData.createdAt = new Date(createdAt);
    }

    await db
      .update(ideas)
      .set(updateData)
      .where(and(eq(ideas.id, id), eq(ideas.userId, user.id)));

    // Get updated idea
    const [updatedIdea] = await db
      .select()
      .from(ideas)
      .where(and(eq(ideas.id, id), eq(ideas.userId, user.id)))
      .limit(1);

    return NextResponse.json({ idea: updatedIdea });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to update idea" },
      { status: 500 }
    );
  }
}

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
return NextResponse.json(
      { error: "Failed to delete idea" },
      { status: 500 }
    );
  }
}
