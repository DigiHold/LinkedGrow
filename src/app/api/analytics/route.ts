import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accountFollowers, linkedinAccounts, posts, postAnalytics } from "@/lib/db/schema";
import { and, asc, desc, eq, gte } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";
import { bestPostingTime } from "@/lib/best-time";

/**
 * Analytics, from what the worker has actually read off LinkedIn.
 *
 * v2 has no LinkedIn API, so nothing here is fetched live. The worker opens
 * each account's own session every few hours, reads the numbers printed on the
 * posts and the follower count printed on the profile, and writes them down.
 * This route reports those rows and nothing else.
 *
 * The rule the page is held to: every number on it is one LinkedIn showed us,
 * or it is not on the page. No industry averages presented as insight, no
 * placeholder that looks like data.
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
    const timezone = data.user.timezone || "UTC";

    const daysParam = Number(request.nextUrl.searchParams.get("days"));
    const days =
      Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 365
        ? Math.floor(daysParam)
        : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    // One join rather than a query per post: the analytics row is reachable
    // by foreign key, so it belongs in the same read.
    const [rows, connected, followerRows] = await Promise.all([
      db
        .select({
          id: posts.id,
          content: posts.content,
          postType: posts.postType,
          status: posts.status,
          publishedAt: posts.publishedAt,
          createdAt: posts.createdAt,
          linkedinPostUrl: posts.linkedinPostUrl,
          impressions: postAnalytics.impressions,
          reactions: postAnalytics.reactions,
          comments: postAnalytics.comments,
          shares: postAnalytics.shares,
          readAt: postAnalytics.date,
        })
        .from(posts)
        .leftJoin(postAnalytics, eq(postAnalytics.postId, posts.id))
        .where(and(eq(posts.userId, ownerId), gte(posts.createdAt, since)))
        .orderBy(desc(posts.createdAt)),
      db
        .select({ id: linkedinAccounts.id })
        .from(linkedinAccounts)
        .where(
          and(
            eq(linkedinAccounts.workspaceId, ownerId),
            eq(linkedinAccounts.status, "connected")
          )
        )
        .limit(1),
      db
        .select({ day: accountFollowers.day, count: accountFollowers.count })
        .from(accountFollowers)
        .where(eq(accountFollowers.workspaceId, ownerId))
        .orderBy(asc(accountFollowers.day)),
    ]);

    let totalImpressions = 0;
    let totalReactions = 0;
    let totalComments = 0;
    let totalShares = 0;
    let lastReadAt: Date | null = null;

    const shaped = rows.map((r) => {
      totalImpressions += r.impressions ?? 0;
      totalReactions += r.reactions ?? 0;
      totalComments += r.comments ?? 0;
      totalShares += r.shares ?? 0;
      if (r.readAt && (!lastReadAt || r.readAt > lastReadAt)) lastReadAt = r.readAt;
      return {
        id: r.id,
        content: r.content,
        postType: r.postType,
        status: r.status,
        publishedAt: r.publishedAt ? String(r.publishedAt) : null,
        createdAt: r.createdAt ? String(r.createdAt) : null,
        linkedinPostUrl: r.linkedinPostUrl,
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

    // The follower line, one point per day, trimmed to the window being shown.
    const firstDay = Math.floor(since.getTime() / 86400000);
    const inWindow = followerRows.filter((f) => f.day >= firstDay);
    const followerGrowth = inWindow.map((f) => ({
      date: new Date(f.day * 86400000).toISOString().slice(0, 10),
      count: f.count,
    }));
    const followerCount = followerRows.at(-1)?.count;
    const followersGained =
      inWindow.length > 1 ? (inWindow.at(-1)?.count ?? 0) - (inWindow[0]?.count ?? 0) : undefined;

    return NextResponse.json({
      summary: {
        totalPosts: shaped.length,
        totalImpressions,
        totalReactions,
        totalComments,
        totalShares,
        avgEngagement,
        followerCount,
        followersGained: followersGained && followersGained > 0 ? followersGained : undefined,
      },
      posts: shaped,
      followerGrowth,
      /** When the worker last read any of these numbers off LinkedIn. */
      lastReadAt: lastReadAt ? String(lastReadAt) : null,
      advanced: {
        bestPostingTimes: bestPostingTime(
          rows.map((r) => ({
            publishedAt: r.publishedAt,
            impressions: r.impressions,
            engagements: (r.reactions ?? 0) + (r.comments ?? 0) + (r.shares ?? 0),
          })),
          timezone
        ),
      },
      capabilities: {
        // The worker reads these off the posts themselves, every few hours.
        canFetchPostStats: true,
        canFetchFollowerCount: true,
        // Neither is visible without LinkedIn's own analytics products, and
        // saying so is what stops the page inventing a section.
        canFetchFollowerDemographics: false,
        canFetchPageViews: false,
        isOrganization: false,
        hasLinkedInConnected: connected.length > 0,
        postingTarget: connected.length > 0 ? ("profile" as const) : null,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 }
    );
  }
}
