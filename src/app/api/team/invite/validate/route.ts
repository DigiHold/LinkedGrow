import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teamInvites, teams, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/team/invite/validate?token=xxx - Validate an invite token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
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

    // Get team details
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, invite.teamId),
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team no longer exists" },
        { status: 404 }
      );
    }

    // Get inviter details (team owner)
    const owner = await db.query.users.findFirst({
      where: eq(users.id, team.ownerId),
    });

    return NextResponse.json({
      invite: {
        teamName: team.name,
        inviterName: owner?.name || owner?.email || "Team Owner",
        role: invite.role,
        email: invite.email,
      },
    });
  } catch (error) {
    console.error("Failed to validate invite:", error);
    return NextResponse.json(
      { error: "Failed to validate invite" },
      { status: 500 }
    );
  }
}
