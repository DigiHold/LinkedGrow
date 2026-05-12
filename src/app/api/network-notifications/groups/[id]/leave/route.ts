import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { networkNotificationGroups, networkNotificationMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/network-notifications/groups/[id]/leave - Leave a group (non-owner only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check the group exists
    const [group] = await db
      .select()
      .from(networkNotificationGroups)
      .where(eq(networkNotificationGroups.id, id))
      .limit(1);

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Owner can't leave their own group (they should delete it instead)
    if (group.ownerId === session.user.id) {
      return NextResponse.json({ error: "Owners cannot leave their own group. Delete the group instead." }, { status: 400 });
    }

    // Find and remove the membership
    const [membership] = await db
      .select()
      .from(networkNotificationMembers)
      .where(
        and(
          eq(networkNotificationMembers.groupId, id),
          eq(networkNotificationMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: "You are not a member of this group" }, { status: 404 });
    }

    await db
      .delete(networkNotificationMembers)
      .where(eq(networkNotificationMembers.id, membership.id));

    return NextResponse.json({ message: "You have left the group" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to leave group" }, { status: 500 });
  }
}
