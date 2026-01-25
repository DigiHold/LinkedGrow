import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teams, teamMembers, teamInvites, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { canAccessFeature } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { sendTeamInviteEmail } from "@/lib/email";

// POST /api/team/invite - Send team invite
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

    const body = await request.json();
    const { email, role, teamId } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Verify user is owner or admin of this team
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    const isOwner = team.ownerId === user.id;
    let isAdmin = false;

    if (!isOwner) {
      const membership = await db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, user.id),
          eq(teamMembers.role, "admin")
        ),
      });
      isAdmin = !!membership;
    }

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You must be a team owner or admin to invite members" },
        { status: 403 }
      );
    }

    // Validate email
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Validate role
    if (role && !["admin", "member"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin' or 'member'" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is already a team member
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (existingUser) {
      const existingMember = await db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, existingUser.id)
        ),
      });

      if (existingMember) {
        return NextResponse.json(
          { error: "This user is already a team member" },
          { status: 400 }
        );
      }
    }

    // Check if there's already a pending invite for this email
    const existingInvite = await db.query.teamInvites.findFirst({
      where: and(
        eq(teamInvites.teamId, teamId),
        eq(teamInvites.email, normalizedEmail)
      ),
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "An invite has already been sent to this email" },
        { status: 400 }
      );
    }

    // Get team details for the email
    const teamDetails = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!teamDetails) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Generate invite token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invite
    const inviteId = nanoid();
    await db.insert(teamInvites).values({
      id: inviteId,
      teamId,
      email: normalizedEmail,
      role: role || "member",
      token,
      expiresAt,
      createdAt: new Date(),
    });

    // Send invite email
    try {
      await sendTeamInviteEmail({
        to: normalizedEmail,
        inviterName: user.name || user.email,
        teamName: teamDetails.name,
        role: role || "member",
        inviteToken: token,
      });
    } catch (emailError) {
      console.error("Failed to send invite email:", emailError);
      // Don't fail the request if email fails - invite is still created
    }

    return NextResponse.json({
      invite: {
        id: inviteId,
        email: normalizedEmail,
        role: role || "member",
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      message: "Invite sent successfully",
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/team/invite?token=${token}`,
    });
  } catch (error) {
    console.error("Failed to send invite:", error);
    return NextResponse.json(
      { error: "Failed to send invite" },
      { status: 500 }
    );
  }
}
