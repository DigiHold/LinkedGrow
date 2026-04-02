import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { crossPromotionGroups, crossPromotionMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// DELETE /api/cross-promotion/members/[id] - Remove a member (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: memberId } = await params;

    // Get the member record
    const [member] = await db
      .select()
      .from(crossPromotionMembers)
      .where(eq(crossPromotionMembers.id, memberId))
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Verify the current user is the group owner
    const [group] = await db
      .select()
      .from(crossPromotionGroups)
      .where(eq(crossPromotionGroups.id, member.groupId))
      .limit(1);

    if (!group || group.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only the group owner can remove members" }, { status: 403 });
    }

    // Can't remove yourself (the owner)
    if (member.userId === session.user.id) {
      return NextResponse.json({ error: "You can't remove yourself from your own group" }, { status: 400 });
    }

    await db
      .delete(crossPromotionMembers)
      .where(eq(crossPromotionMembers.id, memberId));

    return NextResponse.json({ message: "Member removed" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
