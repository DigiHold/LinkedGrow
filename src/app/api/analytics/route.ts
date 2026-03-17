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
  getOrganizationFollowerCount,
  getOrganizationShareStatistics,
  getOrganizationPageStatistics,
  getOrganizationFollowerDemographics,
  type MemberPostAnalytics,
} from "@/lib/linkedin";

// Response types for the analytics API
interface AnalyticsSummary {
  totalPosts: number;
  totalImpressions: number;
  totalReactions: number;
  totalComments: number;
  totalShares: number;
  avgEngagement: string;
  followerCount?: number;
  followersGained?: number;
  membersReached?: number;
}

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

interface AnalyticsResponse {
  summary: AnalyticsSummary;
  posts: PostAnalyticsData[];
  followerGrowth?: Array<{ date: string; count: number }>;
  capabilities: {
    canFetchPostStats: boolean;
    canFetchFollowerCount: boolean;
    canFetchFollowerDemographics: boolean;
    canFetchPageViews: boolean;
    isOrganization: boolean;
    hasLinkedInConnected: boolean;
    postingTarget: "profile" | "organization" | null;
  };
  linkedinData?: {
    source: "linkedin_api";
    fetchedAt: string;
  };
  advanced?: {
    postTypePerformance: Array<{ type: string; count: number; avgEngagement: string }>;
    engagementTrend: Array<{ date: string; impressions: number; avgEngagement: string }>;
    bestPostingTimes?: {
      bestDay: string;
      bestHour: string;
      insight: string;
    };
    postingTimeHeatmap?: Array<{ day: number; hour: number; avgEngagement: number; postCount: number }>;
    pageViews?: number;
    uniqueVisitors?: number;
    followerDemographics?: {
      byCountry?: Array<{ country: string; count: number; percentage: number }>;
      byIndustry?: Array<{ industry: string; count: number; percentage: number }>;
      byFunction?: Array<{ function: string; count: number; percentage: number }>;
      bySeniority?: Array<{ seniority: string; count: number; percentage: number }>;
    };
  };
}

