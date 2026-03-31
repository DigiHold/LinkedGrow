import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, teamMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET - Get member's auto-engagement settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find team membership
    const membership = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, session.user.id),
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a team member" }, { status: 404 });
    }

    // Get user's LinkedIn connection status
    const [user] = await db
      .select({
        linkedinAccessToken: users.linkedinAccessToken,
        linkedinProfileId: users.linkedinProfileId,
        linkedinProfileName: users.linkedinProfileName,
        linkedinTokenExpiry: users.linkedinTokenExpiry,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const hasLinkedIn = !!(user?.linkedinAccessToken && user?.linkedinProfileId);
    const tokenExpired = user?.linkedinTokenExpiry
      ? user.linkedinTokenExpiry < new Date()
      : false;

    return NextResponse.json({
      autoEngageLike: membership.autoEngageLike ?? true,
      autoEngageComment: membership.autoEngageComment ?? true,
      autoEngageShare: membership.autoEngageShare ?? false,
      linkedinConnected: hasLinkedIn && !tokenExpired,
      linkedinProfileName: user?.linkedinProfileName || null,
      role: membership.role,
    });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 }
    );
  }
}

// PUT - Update auto-engagement preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { autoEngageLike, autoEngageComment, autoEngageShare } = body;

    // Find team membership
    const membership = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, session.user.id),
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a team member" }, { status: 404 });
    }

    // Update settings
    const updates: Record<string, unknown> = {};
    if (typeof autoEngageLike === "boolean") updates.autoEngageLike = autoEngageLike;
    if (typeof autoEngageComment === "boolean")
      updates.autoEngageComment = autoEngageComment;
    if (typeof autoEngageShare === "boolean")
      updates.autoEngageShare = autoEngageShare;

    if (Object.keys(updates).length > 0) {
      await db
        .update(teamMembers)
        .set(updates)
        .where(eq(teamMembers.id, membership.id));
    }

    return NextResponse.json({ success: true, ...updates });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
