import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { canAccessFeature } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import {
  getAnalyticsCapabilities,
  getMemberAggregatedAnalytics,
  getMemberAllPostsAnalytics,
  getMemberFollowerCount,
  getMemberFollowersGained,
  getMemberFollowerStats,
  getPostsByAuthor,
  getImageDownloadUrls,
  getOrganizationFollowerCount,
  getOrganizationShareStatistics,
  getOrganizationPageStatistics,
  getOrganizationFollowerDemographics,
  type MemberPostAnalytics,
  type LinkedInAuthorPost,
} from "@/lib/linkedin";

interface PostData {
  id: string;
  content: string | null;
  postType: string | null;
  status: string | null;
  publishedAt: string | null;
  createdAt: string | null;
  linkedinPostId?: string | null;
  linkedinPostUrl?: string | null;
  linkedinImageUrl?: string | null;
  syncedFromLinkedin?: boolean;
  analytics?: {
    impressions: number;
    reactions: number;
    comments: number;
    reshares: number;
    membersReached?: number;
  };
}

export async function GET(request: NextRequest) {
  const logs: string[] = [];
  const log = (msg: string) => { logs.push(msg); console.log(`[Analytics] ${msg}`); };

  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [user] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const advanced = searchParams.get("advanced") === "true";

    const userPlan = (user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "analytics")) return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
    if (advanced && !canAccessFeature(userPlan, "advancedAnalytics")) return NextResponse.json({ error: "Business plan required" }, { status: 403 });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const postingTarget = user.linkedinPostingTarget as "profile" | "organization" | null;
    const hasLinkedIn = !!(user.linkedinAccessToken && user.linkedinProfileId);
    const capabilities = getAnalyticsCapabilities(postingTarget);
    const token = user.linkedinCommunityAccessToken || user.linkedinAccessToken;
    const isOrg = postingTarget === "organization" && user.linkedinSelectedOrgId;

    log(`User: ${user.email} | Plan: ${user.plan} | Target: ${postingTarget} | Org: ${isOrg ? user.linkedinSelectedOrgId : 'no'}`);
    log(`CommunityToken: ${!!user.linkedinCommunityAccessToken} | PosterToken: ${!!user.linkedinAccessToken}`);

    let totalImpressions = 0, totalReactions = 0, totalComments = 0, totalShares = 0;
    let followerCount: number | undefined, followersGained: number | undefined, membersReached: number | undefined;
    let followerGrowth: Array<{ date: string; count: number }> | undefined;
    let pageViews: number | undefined, uniqueVisitors: number | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let followerDemographics: any;

    const allPosts: PostData[] = [];
    const postAnalyticsMap = new Map<string, MemberPostAnalytics>();

    if (!hasLinkedIn || !token) {
      log(`No LinkedIn connection`);
      return NextResponse.json({
        summary: { totalPosts: 0, totalImpressions: 0, totalReactions: 0, totalComments: 0, totalShares: 0, avgEngagement: "0.00" },
        posts: [], capabilities: { ...capabilities, hasLinkedInConnected: false, postingTarget }, _logs: logs,
      });
    }

    // ===========================
    // ORGANIZATION PATH
    // ===========================
    if (isOrg) {
      const orgId = user.linkedinSelectedOrgId!;
      const orgUrn = `urn:li:organization:${orgId}`;

      // 1. Fetch ALL posts from LinkedIn (org has r_organization_social)
      try {
        const result = await getPostsByAuthor(token, orgUrn, 100);
        log(`Org posts fetched: ${result.posts.length}`);

        // Get image URLs
        const imageUrns = result.posts.filter(p => p.mediaId?.includes("urn:li:image:")).map(p => p.mediaId!);
        const imageUrls = imageUrns.length > 0
          ? await getImageDownloadUrls(token, imageUrns).catch(() => new Map<string, string>())
          : new Map<string, string>();
        log(`Image URLs: ${imageUrls.size}`);

        for (const p of result.posts) {
          if (p.lifecycleState !== "PUBLISHED") continue;
          const published = new Date(p.publishedAt);
          if (published < startDate) continue;

          let postType: "text" | "image" | "carousel" | "video" = "text";
          if (p.mediaType === "video") postType = "video";
          else if (p.mediaType === "document") postType = "carousel";
          else if (p.mediaType === "image" || p.mediaType === "multiImage" || p.mediaType === "article") postType = "image";

          allPosts.push({
            id: p.id,
            content: p.commentary?.substring(0, 200) || null,
            postType,
            status: "published",
            publishedAt: published.toISOString(),
            createdAt: new Date(p.createdAt).toISOString(),
            linkedinPostId: p.id,
            linkedinPostUrl: `https://www.linkedin.com/feed/update/${p.id}/`,
            linkedinImageUrl: p.mediaId ? imageUrls.get(p.mediaId) : undefined,
            syncedFromLinkedin: true,
          });
        }
      } catch (err) {
        log(`Org posts fetch FAILED: ${err}`);
      }

      // 2. Org share statistics (impressions per post)
      const postUrns = allPosts.map(p => p.linkedinPostId).filter((id): id is string => !!id).slice(0, 50);
      if (postUrns.length > 0) {
        try {
          const stats = await getOrganizationShareStatistics(token, orgId, postUrns, { start: startDate, end: new Date() });
          log(`Org share stats: ${stats.size} posts`);
          stats.forEach((s, urn) => {
            totalImpressions += s.impressions;
            totalReactions += s.likes;
            totalComments += s.comments;
            totalShares += s.shares;
            postAnalyticsMap.set(urn, { postUrn: urn, impressions: s.impressions, membersReached: 0, reactions: s.likes, comments: s.comments, reshares: s.shares });
          });
        } catch (err) { log(`Org share stats FAILED: ${err}`); }
      }

      // 3. Follower count
      try {
        const orgStats = await getOrganizationFollowerCount(token, orgId);
        if (orgStats) { followerCount = orgStats.followerCount; followersGained = orgStats.followerGrowth?.totalCount; }
        log(`Org followers: ${followerCount}, gained: ${followersGained}`);
      } catch (err) { log(`Org followers FAILED: ${err}`); }

      // 4. Advanced
      if (advanced) {
        try {
          const ps = await getOrganizationPageStatistics(token, orgId, { start: startDate, end: new Date() });
          if (ps) { pageViews = ps.pageViews; uniqueVisitors = ps.uniqueVisitors; }
          log(`Page stats: views=${pageViews} visitors=${uniqueVisitors}`);
        } catch (err) { log(`Org page stats FAILED: ${err}`); }

        try {
          const demo = await getOrganizationFollowerDemographics(token, orgId);
          if (demo) followerDemographics = demo;
          log(`Demographics: ${demo ? 'yes' : 'no'}`);
        } catch (err) { log(`Org demographics FAILED: ${err}`); }
      }

    // ===========================
    // PERSONAL PROFILE PATH
    // ===========================
    } else {
      // For personal profiles: no r_member_social = can't list posts from API
      // Use DB posts (created through LinkedGrow) + aggregated analytics from r_member_postAnalytics

      // 1. Get posts from local DB
      const dbPosts = await db.query.posts.findMany({
        where: and(eq(posts.userId, user.id), gte(posts.createdAt, startDate)),
        orderBy: desc(posts.createdAt),
      });
      log(`DB posts: ${dbPosts.length}`);

      for (const p of dbPosts) {
        if (p.status !== "published") continue;
        allPosts.push({
          id: p.id,
          content: p.content?.substring(0, 200) || null,
          postType: p.postType,
          status: p.status,
          publishedAt: p.publishedAt?.toISOString() || null,
          createdAt: p.createdAt?.toISOString() || null,
          linkedinPostId: p.linkedinPostId,
          linkedinPostUrl: p.linkedinPostUrl,
          linkedinImageUrl: p.linkedinImageUrl,
          syncedFromLinkedin: p.syncedFromLinkedin ?? false,
        });
      }

      // 2. Aggregated analytics (r_member_postAnalytics - works for all member posts)
      try {
        const agg = await getMemberAggregatedAnalytics(token, { start: startDate, end: new Date() });
        if (agg) {
          totalImpressions = agg.totalImpressions;
          totalReactions = agg.totalReactions;
          totalComments = agg.totalComments;
          totalShares = agg.totalReshares;
          membersReached = agg.totalMembersReached;
          log(`Aggregated: imp=${totalImpressions} react=${totalReactions} comm=${totalComments} share=${totalShares}`);
        } else {
          log(`Aggregated analytics returned null`);
        }
      } catch (err) { log(`Aggregated analytics FAILED: ${err}`); }

      // 3. Per-post analytics for DB posts that have linkedinPostId
      const postUrns = allPosts.map(p => p.linkedinPostId).filter((id): id is string => !!id).slice(0, 10);
      if (postUrns.length > 0) {
        try {
          const perPost = await getMemberAllPostsAnalytics(token, { start: startDate, end: new Date() }, postUrns);
          log(`Per-post analytics: ${perPost.length} posts`);
          perPost.forEach(ps => {
            postAnalyticsMap.set(ps.postUrn, ps);
            log(`  ${ps.postUrn.slice(-8)}: imp=${ps.impressions} react=${ps.reactions} comm=${ps.comments}`);
          });
        } catch (err) { log(`Per-post analytics FAILED: ${err}`); }
      } else {
        log(`No post URNs for per-post analytics`);
      }

      // 4. Follower count
      try {
        const fc = await getMemberFollowerCount(token);
        if (fc !== null) followerCount = fc;
        log(`Followers: ${followerCount}`);
      } catch (err) { log(`Follower count FAILED: ${err}`); }

      // 5. Follower growth
      try {
        const fs = await getMemberFollowerStats(token, { start: startDate, end: new Date() });
        if (fs?.followersByDateRange) {
          followersGained = fs.followersByDateRange.reduce((sum: number, d: { count: number }) => sum + d.count, 0);
          followerGrowth = fs.followersByDateRange;
          log(`Follower growth: ${followersGained} gained, ${followerGrowth.length} points`);
        }
      } catch (err) { log(`Follower growth FAILED: ${err}`); }
    }

    // ===========================
    // BUILD RESPONSE
    // ===========================

    // Attach analytics to posts
    for (const post of allPosts) {
      if (post.linkedinPostId) {
        const stats = postAnalyticsMap.get(post.linkedinPostId);
        if (stats) {
          post.analytics = {
            impressions: stats.impressions,
            reactions: stats.reactions,
            comments: stats.comments,
            reshares: stats.reshares,
            membersReached: stats.membersReached,
          };
        }
      }
    }

    // Top 10 posts by impressions (with analytics), plus fill to 10 without
    const withAnalytics = allPosts.filter(p => p.analytics).sort((a, b) => (b.analytics?.impressions || 0) - (a.analytics?.impressions || 0));
    const withoutAnalytics = allPosts.filter(p => !p.analytics);
    const top10 = [...withAnalytics.slice(0, 10), ...withoutAnalytics.slice(0, Math.max(0, 10 - withAnalytics.length))];

    const totalEngagements = totalReactions + totalComments + totalShares;
    const avgEngagement = totalImpressions > 0 ? ((totalEngagements / totalImpressions) * 100).toFixed(2) : "0.00";

    log(`RESULT: ${allPosts.length} total posts, ${withAnalytics.length} with analytics, returning ${top10.length}`);

    const response: Record<string, unknown> = {
      summary: {
        totalPosts: allPosts.length,
        totalImpressions,
        totalReactions,
        totalComments,
        totalShares,
        avgEngagement,
        followerCount,
        followersGained,
        membersReached,
      },
      posts: top10,
      followerGrowth,
      capabilities: { ...capabilities, hasLinkedInConnected: hasLinkedIn, postingTarget },
      linkedinData: { source: "linkedin_api", fetchedAt: new Date().toISOString() },
      _logs: logs,
    };

    // Advanced
    if (advanced) {
      const typeStats: Record<string, { count: number; totalEng: number }> = {};
      allPosts.forEach(p => {
        const t = p.postType || "text";
        if (!typeStats[t]) typeStats[t] = { count: 0, totalEng: 0 };
        typeStats[t].count++;
        if (p.analytics && p.analytics.impressions > 0) {
          typeStats[t].totalEng += ((p.analytics.reactions + p.analytics.comments + p.analytics.reshares) / p.analytics.impressions) * 100;
        }
      });

      response.advanced = {
        postTypePerformance: Object.entries(typeStats).map(([type, s]) => ({
          type, count: s.count, avgEngagement: s.count > 0 ? (s.totalEng / s.count).toFixed(2) : "0",
        })),
        engagementTrend: [],
        bestPostingTimes: calculateBestPostingTimes(withAnalytics),
        postingTimeHeatmap: calculateHeatmap(withAnalytics),
        pageViews,
        uniqueVisitors,
        followerDemographics,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    log(`FATAL: ${error}`);
    return NextResponse.json({ error: "Failed to fetch analytics", _logs: logs }, { status: 500 });
  }
}

