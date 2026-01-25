import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teams, teamMembers, teamInvites, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { canAccessFeature } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { nanoid } from "nanoid";

// GET /api/team - Get user's team and members
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
    const userPlan = (user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "teamCollaboration")) {
      return NextResponse.json(
        { error: "Team Collaboration requires Business plan" },
        { status: 403 }
      );
    }

    // Find user's team membership
    const membership = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, user.id),
    });

    if (!membership) {
      // Check if user owns a team
      const ownedTeam = await db.query.teams.findFirst({
        where: eq(teams.ownerId, user.id),
      });

      if (!ownedTeam) {
        return NextResponse.json({ team: null, members: [], pendingInvites: [] });
      }

      // Get team members
      const members = await db
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
        .where(eq(teamMembers.teamId, ownedTeam.id));

      // Get pending invites
      const pendingInvites = await db.query.teamInvites.findMany({
        where: eq(teamInvites.teamId, ownedTeam.id),
      });

      return NextResponse.json({
        team: {
          id: ownedTeam.id,
          name: ownedTeam.name,
          ownerId: ownedTeam.ownerId,
          createdAt: ownedTeam.createdAt?.toISOString(),
        },
        members: members.map((m) => ({
          id: m.id,
          userId: m.userId,
          email: m.email,
          name: m.name,
          image: m.image,
          role: m.role,
          invitedAt: m.invitedAt?.toISOString(),
          acceptedAt: m.acceptedAt?.toISOString(),
        })),
        pendingInvites: pendingInvites.map((i) => ({
          id: i.id,
          email: i.email,
          role: i.role,
          createdAt: i.createdAt?.toISOString(),
          expiresAt: i.expiresAt?.toISOString(),
        })),
      });
    }

    // User is a member of a team
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, membership.teamId),
    });

    if (!team) {
      return NextResponse.json({ team: null, members: [], pendingInvites: [] });
    }

    // Get team members
    const members = await db
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

    // Get pending invites (only if user is owner or admin)
    let pendingInvites: {
      id: string;
      email: string;
      role: string | null;
      createdAt: string | undefined;
      expiresAt: string | undefined;
    }[] = [];

    if (membership.role === "owner" || membership.role === "admin") {
      const invites = await db.query.teamInvites.findMany({
        where: eq(teamInvites.teamId, team.id),
      });
      pendingInvites = invites.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        createdAt: i.createdAt?.toISOString(),
        expiresAt: i.expiresAt?.toISOString(),
      }));
    }

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        ownerId: team.ownerId,
        createdAt: team.createdAt?.toISOString(),
      },
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        email: m.email,
        name: m.name,
        image: m.image,
        role: m.role,
        invitedAt: m.invitedAt?.toISOString(),
        acceptedAt: m.acceptedAt?.toISOString(),
      })),
      pendingInvites,
    });
  } catch (error) {
    console.error("Failed to fetch team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
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
    const userPlan = (user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "teamCollaboration")) {
      return NextResponse.json(
        { error: "Team Collaboration requires Business plan" },
        { status: 403 }
      );
    }

    // Check if user already has a team
    const existingTeam = await db.query.teams.findFirst({
      where: eq(teams.ownerId, user.id),
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "You already have a team" },
        { status: 400 }
      );
    }

    // Check if user is already a member of another team
    const existingMembership = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, user.id),
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already a member of another team" },
        { status: 400 }
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
    });
  } catch (error) {
    console.error("Failed to create team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}

// PATCH /api/team - Update team (name)
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
    const userPlan = (user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "teamCollaboration")) {
      return NextResponse.json(
        { error: "Team Collaboration requires Business plan" },
        { status: 403 }
      );
    }

    // Find user's team (must be owner)
    const team = await db.query.teams.findFirst({
      where: eq(teams.ownerId, user.id),
    });

    if (!team) {
      return NextResponse.json(
        { error: "You must be the team owner to update the team" },
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

    // Update team
    await db.update(teams).set({ name: name.trim() }).where(eq(teams.id, team.id));

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

// DELETE /api/team - Delete team
export async function DELETE() {
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
    const userPlan = (user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "teamCollaboration")) {
      return NextResponse.json(
        { error: "Team Collaboration requires Business plan" },
        { status: 403 }
      );
    }

    // Find user's team (must be owner)
    const team = await db.query.teams.findFirst({
      where: eq(teams.ownerId, user.id),
    });

    if (!team) {
      return NextResponse.json(
        { error: "You must be the team owner to delete the team" },
        { status: 403 }
      );
    }

    // Delete all team invites
    await db.delete(teamInvites).where(eq(teamInvites.teamId, team.id));

    // Delete all team members
    await db.delete(teamMembers).where(eq(teamMembers.teamId, team.id));

    // Delete team
    await db.delete(teams).where(eq(teams.id, team.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
