import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, engagementActions } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { canAccessFeature } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import {
  getLinkedInFeed,
  likeLinkedInPost,
  createLinkedInComment,
} from "@/lib/linkedin";
import { randomUUID } from "crypto";

async function getTodayCounts(userId: string) {
  const today = new Date().toISOString().split("T")[0];
  const likes = await db
    .select({ count: sql<number>`count(*)` })
    .from(engagementActions)
    .where(and(eq(engagementActions.userId, userId), eq(engagementActions.type, "like"), eq(engagementActions.date, today)));
  const comments = await db
    .select({ count: sql<number>`count(*)` })
    .from(engagementActions)
    .where(and(eq(engagementActions.userId, userId), eq(engagementActions.type, "comment"), eq(engagementActions.date, today)));
  return { likes: likes[0]?.count || 0, comments: comments[0]?.count || 0 };
}

// GET /api/linkedin/feed - Fetch enriched LinkedIn feed
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userPlan = (user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "engagement")) {
      return NextResponse.json({ error: "Engagement requires Pro plan or higher" }, { status: 403 });
    }

    const accessToken = user.linkedinCommunityAccessToken || user.linkedinAccessToken;
    if (!accessToken) {
      return NextResponse.json({ error: "LinkedIn not connected" }, { status: 400 });
    }

    const result = await getLinkedInFeed(accessToken, 20);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch feed:", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}

// POST /api/linkedin/feed - Like or comment on a feed post
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userPlan = (user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "engagement")) {
      return NextResponse.json({ error: "Engagement requires Pro plan or higher" }, { status: 403 });
    }

    const accessToken = user.linkedinCommunityAccessToken || user.linkedinAccessToken;
    if (!accessToken || !user.linkedinProfileId) {
      return NextResponse.json({ error: "LinkedIn not connected" }, { status: 400 });
    }

    const body = await request.json();
    const { action, postUrn, text } = body;

    if (!action || !postUrn) {
      return NextResponse.json({ error: "Missing action or postUrn" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];

    if (action === "like") {
      await likeLinkedInPost(accessToken, postUrn, user.linkedinProfileId);

      await db.insert(engagementActions).values({
        id: randomUUID(),
        userId: user.id,
        type: "like",
        linkedinPostId: postUrn,
        date: today,
        createdAt: new Date(),
      });

      const counts = await getTodayCounts(user.id);
      return NextResponse.json({ success: true, today: counts });
    }

    if (action === "comment") {
      if (!text || text.trim().length === 0) {
        return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
      }

      await createLinkedInComment(accessToken, postUrn, user.linkedinProfileId, text.trim());

      await db.insert(engagementActions).values({
        id: randomUUID(),
        userId: user.id,
        type: "comment",
        linkedinPostId: postUrn,
        commentContent: text.trim(),
        date: today,
        createdAt: new Date(),
      });

      const counts = await getTodayCounts(user.id);
      return NextResponse.json({ success: true, today: counts });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to perform feed action:", error);
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}
