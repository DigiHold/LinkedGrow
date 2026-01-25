import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teams, teamMembers, teamInvites, users } from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";
import { canAccessFeature } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { nanoid } from "nanoid";

// GET /api/team - Get all user's teams (owned + member of)
export async function GET() {
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

    // Find all teams user owns
    const ownedTeams = await db.query.teams.findMany({
      where: eq(teams.ownerId, user.id),
    });

    // Find all teams user is a member of (but doesn't own)
    const memberships = await db.query.teamMembers.findMany({
      where: eq(teamMembers.userId, user.id),
    });

    const memberTeamIds = memberships
      .map((m) => m.teamId)
      .filter((id) => !ownedTeams.some((t) => t.id === id));

    let memberTeams: typeof ownedTeams = [];
    if (memberTeamIds.length > 0) {
      memberTeams = await db.query.teams.findMany({
        where: or(...memberTeamIds.map((id) => eq(teams.id, id))),
      });
    }

    const allTeams = [...ownedTeams, ...memberTeams];

    // For each team, get members and pending invites
    const teamsWithDetails = await Promise.all(
      allTeams.map(async (team) => {
        // Get team members
        const teamMembersList = await db
          .select({
            id: teamMembers.id,
            userId: teamMembers.userId,
            role: teamMembers.role,
            invitedAt: teamMembers.invitedAt,
            acceptedAt: teamMembers.acceptedAt,
            email: users.email,
            name: users.name,
            image: users.image,
          })
          .from(teamMembers)
          .innerJoin(users, eq(teamMembers.userId, users.id))
          .where(eq(teamMembers.teamId, team.id));

        // Get user's role in this team
        const userMembership = memberships.find((m) => m.teamId === team.id);
        const userRole = team.ownerId === user.id ? "owner" : userMembership?.role || "member";

        // Get pending invites (only if user is owner or admin)
        let pendingInvitesList: {
          id: string;
          email: string;
          role: string | null;
          createdAt: string | undefined;
          expiresAt: string | undefined;
        }[] = [];

        if (userRole === "owner" || userRole === "admin") {
          const invites = await db.query.teamInvites.findMany({
            where: eq(teamInvites.teamId, team.id),
          });
          pendingInvitesList = invites.map((i) => ({
            id: i.id,
            email: i.email,
            role: i.role,
            createdAt: i.createdAt?.toISOString(),
            expiresAt: i.expiresAt?.toISOString(),
          }));
        }

        return {
          team: {
            id: team.id,
            name: team.name,
            ownerId: team.ownerId,
            createdAt: team.createdAt?.toISOString(),
          },
          members: teamMembersList.map((m) => ({
            id: m.id,
            userId: m.userId,
            email: m.email,
            name: m.name,
            image: m.image,
            role: m.role,
            invitedAt: m.invitedAt?.toISOString(),
            acceptedAt: m.acceptedAt?.toISOString(),
          })),
          pendingInvites: pendingInvitesList,
          userRole,
        };
      })
    );

    return NextResponse.json({ teams: teamsWithDetails });
  } catch (error) {
    console.error("Failed to fetch teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

// POST /api/team - Create a new team
export async function POST(request: NextRequest) {
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
    const userPlan = (session.user.plan || user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "teamCollaboration")) {
      return NextResponse.json(
        { error: "Team Collaboration requires Business plan" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: "Team name must be 50 characters or less" },
        { status: 400 }
      );
    }

    // Create team
    const teamId = nanoid();
    await db.insert(teams).values({
      id: teamId,
      name: name.trim(),
      ownerId: user.id,
      createdAt: new Date(),
    });

    // Add owner as team member
    const memberId = nanoid();
    await db.insert(teamMembers).values({
      id: memberId,
      teamId,
      userId: user.id,
      role: "owner",
      invitedAt: new Date(),
      acceptedAt: new Date(),
    });

    return NextResponse.json({
      team: {
        id: teamId,
        name: name.trim(),
        ownerId: user.id,
        createdAt: new Date().toISOString(),
      },
      members: [
        {
          id: memberId,
          userId: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: "owner",
          invitedAt: new Date().toISOString(),
          acceptedAt: new Date().toISOString(),
        },
      ],
      pendingInvites: [],
      userRole: "owner",
    });
  } catch (error) {
    console.error("Failed to create team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}

// PATCH /api/team - Update team (name) - requires teamId in body
export async function PATCH(request: NextRequest) {
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
    const userPlan = (session.user.plan || user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "teamCollaboration")) {
      return NextResponse.json(
        { error: "Team Collaboration requires Business plan" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { teamId, name } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Find the team
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Only owner can update team
    if (team.ownerId !== user.id) {
      return NextResponse.json(
        { error: "You must be the team owner to update the team" },
        { status: 403 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: "Team name must be 50 characters or less" },
        { status: 400 }
      );
    }

    // Update team
    await db.update(teams).set({ name: name.trim() }).where(eq(teams.id, teamId));

    return NextResponse.json({
      team: {
        id: team.id,
        name: name.trim(),
        ownerId: team.ownerId,
        createdAt: team.createdAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to update team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

// DELETE /api/team - Delete team - requires teamId in query params
export async function DELETE(request: NextRequest) {
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
    const userPlan = (session.user.plan || user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "teamCollaboration")) {
      return NextResponse.json(
        { error: "Team Collaboration requires Business plan" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Find the team
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Only owner can delete team
    if (team.ownerId !== user.id) {
      return NextResponse.json(
        { error: "You must be the team owner to delete the team" },
        { status: 403 }
      );
    }

    // Delete all team invites
    await db.delete(teamInvites).where(eq(teamInvites.teamId, teamId));

    // Delete all team members
    await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));

    // Delete team
    await db.delete(teams).where(eq(teams.id, teamId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
