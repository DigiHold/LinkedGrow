import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, postAnalytics, users } from "@/lib/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
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
} from "@/lib/linkedin";

interface PostAnalyticsData {
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

// GET /api/analytics
export async function GET(request: NextRequest) {
  const logs: string[] = [];
  const log = (msg: string) => { logs.push(msg); console.log(`[Analytics] ${msg}`); };

  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const advanced = searchParams.get("advanced") === "true";

    const userPlan = (user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "analytics")) {
      return NextResponse.json({ error: "Analytics requires Pro plan or higher" }, { status: 403 });
    }

    if (advanced && !canAccessFeature(userPlan, "advancedAnalytics")) {
      return NextResponse.json({ error: "Advanced analytics requires Business plan" }, { status: 403 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    const postingTarget = user.linkedinPostingTarget as "profile" | "organization" | null;
    const hasLinkedInConnected = !!(user.linkedinAccessToken && user.linkedinProfileId);
    const capabilities = getAnalyticsCapabilities(postingTarget);

    // Use community token (has analytics scopes), fallback to poster token
    const accessToken = user.linkedinCommunityAccessToken || user.linkedinAccessToken;

    log(`User: ${user.email}, Plan: ${user.plan}, Target: ${postingTarget}`);
    log(`HasLinkedIn: ${hasLinkedInConnected}, HasCommunityToken: ${!!user.linkedinCommunityAccessToken}`);
    log(`Days: ${days}, Advanced: ${advanced}`);

    // Initialize
    let totalImpressions = 0;
    let totalReactions = 0;
    let totalComments = 0;
    let totalShares = 0;
    let followerCount: number | undefined;
    let followersGained: number | undefined;
    let membersReached: number | undefined;
    let followerGrowth: Array<{ date: string; count: number }> | undefined;
    let pageViews: number | undefined;
    let uniqueVisitors: number | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let followerDemographics: any;

    // Fetch all posts directly from LinkedIn (not from DB)
    const allLinkedInPosts: PostAnalyticsData[] = [];
    const linkedinPostAnalytics = new Map<string, MemberPostAnalytics>();

    if (hasLinkedInConnected && accessToken) {
      const isOrg = postingTarget === "organization" && user.linkedinSelectedOrgId;
      const authorUrn = isOrg
        ? `urn:li:organization:${user.linkedinSelectedOrgId}`
        : `urn:li:person:${user.linkedinProfileId}`;

      log(`Fetching posts for author: ${authorUrn}`);

      // Step 1: Fetch all posts from LinkedIn Posts API
      try {
        const postsResult = await getPostsByAuthor(accessToken, authorUrn, 50);
        log(`Fetched ${postsResult.posts.length} posts from LinkedIn`);

        // Collect image URNs for batch download
        const imageUrns: string[] = [];
        for (const post of postsResult.posts) {
          if (post.mediaId?.includes("urn:li:image:")) {
            imageUrns.push(post.mediaId);
          }
        }

        // Batch fetch image URLs (LinkedIn CDN, not R2)
        const imageDownloadUrls = imageUrns.length > 0
          ? await getImageDownloadUrls(accessToken, imageUrns).catch((err) => {
              log(`Image batch fetch failed: ${err}`);
              return new Map<string, string>();
            })
          : new Map<string, string>();

        log(`Got ${imageDownloadUrls.size} image URLs`);

        // Build post list
        for (const post of postsResult.posts) {
          if (post.lifecycleState !== "PUBLISHED") continue;

          let postType: "text" | "image" | "carousel" | "video" = "text";
          if (post.mediaType === "video") postType = "video";
          else if (post.mediaType === "document") postType = "carousel";
          else if (post.mediaType === "image" || post.mediaType === "multiImage" || post.mediaType === "article") postType = "image";

          allLinkedInPosts.push({
            id: post.id,
            content: post.commentary?.substring(0, 200) || null,
            postType,
            status: "published",
            publishedAt: new Date(post.publishedAt).toISOString(),
            createdAt: new Date(post.createdAt).toISOString(),
            linkedinPostId: post.id,
            linkedinPostUrl: `https://www.linkedin.com/feed/update/${post.id}/`,
            linkedinImageUrl: post.mediaId ? imageDownloadUrls.get(post.mediaId) : undefined,
            syncedFromLinkedin: true,
          });
        }
      } catch (err) {
        log(`Failed to fetch posts from LinkedIn: ${err}`);
      }

      // Step 2: Fetch aggregated analytics
      try {
        if (isOrg) {
          // Organization analytics
          const orgId = user.linkedinSelectedOrgId!;
          log(`Fetching org analytics for: ${orgId}`);

          const orgStats = await getOrganizationFollowerCount(accessToken, orgId);
          if (orgStats) {
            followerCount = orgStats.followerCount;
            followersGained = orgStats.followerGrowth?.totalCount;
            log(`Org followers: ${followerCount}, gained: ${followersGained}`);
          } else {
            log(`Org follower count returned null`);
          }

          // Org share statistics for posts we fetched
          const postUrns = allLinkedInPosts
            .map(p => p.linkedinPostId)
            .filter((id): id is string => !!id)
            .slice(0, 20);

          if (postUrns.length > 0) {
            try {
              const orgShareStats = await getOrganizationShareStatistics(
                accessToken, orgId, postUrns, { start: startDate, end: endDate }
              );
              log(`Got org share stats for ${orgShareStats.size} posts`);

              orgShareStats.forEach((stats, urn) => {
                totalImpressions += stats.impressions;
                totalReactions += stats.likes;
                totalComments += stats.comments;
                totalShares += stats.shares;
                linkedinPostAnalytics.set(urn, {
                  postUrn: urn,
                  impressions: stats.impressions,
                  membersReached: 0,
                  reactions: stats.likes,
                  comments: stats.comments,
                  reshares: stats.shares,
                });
              });
            } catch (err) {
              log(`Org share stats failed: ${err}`);
            }
          }

          // Advanced org analytics
          if (advanced) {
            try {
              const pageStats = await getOrganizationPageStatistics(accessToken, orgId, { start: startDate, end: endDate });
              if (pageStats) {
                pageViews = pageStats.pageViews;
                uniqueVisitors = pageStats.uniqueVisitors;
                log(`Page views: ${pageViews}, visitors: ${uniqueVisitors}`);
              }
            } catch (err) {
              log(`Org page stats failed: ${err}`);
            }

            try {
              const demographics = await getOrganizationFollowerDemographics(accessToken, orgId);
              if (demographics) followerDemographics = demographics;
              log(`Demographics: ${demographics ? 'yes' : 'no'}`);
            } catch (err) {
              log(`Org demographics failed: ${err}`);
            }
          }
        } else {
          // Personal profile analytics
          log(`Fetching member analytics`);

          try {
            const memberAnalytics = await getMemberAggregatedAnalytics(accessToken, { start: startDate, end: endDate });
            if (memberAnalytics) {
              totalImpressions = memberAnalytics.totalImpressions;
              totalReactions = memberAnalytics.totalReactions;
              totalComments = memberAnalytics.totalComments;
              totalShares = memberAnalytics.totalReshares;
              membersReached = memberAnalytics.totalMembersReached;
              log(`Aggregated: imp=${totalImpressions} react=${totalReactions} comm=${totalComments} share=${totalShares} reached=${membersReached}`);
            } else {
              log(`getMemberAggregatedAnalytics returned null`);
            }
          } catch (err) {
            log(`getMemberAggregatedAnalytics failed: ${err}`);
          }

          // Per-post analytics for top posts
          const postUrns = allLinkedInPosts
            .map(p => p.linkedinPostId)
            .filter((id): id is string => !!id)
            .slice(0, 10);

          if (postUrns.length > 0) {
            try {
              const perPostAnalytics = await getMemberAllPostsAnalytics(accessToken, { start: startDate, end: endDate }, postUrns);
              log(`Got per-post analytics for ${perPostAnalytics.length} posts`);
              perPostAnalytics.forEach((ps) => {
                linkedinPostAnalytics.set(ps.postUrn, ps);
                log(`  Post ${ps.postUrn.slice(-10)}: imp=${ps.impressions} react=${ps.reactions}`);
              });
            } catch (err) {
              log(`Per-post analytics failed: ${err}`);
            }
          }

          // Follower count
          try {
            const memberFollowers = await getMemberFollowerCount(accessToken);
            if (memberFollowers !== null) followerCount = memberFollowers;
            log(`Follower count: ${followerCount}`);
          } catch (err) {
            log(`Follower count failed: ${err}`);
          }

          // Follower growth time-series
          try {
            const followerStats = await getMemberFollowerStats(accessToken, { start: startDate, end: endDate });
            if (followerStats?.followersByDateRange) {
              followersGained = followerStats.followersByDateRange.reduce((sum: number, day: { count: number }) => sum + day.count, 0);
              followerGrowth = followerStats.followersByDateRange;
              log(`Follower growth: ${followersGained} gained, ${followerGrowth.length} data points`);
            }
          } catch (err) {
            log(`Follower stats failed: ${err}`);
          }
        }
      } catch (err) {
        log(`LinkedIn analytics section failed: ${err}`);
      }
    } else {
      log(`No LinkedIn connection or token - skipping API calls`);
    }

    // Attach analytics to posts
    const postsWithAnalytics: PostAnalyticsData[] = allLinkedInPosts.map((post) => {
      if (post.linkedinPostId) {
        const stats = linkedinPostAnalytics.get(post.linkedinPostId);
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
      return post;
    });

    // Sort by impressions and take top 10
    const top10Posts = postsWithAnalytics
      .filter(p => p.analytics)
      .sort((a, b) => (b.analytics?.impressions || 0) - (a.analytics?.impressions || 0))
      .slice(0, 10);

    // Also include posts without analytics (up to 10 total)
    const postsWithoutAnalytics = postsWithAnalytics.filter(p => !p.analytics).slice(0, Math.max(0, 10 - top10Posts.length));
    const finalPosts = [...top10Posts, ...postsWithoutAnalytics];

    log(`Final: ${finalPosts.length} posts (${top10Posts.length} with analytics)`);

    // Calculate engagement rate
    const totalEngagements = totalReactions + totalComments + totalShares;
    const avgEngagement = totalImpressions > 0
      ? ((totalEngagements / totalImpressions) * 100).toFixed(2)
      : "0.00";

    // Best posting times from posts that have analytics
    const bestPostingTimes = calculateBestPostingTimes(top10Posts);

    // Build response
    const response: Record<string, unknown> = {
      summary: {
        totalPosts: allLinkedInPosts.length,
        totalImpressions,
        totalReactions,
        totalComments,
        totalShares,
        avgEngagement,
        followerCount,
        followersGained,
        membersReached,
      },
      posts: finalPosts,
      followerGrowth,
      capabilities: {
        ...capabilities,
        hasLinkedInConnected,
        postingTarget,
      },
      linkedinData: hasLinkedInConnected ? {
        source: "linkedin_api",
        fetchedAt: new Date().toISOString(),
      } : undefined,
      _logs: logs, // Include logs in response for debugging
    };

    // Advanced data
    if (advanced) {
      const postTypeStats: Record<string, { count: number; totalEngagement: number }> = {};
      postsWithAnalytics.forEach((post) => {
        const type = post.postType || "text";
        if (!postTypeStats[type]) postTypeStats[type] = { count: 0, totalEngagement: 0 };
        postTypeStats[type].count++;
        if (post.analytics) {
          const eng = post.analytics.impressions > 0
            ? ((post.analytics.reactions + post.analytics.comments + post.analytics.reshares) / post.analytics.impressions) * 100
            : 0;
          postTypeStats[type].totalEngagement += eng;
        }
      });

      response.advanced = {
        postTypePerformance: Object.entries(postTypeStats).map(([type, stats]) => ({
          type,
          count: stats.count,
          avgEngagement: stats.count > 0 ? (stats.totalEngagement / stats.count).toFixed(2) : "0",
        })),
        engagementTrend: [],
        bestPostingTimes,
        postingTimeHeatmap: calculatePostingTimeHeatmap(postsWithAnalytics),
        pageViews,
        uniqueVisitors,
        followerDemographics,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log(`FATAL ERROR: ${msg}`);
    console.error("Analytics route error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics", _logs: logs }, { status: 500 });
  }
}

function calculateBestPostingTimes(posts: PostAnalyticsData[]): {
  bestDay: string;
  bestHour: string;
  insight: string;
} | undefined {
  const postsWithData = posts.filter(p => p.analytics && p.publishedAt);
  if (postsWithData.length < 3) return undefined;

  const dayStats: Record<number, { totalEngagement: number; count: number }> = {};
  const hourStats: Record<number, { totalEngagement: number; count: number }> = {};
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  postsWithData.forEach((post) => {
    if (!post.publishedAt || !post.analytics) return;
    const date = new Date(post.publishedAt);
    const day = date.getDay();
    const hour = date.getHours();
    const engagement = post.analytics.impressions > 0
      ? ((post.analytics.reactions + post.analytics.comments + post.analytics.reshares) / post.analytics.impressions) * 100
      : 0;

    if (!dayStats[day]) dayStats[day] = { totalEngagement: 0, count: 0 };
    dayStats[day].totalEngagement += engagement;
    dayStats[day].count++;

    if (!hourStats[hour]) hourStats[hour] = { totalEngagement: 0, count: 0 };
    hourStats[hour].totalEngagement += engagement;
    hourStats[hour].count++;
  });

  let bestDay = 2;
  let bestDayAvg = 0;
  Object.entries(dayStats).forEach(([day, stats]) => {
    const avg = stats.count > 0 ? stats.totalEngagement / stats.count : 0;
    if (avg > bestDayAvg) { bestDayAvg = avg; bestDay = parseInt(day); }
  });

  let bestHour = 10;
  let bestHourAvg = 0;
  Object.entries(hourStats).forEach(([hour, stats]) => {
    const avg = stats.count > 0 ? stats.totalEngagement / stats.count : 0;
    if (avg > bestHourAvg) { bestHourAvg = avg; bestHour = parseInt(hour); }
  });

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 || 12;
    return `${h}:00 ${ampm}`;
  };

  return {
    bestDay: dayNames[bestDay],
    bestHour: formatHour(bestHour),
    insight: `Your audience engages most on ${dayNames[bestDay]}s around ${formatHour(bestHour)}`,
  };
}

function calculatePostingTimeHeatmap(
  posts: PostAnalyticsData[]
): Array<{ day: number; hour: number; avgEngagement: number; postCount: number }> {
  const grid: Record<string, { totalEngagement: number; count: number }> = {};

  posts.forEach((post) => {
    if (!post.publishedAt || !post.analytics) return;
    const date = new Date(post.publishedAt);
    const day = date.getDay();
    const hour = date.getHours();
    const key = `${day}-${hour}`;
    const engagement = post.analytics.impressions > 0
      ? ((post.analytics.reactions + post.analytics.comments + post.analytics.reshares) / post.analytics.impressions) * 100
      : 0;
    if (!grid[key]) grid[key] = { totalEngagement: 0, count: 0 };
    grid[key].totalEngagement += engagement;
    grid[key].count++;
  });

  return Object.entries(grid).map(([key, data]) => {
    const [day, hour] = key.split("-").map(Number);
    return {
      day,
      hour,
      avgEngagement: data.count > 0 ? parseFloat((data.totalEngagement / data.count).toFixed(2)) : 0,
      postCount: data.count,
    };
  });
}
