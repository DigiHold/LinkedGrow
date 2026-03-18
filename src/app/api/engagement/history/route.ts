import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { engagementActions } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

// POST /api/engagement/history - Get which posts the user has liked/commented
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { postUrns } = body;

    if (!postUrns || !Array.isArray(postUrns) || postUrns.length === 0) {
      return NextResponse.json({ liked: [], commented: [] });
    }

    const actions = await db
      .select({
        type: engagementActions.type,
        linkedinPostId: engagementActions.linkedinPostId,
        reactionType: engagementActions.reactionType,
      })
      .from(engagementActions)
      .where(
        and(
          eq(engagementActions.userId, session.user.id),
          inArray(engagementActions.linkedinPostId, postUrns)
        )
      );

    // liked: Map of postUrn -> reactionType
    const liked: Record<string, string> = {};
    for (const a of actions) {
      if (a.type === "like" && a.linkedinPostId) {
        liked[a.linkedinPostId] = a.reactionType || "LIKE";
      }
    }
    const commented = [...new Set(actions.filter((a) => a.type === "comment").map((a) => a.linkedinPostId).filter(Boolean))];

    return NextResponse.json({ liked, commented });
  } catch {
    return NextResponse.json({ liked: [], commented: [] });
  }
}
