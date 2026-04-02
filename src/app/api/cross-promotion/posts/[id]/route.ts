import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  crossPromotionGroups,
  crossPromotionPosts,
  crossPromotionActions,
  crossPromotionMembers,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { canAccessFeature } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

// GET /api/cross-promotion/posts/[id] - Get a cross-promotion post for review
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

    // Get the cross-promotion post
    const [post] = await db
      .select()
      .from(crossPromotionPosts)
      .where(eq(crossPromotionPosts.id, id))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Verify user is a member of the group
    const [membership] = await db
      .select()
      .from(crossPromotionMembers)
      .where(
        and(
          eq(crossPromotionMembers.groupId, post.groupId),
          eq(crossPromotionMembers.userId, session.user.id),
          eq(crossPromotionMembers.status, "accepted")
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // Get actions for this user on this post
    const actions = await db
      .select()
      .from(crossPromotionActions)
      .where(
        and(
          eq(crossPromotionActions.crossPromotionPostId, id),
          eq(crossPromotionActions.userId, session.user.id)
        )
      );

    if (actions.length === 0) {
      return NextResponse.json(
        { error: "No pending actions for this post" },
        { status: 404 }
      );
    }

    // Get publisher name and group name
    const [publisher] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, post.publishedByUserId))
      .limit(1);

    const [group] = await db
      .select({ name: crossPromotionGroups.name })
      .from(crossPromotionGroups)
      .where(eq(crossPromotionGroups.id, post.groupId))
      .limit(1);

    // Check current user's LinkedIn + AI key status
    const [currentUser] = await db
      .select({
        linkedinAccessToken: users.linkedinAccessToken,
        linkedinProfileId: users.linkedinProfileId,
        aiProvider: users.aiProvider,
        openaiApiKey: users.openaiApiKey,
        anthropicApiKey: users.anthropicApiKey,
        googleApiKey: users.googleApiKey,
        grokApiKey: users.grokApiKey,
        perplexityApiKey: users.perplexityApiKey,
        kimiApiKey: users.kimiApiKey,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const linkedinConnected = !!(currentUser?.linkedinAccessToken && currentUser?.linkedinProfileId);
    const hasAiKey = !!(
      currentUser?.openaiApiKey ||
      currentUser?.anthropicApiKey ||
      currentUser?.googleApiKey ||
      currentUser?.grokApiKey ||
      currentUser?.perplexityApiKey ||
      currentUser?.kimiApiKey
    );

    return NextResponse.json({
      post: {
        id: post.id,
        linkedinPostId: post.linkedinPostId,
        postContent: post.postContent,
        publisherName: publisher?.name || publisher?.email || "Unknown",
        groupName: group?.name || "",
        createdAt: post.createdAt,
      },
      actions: actions.map((a) => ({
        id: a.id,
        actionType: a.actionType,
        status: a.status,
        commentText: a.commentText || null,
      })),
      linkedinConnected,
      hasAiKey,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch post details" },
      { status: 500 }
    );
  }
}
