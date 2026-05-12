import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import {
  db,
  users,
  sessions,
  accounts,
  posts,
  media,
  ideas,
  abTests,
  teams,
  teamMembers,
  teamInvites,
  apiKeys,
  apiLogs,
  postAnalytics,
  engagementActions,
  engagementObjectives,
  networkNotificationGroups,
  networkNotificationMembers,
  networkNotificationPosts,
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
} from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

// GDPR Article 20 - right to data portability.
// Returns a JSON file containing every piece of personal data stored
// about the authenticated user. Password-gated so a stolen session alone
// can't trigger an export.
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3 exports per hour per user (it's an expensive query)
    const limit = rateLimit(`user-export:${session.user.id}:${getClientIP(request)}`, {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many export requests. Try again later." },
        { status: 429 }
      );
    }

    const reqBody = await request.json();
    const { password } = reqBody;

    const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user has a password (credentials auth), verify it.
    // If no password (OAuth-only), allow without - they already proved identity via provider.
    if (user.password) {
      if (!password || typeof password !== "string") {
        return NextResponse.json({ error: "Password is required" }, { status: 400 });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
      }
    }

    const userId = user.id;

    // Strip secrets from the user profile before exporting.
    const {
      password: _pw,
      twoFactorSecret: _tfa,
      openaiApiKey: _k1,
      anthropicApiKey: _k2,
      googleApiKey: _k3,
      grokApiKey: _k4,
      perplexityApiKey: _k5,
      kimiApiKey: _k6,
      googleImageApiKey: _k7,
      openaiImageApiKey: _k8,
      replicateImageApiKey: _k9,
      linkedinAccessToken: _lt1,
      linkedinRefreshToken: _lt2,
      ...userProfile
    } = user;
    void _pw; void _tfa; void _k1; void _k2; void _k3; void _k4; void _k5;
    void _k6; void _k7; void _k8; void _k9; void _lt1; void _lt2;

    const [
      userPosts,
      userMedia,
      userIdeas,
      userSessions,
      userAccounts,
      userAbTests,
      ownedTeams,
      userTeamMemberships,
      userApiKeys,
      userApiLogs,
      userEngagementActions,
      userEngagementObjectives,
      ownedNotificationGroups,
      userNotificationMemberships,
      userAbandonedCheckouts,
      userCookieConsents,
      userRemovalRequests,
      userSavedTemplates,
      userSavedCarousels,
      userAffiliateRow,
      userAffiliateRefs,
      userComments,
    ] = await Promise.all([
      db.select().from(posts).where(eq(posts.userId, userId)),
      db.select().from(media).where(eq(media.userId, userId)),
      db.select().from(ideas).where(eq(ideas.userId, userId)),
      db.select().from(sessions).where(eq(sessions.userId, userId)),
      db.select().from(accounts).where(eq(accounts.userId, userId)),
      db.select().from(abTests).where(eq(abTests.userId, userId)),
      db.select().from(teams).where(eq(teams.ownerId, userId)),
      db.select().from(teamMembers).where(eq(teamMembers.userId, userId)),
      db.select().from(apiKeys).where(eq(apiKeys.userId, userId)),
      db.select().from(apiLogs).where(eq(apiLogs.userId, userId)),
      db.select().from(engagementActions).where(eq(engagementActions.userId, userId)),
      db.select().from(engagementObjectives).where(eq(engagementObjectives.userId, userId)),
      db.select().from(networkNotificationGroups).where(eq(networkNotificationGroups.ownerId, userId)),
      db.select().from(networkNotificationMembers).where(eq(networkNotificationMembers.userId, userId)),
      db.select().from(abandonedCheckouts).where(eq(abandonedCheckouts.userId, userId)),
      db.select().from(cookieConsents).where(eq(cookieConsents.userId, userId)),
      db.select().from(dataRemovalRequests).where(eq(dataRemovalRequests.userId, userId)),
      db.select().from(userTemplates).where(eq(userTemplates.userId, userId)),
      db.select().from(savedCarousels).where(eq(savedCarousels.userId, userId)),
      db.select().from(affiliates).where(eq(affiliates.userId, userId)),
      db.select().from(affiliateReferrals).where(eq(affiliateReferrals.referredUserId, userId)),
      user.email ? db.select().from(blogComments).where(eq(blogComments.authorEmail, user.email)) : Promise.resolve([]),
    ]);

    const [userWaitlist, userBeta] = user.email
      ? await Promise.all([
          db.select().from(waitlist).where(eq(waitlist.email, user.email)),
          db.select().from(betaUsers).where(eq(betaUsers.email, user.email)),
        ])
      : [[], []];

    // Drill one level deeper for rows we own but whose children aren't keyed by userId.
    const teamIds = ownedTeams.map((t) => t.id);
    const apiKeyIds = userApiKeys.map((k) => k.id);
    const affiliateIds = userAffiliateRow.map((a) => a.id);

    const postIds = userPosts.map((p) => p.id);
    const notificationGroupIds = ownedNotificationGroups.map((g) => g.id);

    const [
      ownedTeamMembers,
      ownedTeamInvites,
      postAnalyticsRows,
      affiliateCommissionRows,
      affiliatePayoutRows,
      ownedNotificationGroupPosts,
      ownedNotificationGroupMembers,
      userAffiliateRefsAsAffiliate,
    ] = await Promise.all([
      teamIds.length
        ? db.select().from(teamMembers).where(inArray(teamMembers.teamId, teamIds))
        : Promise.resolve([]),
      teamIds.length
        ? db.select().from(teamInvites).where(inArray(teamInvites.teamId, teamIds))
        : Promise.resolve([]),
      postIds.length
        ? db.select().from(postAnalytics).where(inArray(postAnalytics.postId, postIds))
        : Promise.resolve([]),
      affiliateIds.length
        ? db
            .select()
            .from(affiliateCommissions)
            .where(inArray(affiliateCommissions.affiliateId, affiliateIds))
        : Promise.resolve([]),
      affiliateIds.length
        ? db
            .select()
            .from(affiliatePayouts)
            .where(inArray(affiliatePayouts.affiliateId, affiliateIds))
        : Promise.resolve([]),
      notificationGroupIds.length
        ? db
            .select()
            .from(networkNotificationPosts)
            .where(inArray(networkNotificationPosts.groupId, notificationGroupIds))
        : Promise.resolve([]),
      notificationGroupIds.length
        ? db
            .select()
            .from(networkNotificationMembers)
            .where(inArray(networkNotificationMembers.groupId, notificationGroupIds))
        : Promise.resolve([]),
      affiliateIds.length
        ? db
            .select()
            .from(affiliateReferrals)
            .where(inArray(affiliateReferrals.affiliateId, affiliateIds))
        : Promise.resolve([]),
    ]);

    // Redact secrets from api_keys (keyHash is a SHA-256 hash, but still not needed in an export)
    const safeApiKeys = userApiKeys.map(({ keyHash, ...rest }) => {
      void keyHash;
      return rest;
    });

    // Redact OAuth tokens from linked accounts
    const safeAccounts = userAccounts.map(({ access_token, refresh_token, id_token, ...rest }) => {
      void access_token; void refresh_token; void id_token;
      return rest;
    });

    const dataExport = {
      exportedAt: new Date().toISOString(),
      format: "LinkedGrow GDPR export v1",
      notes: "Encrypted API keys, password hash, 2FA secrets, OAuth tokens are redacted.",
      profile: userProfile,
      posts: userPosts,
      media: userMedia,
      ideas: userIdeas,
      sessions: userSessions,
      accounts: safeAccounts,
      abTests: userAbTests,
      teams: {
        owned: ownedTeams,
        memberships: userTeamMemberships,
        membersInOwnedTeams: ownedTeamMembers,
        invitesInOwnedTeams: ownedTeamInvites,
      },
      api: {
        keys: safeApiKeys,
        logs: userApiLogs,
      },
      analytics: postAnalyticsRows,
      engagement: {
        actions: userEngagementActions,
        objectives: userEngagementObjectives,
      },
      networkNotifications: {
        ownedGroups: ownedNotificationGroups,
        memberships: userNotificationMemberships,
        postsInOwnedGroups: ownedNotificationGroupPosts,
        membersInOwnedGroups: ownedNotificationGroupMembers,
      },
      billing: {
        abandonedCheckouts: userAbandonedCheckouts,
      },
      affiliate: {
        record: userAffiliateRow,
        referralsAsReferred: userAffiliateRefs,
        referralsAsAffiliate: userAffiliateRefsAsAffiliate,
        commissions: affiliateCommissionRows,
        payouts: affiliatePayoutRows,
      },
      consents: userCookieConsents,
      dataRemovalRequests: userRemovalRequests,
      savedTemplates: userSavedTemplates,
      savedCarousels: userSavedCarousels,
      blogComments: userComments,
      waitlist: userWaitlist,
      betaUsers: userBeta,
    };

    const body = JSON.stringify(dataExport, null, 2);
    const filename = `linkedgrow-export-${userId}-${Date.now()}.json`;

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[user-export] Failed:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
