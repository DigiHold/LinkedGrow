import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  db,
  users,
  sessions,
  accounts,
  posts,
  media,
  ideas,
  passwordResetTokens,
  abTests,
  teams,
  teamMembers,
  teamInvites,
  apiKeys,
  apiLogs,
  postAnalytics,
  engagementActions,
  engagementObjectives,
  engagementLists,
  engagementListProfiles,
  teamEngagementJobs,
  crossPromotionGroups,
  crossPromotionMembers,
  crossPromotionPosts,
  crossPromotionActions,
  abandonedCheckouts,
  cookieConsents,
  dataRemovalRequests,
  userTemplates,
  savedCarousels,
  affiliates,
  affiliateReferrals,
  affiliateCommissions,
  affiliatePayouts,
} from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";

// GET /api/admin/users/[id] - Get single user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return user data (exclude sensitive fields)
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      isAdmin: user.isAdmin,
      twoFactorEnabled: user.twoFactorEnabled,
      linkedinProfileName: user.linkedinProfileName,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, plan, isAdmin, password } = body;

    // Verify user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent admin from removing their own admin status
    if (id === session.user.id && isAdmin === false) {
      return NextResponse.json(
        { error: "You cannot remove your own admin status" },
        { status: 400 }
      );
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== existingUser.email) {
      const emailExists = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      if (emailExists) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (plan !== undefined) updateData.plan = plan;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;

    // Handle password change
    if (password !== undefined && password.trim() !== "") {
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      updateData.password = hashedPassword;
    }

    // Update user
    await db.update(users).set(updateData).where(eq(users.id, id));

    // Fetch updated user
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser?.id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        plan: updatedUser?.plan,
        isAdmin: updatedUser?.isAdmin,
      },
    });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user and all their data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // Prevent admin from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Verify user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Explicitly delete ALL related data in correct order
    // (don't rely on CASCADE - tables were created via turso db shell)

    // 1. Get IDs needed for nested deletions
    const userPosts = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.userId, id));
    const postIds = userPosts.map((p) => p.id);

    const userTeams = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.ownerId, id));
    const teamIds = userTeams.map((t) => t.id);

    const userApiKeys = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(eq(apiKeys.userId, id));
    const apiKeyIds = userApiKeys.map((k) => k.id);

    const userEngagementLists = await db
      .select({ id: engagementLists.id })
      .from(engagementLists)
      .where(eq(engagementLists.userId, id));
    const engagementListIds = userEngagementLists.map((l) => l.id);

    const userCrossGroups = await db
      .select({ id: crossPromotionGroups.id })
      .from(crossPromotionGroups)
      .where(eq(crossPromotionGroups.ownerId, id));
    const crossGroupIds = userCrossGroups.map((g) => g.id);

    const userAffiliates = await db
      .select({ id: affiliates.id })
      .from(affiliates)
      .where(eq(affiliates.userId, id));
    const affiliateIds = userAffiliates.map((a) => a.id);

    const userAffiliateReferrals = affiliateIds.length
      ? await db
          .select({ id: affiliateReferrals.id })
          .from(affiliateReferrals)
          .where(inArray(affiliateReferrals.affiliateId, affiliateIds))
      : [];
    const affiliateReferralIds = userAffiliateReferrals.map((r) => r.id);

    const userTeamMembers = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(eq(teamMembers.userId, id));
    const teamMemberIds = userTeamMembers.map((m) => m.id);

    // 2. Delete deepest child tables first
    // Cross promotion actions (references crossPromotionPosts)
    await db
      .delete(crossPromotionActions)
      .where(eq(crossPromotionActions.userId, id));

    // Cross promotion posts (references crossPromotionGroups + posts)
    if (crossGroupIds.length) {
      await db
        .delete(crossPromotionPosts)
        .where(inArray(crossPromotionPosts.groupId, crossGroupIds));
    }
    if (postIds.length) {
      await db
        .delete(crossPromotionPosts)
        .where(inArray(crossPromotionPosts.postId, postIds));
    }
    await db
      .delete(crossPromotionPosts)
      .where(eq(crossPromotionPosts.publishedByUserId, id));

    // Cross promotion members
    if (crossGroupIds.length) {
      await db
        .delete(crossPromotionMembers)
        .where(inArray(crossPromotionMembers.groupId, crossGroupIds));
    }
    await db
      .delete(crossPromotionMembers)
      .where(eq(crossPromotionMembers.userId, id));

    // Cross promotion groups
    await db
      .delete(crossPromotionGroups)
      .where(eq(crossPromotionGroups.ownerId, id));

    // Team engagement jobs
    await db
      .delete(teamEngagementJobs)
      .where(eq(teamEngagementJobs.userId, id));
    if (teamMemberIds.length) {
      await db
        .delete(teamEngagementJobs)
        .where(inArray(teamEngagementJobs.teamMemberId, teamMemberIds));
    }

    // Affiliate commissions (references affiliateReferrals)
    if (affiliateReferralIds.length) {
      await db
        .delete(affiliateCommissions)
        .where(
          inArray(affiliateCommissions.referralId, affiliateReferralIds)
        );
    }

    // Affiliate payouts (references affiliates)
    if (affiliateIds.length) {
      await db
        .delete(affiliatePayouts)
        .where(inArray(affiliatePayouts.affiliateId, affiliateIds));
    }

    // Affiliate referrals (references affiliates + users)
    if (affiliateIds.length) {
      await db
        .delete(affiliateReferrals)
        .where(inArray(affiliateReferrals.affiliateId, affiliateIds));
    }
    await db
      .delete(affiliateReferrals)
      .where(eq(affiliateReferrals.referredUserId, id));

    // Affiliates
    await db.delete(affiliates).where(eq(affiliates.userId, id));

    // API logs (references apiKeys)
    await db.delete(apiLogs).where(eq(apiLogs.userId, id));
    if (apiKeyIds.length) {
      await db
        .delete(apiLogs)
        .where(inArray(apiLogs.apiKeyId, apiKeyIds));
    }

    // API keys
    await db.delete(apiKeys).where(eq(apiKeys.userId, id));

    // Post analytics (references posts)
    if (postIds.length) {
      await db
        .delete(postAnalytics)
        .where(inArray(postAnalytics.postId, postIds));
    }

    // Engagement list profiles (references engagementLists)
    if (engagementListIds.length) {
      await db
        .delete(engagementListProfiles)
        .where(
          inArray(engagementListProfiles.listId, engagementListIds)
        );
    }

    // Engagement lists
    await db
      .delete(engagementLists)
      .where(eq(engagementLists.userId, id));

    // Team invites (references teams)
    if (teamIds.length) {
      await db
        .delete(teamInvites)
        .where(inArray(teamInvites.teamId, teamIds));
    }

    // Team members (from teams owned by user + user's own memberships)
    if (teamIds.length) {
      await db
        .delete(teamMembers)
        .where(inArray(teamMembers.teamId, teamIds));
    }
    await db.delete(teamMembers).where(eq(teamMembers.userId, id));

    // Teams
    await db.delete(teams).where(eq(teams.ownerId, id));

    // 3. Direct user reference tables
    await db.delete(posts).where(eq(posts.userId, id));
    await db.delete(media).where(eq(media.userId, id));
    await db.delete(ideas).where(eq(ideas.userId, id));
    await db.delete(sessions).where(eq(sessions.userId, id));
    await db.delete(accounts).where(eq(accounts.userId, id));
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, id));
    await db.delete(abTests).where(eq(abTests.userId, id));
    await db
      .delete(engagementActions)
      .where(eq(engagementActions.userId, id));
    await db
      .delete(engagementObjectives)
      .where(eq(engagementObjectives.userId, id));
    await db.delete(userTemplates).where(eq(userTemplates.userId, id));
    await db.delete(savedCarousels).where(eq(savedCarousels.userId, id));
    await db
      .delete(abandonedCheckouts)
      .where(eq(abandonedCheckouts.userId, id));

    // 4. Set null tables
    await db
      .update(cookieConsents)
      .set({ userId: null })
      .where(eq(cookieConsents.userId, id));
    await db
      .update(dataRemovalRequests)
      .set({ userId: null })
      .where(eq(dataRemovalRequests.userId, id));
    await db
      .update(dataRemovalRequests)
      .set({ processedBy: null })
      .where(eq(dataRemovalRequests.processedBy, id));

    // 5. Delete the user
    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({
      success: true,
      message: "User and all associated data have been deleted",
    });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Failed to delete user: ${error.message}`
            : "Failed to delete user",
      },
      { status: 500 }
    );
  }
}
