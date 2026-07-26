import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, postAnalytics } from "@/lib/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";

/**
 * Analytics, from stored rows only.
 *
 * v2 drops the LinkedIn API entirely, so this route no longer fetches
 * anything live. It reads what has already been written into post_analytics
 * and reports honest capabilities: nothing here can refresh until the browser
 * session layer lands and starts writing those rows itself.
 *
 * The previous version was 689 lines wrapped around eight API calls. Keeping
 * a thin shell of it would have meant a page that looks like it works while
 * showing numbers that can never change.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await loadSessionUser(session.user.id);
    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Team members read the owner's posts, same as everywhere else.
    const ownerId = data.teamOwnerId ?? data.user.id;

    const daysParam = Number(request.nextUrl.searchParams.get("days"));
    const days =
      Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 365
        ? Math.floor(daysParam)
        : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    // One join rather than a query per post: the analytics row is reachable
    // by foreign key, so it belongs in the same read.
    const rows = await db
      .select({
        id: posts.id,
        content: posts.content,
        postType: posts.postType,
        status: posts.status,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        impressions: postAnalytics.impressions,
        reactions: postAnalytics.reactions,
        comments: postAnalytics.comments,
        shares: postAnalytics.shares,
      })
      .from(posts)
      .leftJoin(postAnalytics, eq(postAnalytics.postId, posts.id))
      .where(and(eq(posts.userId, ownerId), gte(posts.createdAt, since)))
      .orderBy(desc(posts.createdAt));

    let totalImpressions = 0;
    let totalReactions = 0;
    let totalComments = 0;
    let totalShares = 0;

    const shaped = rows.map((r) => {
      totalImpressions += r.impressions ?? 0;
      totalReactions += r.reactions ?? 0;
      totalComments += r.comments ?? 0;
      totalShares += r.shares ?? 0;
      return {
        id: r.id,
        content: r.content,
        postType: r.postType,
        status: r.status,
        publishedAt: r.publishedAt ? String(r.publishedAt) : null,
        createdAt: r.createdAt ? String(r.createdAt) : null,
        analytics: {
          impressions: r.impressions ?? 0,
          reactions: r.reactions ?? 0,
          comments: r.comments ?? 0,
          reshares: r.shares ?? 0,
        },
      };
    });

    const engagements = totalReactions + totalComments + totalShares;
    const avgEngagement = totalImpressions
      ? ((engagements / totalImpressions) * 100).toFixed(1)
      : "0.0";

    return NextResponse.json({
      summary: {
        totalPosts: shaped.length,
        totalImpressions,
        totalReactions,
        totalComments,
        totalShares,
        avgEngagement,
      },
      posts: shaped,
      capabilities: {
        // All false until the session layer can read LinkedIn again. Saying
        // so is what stops the page pretending it has fresh data.
        canFetchPostStats: false,
        canFetchFollowerCount: false,
        canFetchFollowerDemographics: false,
        canFetchPageViews: false,
        isOrganization: false,
        hasLinkedInConnected: false,
        postingTarget: null,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 }
    );
  }
}
