import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teams, teamMembers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessFeature } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

// PATCH /api/team/members/:id - Update member role
export async function PATCH(
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

    // Find the member
    const member = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.id, id),
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Check if user is team owner
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, member.teamId),
    });

    if (!team || team.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Only team owners can change member roles" },
        { status: 403 }
      );
    }

    // Can't change owner's role
    if (member.role === "owner") {
      return NextResponse.json(
        { error: "Cannot change the owner's role" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || !["admin", "member"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin' or 'member'" },
        { status: 400 }
      );
    }

    // Update member role
    await db
      .update(teamMembers)
      .set({ role })
      .where(eq(teamMembers.id, id));

    return NextResponse.json({ success: true, role });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

// DELETE /api/team/members/:id - Remove member from team
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

    // Find the member to be removed
    const member = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.id, id),
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Get team and check permissions
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, member.teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const isOwner = team.ownerId === user.id;

    // Check if current user is an admin of this team
    let isAdmin = false;
    if (!isOwner) {
      const currentUserMembership = await db.query.teamMembers.findFirst({
        where: eq(teamMembers.userId, user.id),
      });
      isAdmin = currentUserMembership?.role === "admin" && currentUserMembership?.teamId === member.teamId;
    }

    // Permission checks:
    // - Owner can remove anyone except themselves
    // - Admin can only remove members (not other admins or owner)
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only team owners or admins can remove members" },
        { status: 403 }
      );
    }

    // Can't remove owner
    if (member.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove the team owner" },
        { status: 400 }
      );
    }

    // Admins can only remove members, not other admins
    if (isAdmin && !isOwner && member.role === "admin") {
      return NextResponse.json(
        { error: "Admins cannot remove other admins" },
        { status: 403 }
      );
    }

    // Delete member
    await db.delete(teamMembers).where(eq(teamMembers.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
