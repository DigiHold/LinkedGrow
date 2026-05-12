import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  networkNotificationGroups,
  networkNotificationMembers,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const INVITE_EXPIRY_DAYS = 7;

// GET /api/network-notifications/invite/[token] - Get invite details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || typeof token !== "string" || token.length > 128) {
      return NextResponse.json(
        { error: "Invalid invite token" },
        { status: 400 }
      );
    }

    // Find invite by token
    const [invite] = await db
      .select()
      .from(networkNotificationMembers)
      .where(eq(networkNotificationMembers.inviteToken, token))
      .limit(1);

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      );
    }

    // Check if already accepted or declined
    if (invite.status !== "invited") {
      return NextResponse.json(
        { error: `This invite has already been ${invite.status}` },
        { status: 400 }
      );
    }

    // Check expiry (7 days from createdAt)
    if (invite.createdAt) {
      const expiresAt = new Date(invite.createdAt);
      expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
      if (new Date() > expiresAt) {
        return NextResponse.json(
          { error: "This invite has expired" },
          { status: 400 }
        );
      }
    }

    // Get group info
    const [group] = await db
      .select({ name: networkNotificationGroups.name, ownerId: networkNotificationGroups.ownerId })
      .from(networkNotificationGroups)
      .where(eq(networkNotificationGroups.id, invite.groupId))
      .limit(1);

    if (!group) {
      return NextResponse.json(
        { error: "Group no longer exists" },
        { status: 404 }
      );
    }

    // Get inviter (group owner) name
    const [owner] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, group.ownerId))
      .limit(1);

    return NextResponse.json({
      groupName: group.name,
      inviterName: owner?.name || owner?.email || "Unknown",
      email: invite.email,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch invite details" },
      { status: 500 }
    );
  }
}

// POST /api/network-notifications/invite/[token] - Accept or decline invite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;

    if (!token || typeof token !== "string" || token.length > 128) {
      return NextResponse.json(
        { error: "Invalid invite token" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (!action || !["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    // Find invite by token
    const [invite] = await db
      .select()
      .from(networkNotificationMembers)
      .where(eq(networkNotificationMembers.inviteToken, token))
      .limit(1);

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      );
    }

    // Check if already acted upon
    if (invite.status !== "invited") {
      return NextResponse.json(
        { error: `This invite has already been ${invite.status}` },
        { status: 400 }
      );
    }

    // Check expiry
    if (invite.createdAt) {
      const expiresAt = new Date(invite.createdAt);
      expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
      if (new Date() > expiresAt) {
        return NextResponse.json(
          { error: "This invite has expired" },
          { status: 400 }
        );
      }
    }

    // Verify user's email matches invite email (case-insensitive)
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.email.toLowerCase().trim() !== invite.email.toLowerCase().trim()) {
      return NextResponse.json(
        {
          error:
            "This invite was sent to a different email address. Please sign in with the correct account.",
        },
        { status: 403 }
      );
    }

    if (action === "accept") {
      await db
        .update(networkNotificationMembers)
        .set({
          status: "accepted",
          userId: session.user.id,
          acceptedAt: new Date(),
        })
        .where(eq(networkNotificationMembers.id, invite.id));

      return NextResponse.json({
        message: "Invite accepted successfully",
        groupId: invite.groupId,
      });
    } else {
      await db
        .update(networkNotificationMembers)
        .set({ status: "declined" })
        .where(eq(networkNotificationMembers.id, invite.id));

      return NextResponse.json({ message: "Invite declined" });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process invite" },
      { status: 500 }
    );
  }
}
