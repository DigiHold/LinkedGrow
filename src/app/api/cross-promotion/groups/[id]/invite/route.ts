import { NextRequest, NextResponse } from "next/server";
import crypto, { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  crossPromotionGroups,
  crossPromotionMembers,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { canAccessFeature } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { sendCrossPromotionInviteEmail } from "@/lib/email";

// POST /api/cross-promotion/groups/[id]/invite - Invite someone to a group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPlan = (session.user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "crossPromotion")) {
      return NextResponse.json(
        { error: "Cross Promotion requires Pro plan or higher" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verify user is the group owner
    const [group] = await db
      .select()
      .from(crossPromotionGroups)
      .where(eq(crossPromotionGroups.id, id))
      .limit(1);

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the group owner can invite members" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    if (email.length > 255) {
      return NextResponse.json(
        { error: "Email address is too long" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Enforce member limits based on plan
    const memberLimit = userPlan === "business" ? 20 : 10; // Pro = 10, Business = 20
    const [memberCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(crossPromotionMembers)
      .where(
        and(
          eq(crossPromotionMembers.groupId, id),
          // Count accepted + invited (pending invites count toward limit)
        )
      );

    const currentMemberCount = memberCountResult?.count || 0;
    if (currentMemberCount >= memberLimit) {
      return NextResponse.json(
        {
          error: `This group has reached the maximum of ${memberLimit} members for the ${userPlan === "business" ? "Business" : "Pro"} plan`,
        },
        { status: 400 }
      );
    }

    // Check if email is already a member or has a pending invite
    const existingMember = await db
      .select()
      .from(crossPromotionMembers)
      .where(
        and(
          eq(crossPromotionMembers.groupId, id),
          eq(crossPromotionMembers.email, normalizedEmail)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      const status = existingMember[0].status;
      if (status === "accepted") {
        return NextResponse.json(
          { error: "This person is already a member of this group" },
          { status: 400 }
        );
      }
      if (status === "invited") {
        return NextResponse.json(
          { error: "An invite has already been sent to this email" },
          { status: 400 }
        );
      }
      // If declined, allow re-invite by deleting the old record
      await db
        .delete(crossPromotionMembers)
        .where(eq(crossPromotionMembers.id, existingMember[0].id));
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const memberId = randomUUID();

    // Create member record with invite
    await db.insert(crossPromotionMembers).values({
      id: memberId,
      groupId: id,
      email: normalizedEmail,
      status: "invited",
      inviteToken,
      createdAt: new Date(),
    });

    // Get inviter name for the email
    const [inviter] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    // Send invite email
    try {
      await sendCrossPromotionInviteEmail({
        to: normalizedEmail,
        inviterName: inviter?.name || inviter?.email || "Someone",
        groupName: group.name,
        inviteToken,
      });
    } catch (emailError) {
      // Don't fail the request if email fails - invite is still created
    }

    return NextResponse.json({
      invite: {
        id: memberId,
        email: normalizedEmail,
        status: "invited",
        createdAt: new Date().toISOString(),
      },
      message: "Invite sent successfully",
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cross-promotion/invite?token=${inviteToken}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send invite" },
      { status: 500 }
    );
  }
}
