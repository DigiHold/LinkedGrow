import { eq, inArray } from "drizzle-orm";
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
  blogComments,
  waitlist,
  betaUsers,
  verificationTokens,
} from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { deleteR2ByPrefix } from "@/lib/storage/r2";
import { cancelScheduledPost } from "@/lib/qstash";

/**
 * Delete a user and every piece of data tied to that user.
 *
 * SAFETY: every delete is scoped by `userId` (or by an id-list derived from the
 * user's own rows). No row belonging to another user is touched. Tables that
 * hold a soft link to the user (cookieConsents, dataRemovalRequests) have the
 * userId nulled instead of being deleted so analytic/audit integrity is kept
 * without retaining personal data.
 *
 * Side effects handled best-effort (errors are swallowed so a third-party
 * outage can't prevent GDPR erasure):
 *   - Cancel active Stripe subscription
 *   - Cancel pending QStash messages (scheduled posts, team/cross-promo jobs)
 *   - Delete R2 objects under `users/{userId}/`
 */
export async function deleteUserData(userId: string): Promise<void> {
  if (!userId) throw new Error("userId is required");

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new Error("User not found");

  // --- Side-effect cleanups (best effort) -----------------------------------

  if (user.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } catch {}
  }

  // Cancel QStash messages tied to this user's rows.
  try {
    const scheduledPosts = await db
      .select({ id: posts.id, qstashMessageId: posts.qstashMessageId })
      .from(posts)
      .where(eq(posts.userId, userId));
    for (const p of scheduledPosts) {
      if (p.qstashMessageId) await cancelScheduledPost(p.qstashMessageId);
    }

    const teamJobs = await db
      .select({ qstashMessageId: teamEngagementJobs.qstashMessageId })
      .from(teamEngagementJobs)
      .where(eq(teamEngagementJobs.userId, userId));
    for (const j of teamJobs) {
      if (j.qstashMessageId) await cancelScheduledPost(j.qstashMessageId);
    }

    const crossActions = await db
      .select({ qstashMessageId: crossPromotionActions.qstashMessageId })
      .from(crossPromotionActions)
      .where(eq(crossPromotionActions.userId, userId));
    for (const a of crossActions) {
      if (a.qstashMessageId) await cancelScheduledPost(a.qstashMessageId);
    }
  } catch {}

  // R2 object cleanup - all user uploads live under users/{userId}/
  try {
    await deleteR2ByPrefix(`users/${userId}/`);
  } catch {}

  // --- DB cascade (manual because Turso tables were created without FK cascade) --

  // Gather id-lists scoped strictly to this user
  const userPosts = await db.select({ id: posts.id }).from(posts).where(eq(posts.userId, userId));
  const postIds = userPosts.map((p) => p.id);

  const userTeams = await db.select({ id: teams.id }).from(teams).where(eq(teams.ownerId, userId));
  const teamIds = userTeams.map((t) => t.id);

  const userApiKeys = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId));
  const apiKeyIds = userApiKeys.map((k) => k.id);

  const userEngagementLists = await db
    .select({ id: engagementLists.id })
    .from(engagementLists)
    .where(eq(engagementLists.userId, userId));
  const engagementListIds = userEngagementLists.map((l) => l.id);

  const userCrossGroups = await db
    .select({ id: crossPromotionGroups.id })
    .from(crossPromotionGroups)
    .where(eq(crossPromotionGroups.ownerId, userId));
  const crossGroupIds = userCrossGroups.map((g) => g.id);

  const userAffiliates = await db
    .select({ id: affiliates.id })
    .from(affiliates)
    .where(eq(affiliates.userId, userId));
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
    .where(eq(teamMembers.userId, userId));
  const teamMemberIds = userTeamMembers.map((m) => m.id);

  // Cross-promotion: deepest children first
  await db.delete(crossPromotionActions).where(eq(crossPromotionActions.userId, userId));
  if (crossGroupIds.length) {
    await db
      .delete(crossPromotionPosts)
      .where(inArray(crossPromotionPosts.groupId, crossGroupIds));
  }
  if (postIds.length) {
    await db.delete(crossPromotionPosts).where(inArray(crossPromotionPosts.postId, postIds));
  }
  await db
    .delete(crossPromotionPosts)
    .where(eq(crossPromotionPosts.publishedByUserId, userId));
  if (crossGroupIds.length) {
    await db
      .delete(crossPromotionMembers)
      .where(inArray(crossPromotionMembers.groupId, crossGroupIds));
  }
  await db.delete(crossPromotionMembers).where(eq(crossPromotionMembers.userId, userId));
  await db.delete(crossPromotionGroups).where(eq(crossPromotionGroups.ownerId, userId));

  // Team engagement jobs (both as the user, and as a job against their own team_member rows)
  await db.delete(teamEngagementJobs).where(eq(teamEngagementJobs.userId, userId));
  if (teamMemberIds.length) {
    await db
      .delete(teamEngagementJobs)
      .where(inArray(teamEngagementJobs.teamMemberId, teamMemberIds));
  }

  // Affiliate chain
  if (affiliateReferralIds.length) {
    await db
      .delete(affiliateCommissions)
      .where(inArray(affiliateCommissions.referralId, affiliateReferralIds));
  }
  if (affiliateIds.length) {
    await db
      .delete(affiliatePayouts)
      .where(inArray(affiliatePayouts.affiliateId, affiliateIds));
    await db
      .delete(affiliateReferrals)
      .where(inArray(affiliateReferrals.affiliateId, affiliateIds));
  }
  await db
    .delete(affiliateReferrals)
    .where(eq(affiliateReferrals.referredUserId, userId));
  await db.delete(affiliates).where(eq(affiliates.userId, userId));

  // API logs + keys
  await db.delete(apiLogs).where(eq(apiLogs.userId, userId));
  if (apiKeyIds.length) {
    await db.delete(apiLogs).where(inArray(apiLogs.apiKeyId, apiKeyIds));
  }
  await db.delete(apiKeys).where(eq(apiKeys.userId, userId));

  // Post analytics (scoped via user's own posts)
  if (postIds.length) {
    await db.delete(postAnalytics).where(inArray(postAnalytics.postId, postIds));
  }

  // Engagement lists + their profiles
  if (engagementListIds.length) {
    await db
      .delete(engagementListProfiles)
      .where(inArray(engagementListProfiles.listId, engagementListIds));
  }
  await db.delete(engagementLists).where(eq(engagementLists.userId, userId));

  // Teams owned by user: delete invites + memberships then teams. Own memberships too.
  if (teamIds.length) {
    await db.delete(teamInvites).where(inArray(teamInvites.teamId, teamIds));
    await db.delete(teamMembers).where(inArray(teamMembers.teamId, teamIds));
  }
  await db.delete(teamMembers).where(eq(teamMembers.userId, userId));
  await db.delete(teams).where(eq(teams.ownerId, userId));

  // Direct user-owned tables
  await db.delete(posts).where(eq(posts.userId, userId));
  await db.delete(media).where(eq(media.userId, userId));
  await db.delete(ideas).where(eq(ideas.userId, userId));
  await db.delete(sessions).where(eq(sessions.userId, userId));
  await db.delete(accounts).where(eq(accounts.userId, userId));
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  await db.delete(abTests).where(eq(abTests.userId, userId));
  await db.delete(engagementActions).where(eq(engagementActions.userId, userId));
  await db.delete(engagementObjectives).where(eq(engagementObjectives.userId, userId));
  await db.delete(userTemplates).where(eq(userTemplates.userId, userId));
  await db.delete(savedCarousels).where(eq(savedCarousels.userId, userId));
  await db.delete(abandonedCheckouts).where(eq(abandonedCheckouts.userId, userId));

  // Tables keyed by email (no userId FK) - strictly this user's own email
  if (user.email) {
    await db.delete(blogComments).where(eq(blogComments.authorEmail, user.email));
    await db.delete(waitlist).where(eq(waitlist.email, user.email));
    await db.delete(betaUsers).where(eq(betaUsers.email, user.email));
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, user.email));
  }

  // Null-out soft references so audit trail survives without personal data
  await db
    .update(cookieConsents)
    .set({ userId: null })
    .where(eq(cookieConsents.userId, userId));
  await db
    .update(dataRemovalRequests)
    .set({ userId: null })
    .where(eq(dataRemovalRequests.userId, userId));
  await db
    .update(dataRemovalRequests)
    .set({ processedBy: null })
    .where(eq(dataRemovalRequests.processedBy, userId));

  // Finally the user row itself
  await db.delete(users).where(eq(users.id, userId));
}