// GET /api/analytics - Get analytics data from LinkedIn and local database
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with LinkedIn tokens
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
    const refresh = searchParams.get("refresh") === "true"; // Force refresh from LinkedIn

    // Check if user has access to analytics
    const userPlan = (user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "analytics")) {
      return NextResponse.json(
        { error: "Analytics requires Pro plan or higher" },
        { status: 403 }
      );
    }

    // Check if user has access to advanced analytics
    if (advanced && !canAccessFeature(userPlan, "advancedAnalytics")) {
      return NextResponse.json(
        { error: "Advanced analytics requires Business plan" },
        { status: 403 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    // Determine posting target and capabilities
    const postingTarget = user.linkedinPostingTarget as "profile" | "organization" | null;
    const hasLinkedInConnected = !!(user.linkedinAccessToken && user.linkedinProfileId);
    const capabilities = getAnalyticsCapabilities(postingTarget);

    // Get user's posts from database
    const userPosts = await db.query.posts.findMany({
      where: and(
        eq(posts.userId, user.id),
        gte(posts.createdAt, startDate)
      ),
      orderBy: desc(posts.createdAt),
    });

    // Initialize response data
    let totalImpressions = 0;
    let totalReactions = 0;
    let totalComments = 0;
    let totalShares = 0;
    let followerCount: number | undefined;
    let followersGained: number | undefined;
    let membersReached: number | undefined;
    let linkedinPostAnalytics: Map<string, MemberPostAnalytics> = new Map();
    let followerGrowth: Array<{ date: string; count: number }> | undefined;
    let pageViews: number | undefined;
    let uniqueVisitors: number | undefined;
    let followerDemographics: AnalyticsResponse["advanced"];

    // Fetch from LinkedIn API if connected
    if (hasLinkedInConnected && user.linkedinAccessToken) {
      const accessToken = user.linkedinAccessToken;

      try {
        if (postingTarget === "organization" && user.linkedinSelectedOrgId) {
          // Organization analytics
          const orgId = user.linkedinSelectedOrgId;

          // Get follower count and growth
          const orgStats = await getOrganizationFollowerCount(accessToken, orgId);
          if (orgStats) {
            followerCount = orgStats.followerCount;
            followersGained = orgStats.followerGrowth?.totalCount;
          }

          // Get share statistics for published posts
          const publishedPosts = userPosts.filter(p => p.linkedinPostId);
          if (publishedPosts.length > 0) {
            const shareUrns = publishedPosts
              .map(p => p.linkedinPostId)
              .filter((id): id is string => !!id);

            const orgShareStats = await getOrganizationShareStatistics(
              accessToken,
              orgId,
              shareUrns,
              { start: startDate, end: endDate }
            );

            // Aggregate organization share stats
            orgShareStats.forEach((stats, urn) => {
              totalImpressions += stats.impressions;
              totalReactions += stats.likes;
              totalComments += stats.comments;
              totalShares += stats.shares;

              // Store for individual post lookup
              linkedinPostAnalytics.set(urn, {
                postUrn: urn,
                impressions: stats.impressions,
                membersReached: 0,
                reactions: stats.likes,
                comments: stats.comments,
                reshares: stats.shares,
              });
            });
          }

          // Advanced organization analytics
          if (advanced) {
            // Page views and visitors
            const pageStats = await getOrganizationPageStatistics(
              accessToken,
              orgId,
              { start: startDate, end: endDate }
            );
            if (pageStats) {
              pageViews = pageStats.pageViews;
              uniqueVisitors = pageStats.uniqueVisitors;
            }

            // Follower demographics
            const demographics = await getOrganizationFollowerDemographics(accessToken, orgId);
            if (demographics) {
              followerDemographics = {
                postTypePerformance: [],
                engagementTrend: [],
                followerDemographics: demographics,
              };
            }
          }
        } else {
          // Personal profile analytics using Member Creator Post Analytics API
          const memberAnalytics = await getMemberAggregatedAnalytics(
            accessToken,
            { start: startDate, end: endDate }
          );

          if (memberAnalytics) {
            totalImpressions = memberAnalytics.totalImpressions;
            totalReactions = memberAnalytics.totalReactions;
            totalComments = memberAnalytics.totalComments;
            totalShares = memberAnalytics.totalReshares;
            membersReached = memberAnalytics.totalMembersReached;
          }

          // Get individual post analytics
          const allPostAnalytics = await getMemberAllPostsAnalytics(
            accessToken,
            { start: startDate, end: endDate }
          );

          allPostAnalytics.forEach((postStats) => {
            linkedinPostAnalytics.set(postStats.postUrn, postStats);
          });

          // Get follower count
          const memberFollowers = await getMemberFollowerCount(accessToken);
          if (memberFollowers !== null) {
            followerCount = memberFollowers;
          }

          // Get followers gained and time-series data
          const followerStats = await getMemberFollowerStats(
            accessToken,
            { start: startDate, end: endDate }
          );
          if (followerStats && followerStats.followersByDateRange) {
            followersGained = followerStats.followersByDateRange.reduce(
              (sum: number, day: { count: number }) => sum + day.count,
              0
            );
            followerGrowth = followerStats.followersByDateRange;
          } else {
            followersGained = await getMemberFollowersGained(
              accessToken,
              { start: startDate, end: endDate }
            );
          }
        }
      } catch (linkedinError) {
        console.error("Failed to fetch LinkedIn analytics:", linkedinError);
        // Continue with database data if LinkedIn API fails
      }
    }

    // Fall back to database analytics if no LinkedIn data
    if (totalImpressions === 0 && totalReactions === 0) {
      const postIds = userPosts.map((p) => p.id);
      let analyticsData: typeof postAnalytics.$inferSelect[] = [];

      if (postIds.length > 0) {
        analyticsData = await db.query.postAnalytics.findMany({
          where: and(
            sql`${postAnalytics.postId} IN (${postIds.map(() => "?").join(",")})`,
            gte(postAnalytics.date, startDate)
          ),
          orderBy: desc(postAnalytics.date),
        });
      }

      // Calculate summary stats from database
      totalImpressions = analyticsData.reduce((sum, a) => sum + (a.impressions || 0), 0);
      totalReactions = analyticsData.reduce((sum, a) => sum + (a.reactions || 0), 0);
      totalComments = analyticsData.reduce((sum, a) => sum + (a.comments || 0), 0);
      totalShares = analyticsData.reduce((sum, a) => sum + (a.shares || 0), 0);
    }

    // Calculate engagement rate
    const totalEngagements = totalReactions + totalComments + totalShares;
    const avgEngagement = totalImpressions > 0
      ? ((totalEngagements / totalImpressions) * 100).toFixed(2)
      : "0.00";

    // Build posts array with analytics
    const postsWithAnalytics: PostAnalyticsData[] = userPosts.map((post) => {
      // Try to find LinkedIn analytics for this post
      let postAnalyticsData: PostAnalyticsData["analytics"] | undefined;

      if (post.linkedinPostId) {
        const linkedinStats = linkedinPostAnalytics.get(post.linkedinPostId);
        if (linkedinStats) {
          postAnalyticsData = {
            impressions: linkedinStats.impressions,
            reactions: linkedinStats.reactions,
            comments: linkedinStats.comments,
            reshares: linkedinStats.reshares,
            membersReached: linkedinStats.membersReached,
          };
        }
      }

      return {
        id: post.id,
        content: post.content?.substring(0, 100) || null,
        postType: post.postType,
        status: post.status,
        publishedAt: post.publishedAt?.toISOString() || null,
        createdAt: post.createdAt?.toISOString() || null,
        linkedinPostId: post.linkedinPostId,
        linkedinPostUrl: post.linkedinPostUrl,
        linkedinImageUrl: post.linkedinImageUrl,
        syncedFromLinkedin: post.syncedFromLinkedin ?? false,
        analytics: postAnalyticsData,
      };
    });

    // Build response
    const response: AnalyticsResponse = {
      summary: {
        totalPosts: userPosts.length,
        totalImpressions,
        totalReactions,
        totalComments,
        totalShares,
        avgEngagement,
        followerCount,
        followersGained,
        membersReached,
      },
      posts: postsWithAnalytics,
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
    };

    // Add advanced data for Business users
    if (advanced) {
      // Group posts by type for performance stats
      const postTypeStats: Record<string, { count: number; totalEngagement: number }> = {};
      postsWithAnalytics.forEach((post) => {
        const type = post.postType || "text";
        if (!postTypeStats[type]) {
          postTypeStats[type] = { count: 0, totalEngagement: 0 };
        }
        postTypeStats[type].count++;
        if (post.analytics) {
          const engagement = post.analytics.impressions > 0
            ? ((post.analytics.reactions + post.analytics.comments + post.analytics.reshares) / post.analytics.impressions) * 100
            : 0;
          postTypeStats[type].totalEngagement += engagement;
        }
      });

      // Get database analytics for trend calculation
      const postIds = userPosts.map((p) => p.id);
      let analyticsData: typeof postAnalytics.$inferSelect[] = [];

      if (postIds.length > 0) {
        analyticsData = await db.query.postAnalytics.findMany({
          where: and(
            sql`${postAnalytics.postId} IN (${postIds.map(() => "?").join(",")})`,
            gte(postAnalytics.date, startDate)
          ),
          orderBy: desc(postAnalytics.date),
        });
      }

      response.advanced = {
        postTypePerformance: Object.entries(postTypeStats).map(([type, stats]) => ({
          type,
          count: stats.count,
          avgEngagement: stats.count > 0 ? (stats.totalEngagement / stats.count).toFixed(2) : "0",
        })),
        engagementTrend: calculateWeeklyTrend(analyticsData),
        bestPostingTimes: calculateBestPostingTimes(postsWithAnalytics),
        postingTimeHeatmap: calculatePostingTimeHeatmap(postsWithAnalytics),
        pageViews,
        uniqueVisitors,
        followerDemographics: followerDemographics?.followerDemographics,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

function calculateWeeklyTrend(analyticsData: typeof postAnalytics.$inferSelect[]) {
  const weeklyData: Record<string, { impressions: number; engagement: number; count: number }> = {};

  analyticsData.forEach((a) => {
    const weekStart = getWeekStart(a.date);
    const key = weekStart.toISOString().split("T")[0];

    if (!weeklyData[key]) {
      weeklyData[key] = { impressions: 0, engagement: 0, count: 0 };
    }

    weeklyData[key].impressions += a.impressions || 0;
    weeklyData[key].engagement += parseFloat(a.engagementRate || "0");
    weeklyData[key].count++;
  });

  return Object.entries(weeklyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      impressions: data.impressions,
      avgEngagement: data.count > 0 ? (data.engagement / data.count).toFixed(2) : "0",
    }));
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calculateBestPostingTimes(posts: PostAnalyticsData[]): {
  bestDay: string;
  bestHour: string;
  insight: string;
} | undefined {
  const postsWithAnalytics = posts.filter(p => p.analytics && p.publishedAt);

  if (postsWithAnalytics.length < 3) {
    return undefined;
  }

  // Group by day of week
  const dayStats: Record<number, { totalEngagement: number; count: number }> = {};
  const hourStats: Record<number, { totalEngagement: number; count: number }> = {};

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  postsWithAnalytics.forEach((post) => {
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

  // Find best day
  let bestDay = 2; // Default to Tuesday
  let bestDayAvg = 0;
  Object.entries(dayStats).forEach(([day, stats]) => {
    const avg = stats.count > 0 ? stats.totalEngagement / stats.count : 0;
    if (avg > bestDayAvg) {
      bestDayAvg = avg;
      bestDay = parseInt(day);
    }
  });

  // Find best hour
  let bestHour = 10; // Default to 10 AM
  let bestHourAvg = 0;
  Object.entries(hourStats).forEach(([hour, stats]) => {
    const avg = stats.count > 0 ? stats.totalEngagement / stats.count : 0;
    if (avg > bestHourAvg) {
      bestHourAvg = avg;
      bestHour = parseInt(hour);
    }
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
