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
      })
      .from(engagementActions)
      .where(
        and(
          eq(engagementActions.userId, session.user.id),
          inArray(engagementActions.linkedinPostId, postUrns)
        )
      );

    const liked = [...new Set(actions.filter((a) => a.type === "like").map((a) => a.linkedinPostId).filter(Boolean))];
    const commented = [...new Set(actions.filter((a) => a.type === "comment").map((a) => a.linkedinPostId).filter(Boolean))];

    return NextResponse.json({ liked, commented });
  } catch {
    return NextResponse.json({ liked: [], commented: [] });
  }
}
