import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncLinkedInPosts } from "@/lib/post-sync";
import { canAccessFeature } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// POST /api/analytics/sync - Sync all LinkedIn posts to local DB
export async function POST() {
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
    if (!canAccessFeature(userPlan, "analytics")) {
      return NextResponse.json(
        { error: "Post sync requires Pro plan or higher" },
        { status: 403 }
      );
    }

    if (!user.linkedinAccessToken || !user.linkedinProfileId) {
      return NextResponse.json(
        { error: "LinkedIn not connected" },
        { status: 400 }
      );
    }

    const result = await syncLinkedInPosts(user.id);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Post sync failed:", error);
    return NextResponse.json(
      { error: "Failed to sync posts" },
      { status: 500 }
    );
  }
}
