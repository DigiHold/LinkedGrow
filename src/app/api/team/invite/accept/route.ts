import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teamInvites, teamMembers, teams, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

// POST /api/team/invite/accept - Accept a team invite
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the invite
    const invite = await db.query.teamInvites.findFirst({
      where: eq(teamInvites.token, token),
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found or has been cancelled" },
        { status: 404 }
      );
    }

    // Check if expired
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 410 }
      );
    }

    // Verify the invite is for this user's email
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invitation was sent to a different email address" },
        { status: 403 }
      );
    }

    // Check if team exists
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, invite.teamId),
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team no longer exists" },
        { status: 404 }
      );
    }

    // Check if user is already a member of THIS specific team
    const existingMembership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.userId, user.id),
        eq(teamMembers.teamId, invite.teamId)
      ),
    });

    if (existingMembership) {
      // Already a member of this team, just delete the invite
      await db.delete(teamInvites).where(eq(teamInvites.id, invite.id));
      return NextResponse.json({
        success: true,
        message: "You are already a member of this team",
      });
    }

    // Add user as team member
    const memberId = nanoid();
    await db.insert(teamMembers).values({
      id: memberId,
      teamId: invite.teamId,
      userId: user.id,
      role: invite.role || "member",
      invitedAt: invite.createdAt,
      acceptedAt: new Date(),
    });

    // Delete the invite
    await db.delete(teamInvites).where(eq(teamInvites.id, invite.id));

    return NextResponse.json({
      success: true,
      teamId: invite.teamId,
      teamName: team.name,
      role: invite.role,
    });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}
