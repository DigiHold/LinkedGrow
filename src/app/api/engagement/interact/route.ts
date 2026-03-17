import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, engagementActions } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { canAccessFeature, type PlanId } from "@/lib/plans";
import { likeLinkedInPost, createLinkedInComment } from "@/lib/linkedin";

// POST /api/engagement/interact - Like or comment on a LinkedIn post
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id));

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!canAccessFeature((user.plan || "free") as PlanId, "engagement")) {
      return NextResponse.json({ error: "Requires Pro plan" }, { status: 403 });
    }

    // Use Community App token (w_member_social scope)
    const accessToken = user.linkedinCommunityAccessToken;
    if (!accessToken || !user.linkedinProfileId) {
      return NextResponse.json(
        { error: "Connect the Community App from Settings to like and comment" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, postUrn, text } = body;

    if (!action || !postUrn) {
      return NextResponse.json(
        { error: "action and postUrn are required" },
        { status: 400 }
      );
    }

    // Convert urn:li:activity:XXX to the format LinkedIn socialActions API expects
    const activityMatch = postUrn.match(/^urn:li:activity:(\d+)$/);
    const activityId = activityMatch ? activityMatch[1] : null;

    const today = new Date().toISOString().split("T")[0];

    if (action === "like") {
      // Try urn:li:share first, fall back to urn:li:ugcPost
      let likeError: Error | null = null;
      const urnFormats = activityId
        ? [`urn:li:share:${activityId}`, `urn:li:ugcPost:${activityId}`, postUrn]
        : [postUrn];

      for (const urn of urnFormats) {
        try {
          await likeLinkedInPost(accessToken, urn, user.linkedinProfileId);
          likeError = null;
          break;
        } catch (err) {
          likeError = err instanceof Error ? err : new Error(String(err));
        }
      }
      if (likeError) throw likeError;

      await db.insert(engagementActions).values({
        id: randomUUID(),
        userId: user.id,
        type: "like",
        linkedinPostId: postUrn,
        date: today,
        createdAt: new Date(),
      });
    } else if (action === "comment") {
      if (!text || text.trim().length === 0) {
        return NextResponse.json(
          { error: "Comment text is required" },
          { status: 400 }
        );
      }

      // Try urn:li:share first, fall back to urn:li:ugcPost
      let commentError: Error | null = null;
      const commentUrnFormats = activityId
        ? [`urn:li:share:${activityId}`, `urn:li:ugcPost:${activityId}`, postUrn]
        : [postUrn];

      for (const urn of commentUrnFormats) {
        try {
          await createLinkedInComment(accessToken, urn, user.linkedinProfileId, text.trim());
          commentError = null;
          break;
        } catch (err) {
          commentError = err instanceof Error ? err : new Error(String(err));
        }
      }
      if (commentError) throw commentError;

      await db.insert(engagementActions).values({
        id: randomUUID(),
        userId: user.id,
        type: "comment",
        linkedinPostId: postUrn,
        commentContent: text.trim(),
        date: today,
        createdAt: new Date(),
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Return updated daily counts
    const likesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(engagementActions)
      .where(
        and(
          eq(engagementActions.userId, user.id),
          eq(engagementActions.type, "like"),
          eq(engagementActions.date, today)
        )
      );
    const commentsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(engagementActions)
      .where(
        and(
          eq(engagementActions.userId, user.id),
          eq(engagementActions.type, "comment"),
          eq(engagementActions.date, today)
        )
      );

    return NextResponse.json({
      success: true,
      today: {
        likes: likesResult[0]?.count || 0,
        comments: commentsResult[0]?.count || 0,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Engagement interact error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
