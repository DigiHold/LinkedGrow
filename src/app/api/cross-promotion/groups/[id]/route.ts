import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  crossPromotionGroups,
  crossPromotionMembers,
  crossPromotionPosts,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { canAccessFeature } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

// GET /api/cross-promotion/groups/[id] - Get group details with members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPlan = (session.user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "crossPromotion")) {
      return NextResponse.json(
        { error: "Cross Promotion requires Pro plan or higher" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verify user is a member of this group
    const membership = await db
      .select()
      .from(crossPromotionMembers)
      .where(
        and(
          eq(crossPromotionMembers.groupId, id),
          eq(crossPromotionMembers.userId, session.user.id),
          eq(crossPromotionMembers.status, "accepted")
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // Get group info
    const [group] = await db
      .select()
      .from(crossPromotionGroups)
      .where(eq(crossPromotionGroups.id, id))
      .limit(1);

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Get all members with user details
    const members = await db
      .select({
        id: crossPromotionMembers.id,
        userId: crossPromotionMembers.userId,
        email: crossPromotionMembers.email,
        status: crossPromotionMembers.status,
        createdAt: crossPromotionMembers.createdAt,
        acceptedAt: crossPromotionMembers.acceptedAt,
      })
      .from(crossPromotionMembers)
      .where(eq(crossPromotionMembers.groupId, id));

    // Enrich members with name from users table
    const enrichedMembers = [];
    for (const member of members) {
      let name: string | null = null;
      if (member.userId) {
        const [user] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, member.userId))
          .limit(1);
        name = user?.name || null;
      }
      enrichedMembers.push({
        ...member,
        name,
        isOwner: member.userId === group.ownerId,
      });
    }

    // Get recent cross-promotion posts
    const recentPosts = await db
      .select({
        id: crossPromotionPosts.id,
        linkedinPostId: crossPromotionPosts.linkedinPostId,
        postContent: crossPromotionPosts.postContent,
        publishedByUserId: crossPromotionPosts.publishedByUserId,
        createdAt: crossPromotionPosts.createdAt,
      })
      .from(crossPromotionPosts)
      .where(eq(crossPromotionPosts.groupId, id))
      .orderBy(desc(crossPromotionPosts.createdAt))
      .limit(20);

    // Enrich posts with publisher name
    const enrichedPosts = [];
    for (const post of recentPosts) {
      const [publisher] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, post.publishedByUserId))
        .limit(1);
      enrichedPosts.push({
        ...post,
        publisherName: publisher?.name || publisher?.email || "Unknown",
      });
    }

    // Get owner name
    const [owner] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, group.ownerId))
      .limit(1);

    return NextResponse.json({
      group: {
        ...group,
        ownerName: owner?.name || owner?.email || "Unknown",
        isOwner: group.ownerId === session.user.id,
      },
      members: enrichedMembers,
      posts: enrichedPosts,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch group details" },
      { status: 500 }
    );
  }
}

// DELETE /api/cross-promotion/groups/[id] - Delete a group (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPlan = (session.user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "crossPromotion")) {
      return NextResponse.json(
        { error: "Cross Promotion requires Pro plan or higher" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verify user is the owner
    const [group] = await db
      .select()
      .from(crossPromotionGroups)
      .where(eq(crossPromotionGroups.id, id))
      .limit(1);

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the group owner can delete this group" },
        { status: 403 }
      );
    }

    // Delete the group (cascade will handle members, posts, and actions)
    await db
      .delete(crossPromotionGroups)
      .where(eq(crossPromotionGroups.id, id));

    return NextResponse.json({ message: "Group deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
}
