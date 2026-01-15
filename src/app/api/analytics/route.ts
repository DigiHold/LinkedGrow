import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, postAnalytics, users } from "@/lib/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { canAccessFeature } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

// GET /api/analytics - Get analytics data
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const advanced = searchParams.get("advanced") === "true";

    // Check if user has access to advanced analytics
    const userPlan = (user.plan || "free") as PlanId;
    if (advanced && !canAccessFeature(userPlan, "advancedAnalytics")) {
      return NextResponse.json(
        { error: "Advanced analytics requires Business plan" },
        { status: 403 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user's posts
    const userPosts = await db.query.posts.findMany({
      where: and(
        eq(posts.userId, user.id),
        gte(posts.createdAt, startDate)
      ),
      orderBy: desc(posts.createdAt),
    });

    // Get analytics for posts
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

    // Calculate summary stats
    const totalImpressions = analyticsData.reduce((sum, a) => sum + (a.impressions || 0), 0);
    const totalReactions = analyticsData.reduce((sum, a) => sum + (a.reactions || 0), 0);
    const totalComments = analyticsData.reduce((sum, a) => sum + (a.comments || 0), 0);
    const totalShares = analyticsData.reduce((sum, a) => sum + (a.shares || 0), 0);
    const avgEngagement = analyticsData.length > 0
      ? analyticsData.reduce((sum, a) => sum + parseFloat(a.engagementRate || "0"), 0) / analyticsData.length
      : 0;

    // Group by post type
    const postTypeStats: Record<string, { count: number; totalEngagement: number }> = {};
    userPosts.forEach((post) => {
      const type = post.postType || "text";
      if (!postTypeStats[type]) {
        postTypeStats[type] = { count: 0, totalEngagement: 0 };
      }
      postTypeStats[type].count++;
    });

    // Basic response
    const response: Record<string, unknown> = {
      summary: {
        totalPosts: userPosts.length,
        totalImpressions,
        totalReactions,
        totalComments,
        totalShares,
        avgEngagement: avgEngagement.toFixed(2),
      },
      posts: userPosts.map((post) => ({
        id: post.id,
        content: post.content?.substring(0, 100),
        postType: post.postType,
        status: post.status,
        publishedAt: post.publishedAt?.toISOString(),
        createdAt: post.createdAt?.toISOString(),
      })),
    };

    // Add advanced data for Business users
    if (advanced) {
      response.advanced = {
        postTypePerformance: Object.entries(postTypeStats).map(([type, stats]) => ({
          type,
          count: stats.count,
          avgEngagement: stats.count > 0 ? (stats.totalEngagement / stats.count).toFixed(2) : "0",
        })),
        // Engagement trend by week
        engagementTrend: calculateWeeklyTrend(analyticsData),
        // Best posting times (placeholder - would need actual data)
        bestPostingTimes: {
          bestDay: "Wednesday",
          bestHour: "10:00 AM",
          insight: "Your audience is most active mid-week during business hours",
        },
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
