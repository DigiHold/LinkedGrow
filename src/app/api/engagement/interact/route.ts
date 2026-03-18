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

    // Collect both tokens - try Community App first (w_member_social_feed), then Poster App (w_member_social)
    const communityToken = user.linkedinCommunityAccessToken;
    const posterToken = user.linkedinAccessToken;
    if (!communityToken && !posterToken) {
      return NextResponse.json(
        { error: "Connect your LinkedIn account to like and comment" },
        { status: 400 }
      );
    }
    if (!user.linkedinProfileId) {
      return NextResponse.json(
        { error: "LinkedIn profile ID not found. Reconnect your LinkedIn account." },
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

    // Use activity URN directly (confirmed by LinkedIn docs)
    const today = new Date().toISOString().split("T")[0];

    if (action === "like") {
      // Try both tokens - Community App has w_member_social_feed, Poster App has w_member_social
      const tokens = [communityToken, posterToken].filter(Boolean) as string[];
      await likeLinkedInPost(tokens, postUrn, user.linkedinProfileId);

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

      // Comments work with w_member_social (old scope) - try both tokens
      const commentTokens = [communityToken, posterToken].filter(Boolean) as string[];
      await createLinkedInComment(commentTokens, postUrn, user.linkedinProfileId, text.trim());

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
