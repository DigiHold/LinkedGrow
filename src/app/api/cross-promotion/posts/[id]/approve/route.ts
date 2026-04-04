import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  crossPromotionPosts,
  crossPromotionActions,
  crossPromotionMembers,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { canAccessFeature } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { scheduleCrossPromotionAction } from "@/lib/qstash";

// POST /api/cross-promotion/posts/[id]/approve - Approve selected actions
export async function POST(
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

    const body = await request.json();
    const { like, comment, repost, commentText, repostText } = body;

    // Validate body types
    if (typeof like !== "boolean" || typeof comment !== "boolean" || typeof repost !== "boolean") {
      return NextResponse.json(
        { error: "like, comment, and repost must be boolean values" },
        { status: 400 }
      );
    }

    if (comment && commentText) {
      if (typeof commentText !== "string" || commentText.length > 3000) {
        return NextResponse.json(
          { error: "Comment text must be a string under 3000 characters" },
          { status: 400 }
        );
      }
    }

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

    // Get pending actions for this user on this post
    const actions = await db
      .select()
      .from(crossPromotionActions)
      .where(
        and(
          eq(crossPromotionActions.crossPromotionPostId, id),
          eq(crossPromotionActions.userId, session.user.id),
          eq(crossPromotionActions.status, "pending")
        )
      );

    if (actions.length === 0) {
      return NextResponse.json(
        { error: "No pending actions for this post" },
        { status: 400 }
      );
    }

    const now = new Date();
    const actionMap: Record<string, boolean> = { like, comment, repost };

    // Process each action
    for (const action of actions) {
      const isEnabled = actionMap[action.actionType];

      if (isEnabled) {
        // Calculate staggered delay based on action type
        let minDelay: number;
        let maxDelay: number;

        switch (action.actionType) {
          case "like":
            minDelay = 60;
            maxDelay = 180;
            break;
          case "comment":
            minDelay = 180;
            maxDelay = 420;
            break;
          case "repost":
            minDelay = 420;
            maxDelay = 900;
            break;
          default:
            minDelay = 60;
            maxDelay = 180;
        }

        const delaySeconds =
          Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

        // Update to approved first
        await db
          .update(crossPromotionActions)
          .set({
            status: "approved",
            approvedAt: now,
            delaySeconds,
            ...(action.actionType === "comment" && commentText
              ? { commentText }
              : {}),
            ...(action.actionType === "repost" && repostText
              ? { commentText: repostText }
              : {}),
          })
          .where(eq(crossPromotionActions.id, action.id));

        // Schedule via QStash
        try {
          const messageId = await scheduleCrossPromotionAction(
            action.id,
            delaySeconds
          );

          // Update to scheduled with QStash message ID
          await db
            .update(crossPromotionActions)
            .set({
              status: "scheduled",
              qstashMessageId: messageId,
            })
            .where(eq(crossPromotionActions.id, action.id));
        } catch (scheduleError) {
          // If scheduling fails, keep as approved - can be retried
        }
      } else {
        // Skip this action
        await db
          .update(crossPromotionActions)
          .set({ status: "skipped" })
          .where(eq(crossPromotionActions.id, action.id));
      }
    }

    return NextResponse.json({
      message: "Actions processed successfully",
      approved: [
        like && "like",
        comment && "comment",
        repost && "repost",
      ].filter(Boolean),
      skipped: [
        !like && "like",
        !comment && "comment",
        !repost && "repost",
      ].filter(Boolean),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process actions" },
      { status: 500 }
    );
  }
}