function calculateBestPostingTimes(posts: PostData[]) {
  const valid = posts.filter(p => p.analytics && p.publishedAt);
  if (valid.length < 3) return undefined;

  const dayStats: Record<number, { total: number; count: number }> = {};
  const hourStats: Record<number, { total: number; count: number }> = {};
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  valid.forEach(p => {
    const d = new Date(p.publishedAt!);
    const eng = p.analytics!.impressions > 0 ? ((p.analytics!.reactions + p.analytics!.comments + p.analytics!.reshares) / p.analytics!.impressions) * 100 : 0;
    const day = d.getDay(), hour = d.getHours();
    if (!dayStats[day]) dayStats[day] = { total: 0, count: 0 };
    dayStats[day].total += eng; dayStats[day].count++;
    if (!hourStats[hour]) hourStats[hour] = { total: 0, count: 0 };
    hourStats[hour].total += eng; hourStats[hour].count++;
  });

  let bestDay = 2, bestDayAvg = 0;
  Object.entries(dayStats).forEach(([d, s]) => { const a = s.total / s.count; if (a > bestDayAvg) { bestDayAvg = a; bestDay = +d; } });
  let bestHour = 10, bestHourAvg = 0;
  Object.entries(hourStats).forEach(([h, s]) => { const a = s.total / s.count; if (a > bestHourAvg) { bestHourAvg = a; bestHour = +h; } });

  const fh = (h: number) => `${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}`;
  return { bestDay: days[bestDay], bestHour: fh(bestHour), insight: `Your audience engages most on ${days[bestDay]}s around ${fh(bestHour)}` };
}

function calculateHeatmap(posts: PostData[]) {
  const grid: Record<string, { total: number; count: number }> = {};
  posts.forEach(p => {
    if (!p.publishedAt || !p.analytics) return;
    const d = new Date(p.publishedAt);
    const key = `${d.getDay()}-${d.getHours()}`;
    const eng = p.analytics.impressions > 0 ? ((p.analytics.reactions + p.analytics.comments + p.analytics.reshares) / p.analytics.impressions) * 100 : 0;
    if (!grid[key]) grid[key] = { total: 0, count: 0 };
    grid[key].total += eng; grid[key].count++;
  });
  return Object.entries(grid).map(([k, v]) => {
    const [day, hour] = k.split("-").map(Number);
    return { day, hour, avgEngagement: +(v.total / v.count).toFixed(2), postCount: v.count };
  });
}
