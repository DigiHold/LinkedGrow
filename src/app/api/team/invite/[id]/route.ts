import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teams, teamMembers, teamInvites, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { canAccessFeature } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

// DELETE /api/team/invite/:id - Cancel an invite
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Check if user has access to team collaboration
    // Use session plan (which includes inherited plan for team members) instead of DB plan
    const userPlan = (session.user.plan || user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "teamCollaboration")) {
      return NextResponse.json(
        { error: "Team Collaboration requires Business plan" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Find the invite
    const invite = await db.query.teamInvites.findFirst({
      where: eq(teamInvites.id, id),
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Check if user has permission (team owner or admin)
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, invite.teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.ownerId !== user.id) {
      // Check if user is admin
      const membership = await db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.teamId, team.id),
          eq(teamMembers.userId, user.id),
          eq(teamMembers.role, "admin")
        ),
      });

      if (!membership) {
        return NextResponse.json(
          { error: "You must be a team owner or admin to cancel invites" },
          { status: 403 }
        );
      }
    }

    // Delete the invite
    await db.delete(teamInvites).where(eq(teamInvites.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to cancel invite" },
      { status: 500 }
    );
  }
}
