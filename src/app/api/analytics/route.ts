import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, users, media } from "@/lib/db/schema";
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
  scrapeOwnProfilePostURNs,
  getPostByUrn,
  getLinkedInProfileWithHeadline,
  ensureFreshTokens,
  type MemberPostAnalytics,
  type LinkedInAuthorPost,
} from "@/lib/linkedin";

// In-memory cache to avoid unnecessary API calls
const analyticsCache = new Map<string, { data: Record<string, unknown>; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

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
  const log = (_msg: string) => { /* silent */ };

  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [user] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const advanced = searchParams.get("advanced") === "true";

    // Check cache first (1 hour TTL) to avoid rate limits
    const refresh = searchParams.get("refresh") === "true";
    const cacheKey = `${user.id}:${days}:${advanced}`;
    if (refresh) {
      // Clear ALL cache entries for this user (both basic and advanced, all date ranges)
      for (const key of analyticsCache.keys()) {
        if (key.startsWith(`${user.id}:`)) analyticsCache.delete(key);
      }
      log(`Cache cleared for user`);
    } else {
      const cached = analyticsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        log(`Returning cached data (${Math.round((Date.now() - cached.timestamp) / 60000)}min old)`);
        return NextResponse.json(cached.data);
      }
    }

    const userPlan = (user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "analytics")) return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
    if (advanced && !canAccessFeature(userPlan, "advancedAnalytics")) return NextResponse.json({ error: "Business plan required" }, { status: 403 });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const postingTarget = user.linkedinPostingTarget as "profile" | "organization" | null;
    const hasLinkedIn = !!(user.linkedinAccessToken && user.linkedinProfileId);
    const capabilities = getAnalyticsCapabilities(postingTarget);
    const isOrg = postingTarget === "organization" && user.linkedinSelectedOrgId;

    // Auto-refresh tokens if expired
    const { posterToken, communityToken } = await ensureFreshTokens(user.id);
    const token = communityToken || posterToken;

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
        posts: [], capabilities: { ...capabilities, hasLinkedInConnected: false, postingTarget },
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
      // Step 1: Load LinkedGrow-published posts from DB (reliable - we have the URNs)
      const dbPosts = await db.select().from(posts)
        .where(and(
          eq(posts.userId, user.id),
          eq(posts.status, "published"),
        ))
        .orderBy(desc(posts.publishedAt))
        .limit(50);

      const dbPostsWithLinkedin = dbPosts.filter(p => p.linkedinPostId);
      log(`DB posts: ${dbPosts.length} total, ${dbPostsWithLinkedin.length} with LinkedIn URN`);

      // Fetch first image for each post from media table
      const postIds = dbPostsWithLinkedin.map(p => p.id);
      const postMediaMap = new Map<string, string>();
      if (postIds.length > 0) {
        const mediaRows = await db.select({ postId: media.postId, storageUrl: media.storageUrl, mimeType: media.mimeType })
          .from(media)
          .where(and(
            eq(media.userId, user.id),
          ));
        for (const m of mediaRows) {
          if (m.postId && !postMediaMap.has(m.postId) && m.mimeType?.startsWith("image/")) {
            postMediaMap.set(m.postId, m.storageUrl);
          }
        }
        log(`Media images found: ${postMediaMap.size}`);
      }

      const knownUrns = new Set<string>();
      for (const p of dbPostsWithLinkedin) {
        const published = p.publishedAt ? new Date(p.publishedAt) : null;
        if (published && published < startDate) continue;

        knownUrns.add(p.linkedinPostId!);
        allPosts.push({
          id: p.id,
          content: p.content?.substring(0, 200) || null,
          postType: (p.postType as "text" | "image" | "carousel" | "video") || "text",
          status: "published",
          publishedAt: published?.toISOString() || null,
          createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
          linkedinPostId: p.linkedinPostId,
          linkedinPostUrl: p.linkedinPostUrl || null,
          linkedinImageUrl: p.linkedinImageUrl || postMediaMap.get(p.id) || null,
          syncedFromLinkedin: false,
        });
      }
      log(`LinkedGrow posts in date range: ${allPosts.length}`);

      // Step 2: Also try scraping public profile for non-LinkedGrow posts
      let vanityName = user.linkedinVanityName || '';
      if (!vanityName) {
        try {
          const profileData = await getLinkedInProfileWithHeadline(token);
          if (profileData?.vanityName) {
            vanityName = profileData.vanityName;
            await db.update(users).set({ linkedinVanityName: vanityName }).where(eq(users.id, user.id));
          }
          log(`Fetched vanityName: ${vanityName}`);
        } catch (err) { log(`VanityName fetch FAILED: ${err}`); }
      } else {
        log(`Using stored vanityName: ${vanityName}`);
      }

      let scrapedPosts: Array<{ activityId: string; shareUrn: string; textPreview: string; postUrl: string }> = [];
      if (vanityName) {
        try {
          scrapedPosts = await scrapeOwnProfilePostURNs(vanityName);
          log(`Scraped ${scrapedPosts.length} post URNs from public profile`);
        } catch (err) { log(`Profile scrape FAILED (non-critical, DB posts still work): ${err}`); }
      }

      // Step 3: For scraped posts NOT already in DB, try to get full content via Posts API
      const postImageMap = new Map<string, string>();
      for (const sp of scrapedPosts.slice(0, 15)) {
        if (knownUrns.has(sp.shareUrn)) continue; // Already have this from DB

        try {
          const postData = await getPostByUrn(token, sp.shareUrn);
          if (postData) {
            let postType: "text" | "image" | "carousel" | "video" = "text";
            if (postData.mediaType === "video") postType = "video";
            else if (postData.mediaType === "document") postType = "carousel";
            else if (postData.mediaType === "image" || postData.mediaType === "multiImage") postType = "image";
            if (postData.mediaId?.includes("urn:li:image:")) postImageMap.set(sp.shareUrn, postData.mediaId);

            allPosts.push({
              id: postData.id, content: postData.commentary?.substring(0, 200) || sp.textPreview || null,
              postType, status: "published",
              publishedAt: postData.publishedAt ? new Date(postData.publishedAt).toISOString() : null,
              createdAt: postData.publishedAt ? new Date(postData.publishedAt).toISOString() : null,
              linkedinPostId: sp.shareUrn, linkedinPostUrl: sp.postUrl, syncedFromLinkedin: true,
            });
            log(`  Scraped post ${sp.activityId.slice(-6)}: ${postData.commentary?.substring(0, 40) || sp.textPreview.substring(0, 40)}`);
          } else {
            allPosts.push({
              id: sp.shareUrn, content: sp.textPreview || null,
              postType: "text", status: "published",
              publishedAt: null, createdAt: null,
              linkedinPostId: sp.shareUrn, linkedinPostUrl: sp.postUrl, syncedFromLinkedin: true,
            });
            log(`  Scraped post ${sp.activityId.slice(-6)}: API failed, using preview`);
          }
        } catch (err) { log(`Scraped post ${sp.activityId.slice(-6)} FAILED: ${err}`); }
      }

      // Step 4: Batch fetch image URLs for scraped posts
      const imageUrns = Array.from(postImageMap.values());
      if (imageUrns.length > 0) {
        try {
          const imageUrls = await getImageDownloadUrls(token, imageUrns);
          log(`Got ${imageUrls.size} image URLs`);
          for (const post of allPosts) {
            if (post.syncedFromLinkedin) {
              const imgUrn = postImageMap.get(post.linkedinPostId || '');
              if (imgUrn && imageUrls.has(imgUrn)) {
                post.linkedinImageUrl = imageUrls.get(imgUrn);
              }
            }
          }
        } catch (err) { log(`Image batch FAILED: ${err}`); }
      }

      log(`Total personal posts: ${allPosts.length} (${dbPostsWithLinkedin.length} from LinkedGrow, ${allPosts.length - dbPostsWithLinkedin.length} scraped)`);

      // Step 5: Aggregated analytics (r_member_postAnalytics)
      try {
        const agg = await getMemberAggregatedAnalytics(token, { start: startDate, end: new Date() });
        if (agg) {
          totalImpressions = agg.totalImpressions;
          totalReactions = agg.totalReactions;
          totalComments = agg.totalComments;
          totalShares = agg.totalReshares;
          membersReached = agg.totalMembersReached;
          log(`Aggregated: imp=${totalImpressions} react=${totalReactions} comm=${totalComments} share=${totalShares}`);
        } else { log(`Aggregated analytics returned null`); }
      } catch (err) { log(`Aggregated analytics FAILED: ${err}`); }

      // Step 6: Per-post analytics (no date range = lifetime stats for each post)
      const postUrns = allPosts.map(p => p.linkedinPostId).filter((id): id is string => !!id).slice(0, 20);
      if (postUrns.length > 0) {
        try {
          const perPost = await getMemberAllPostsAnalytics(token, undefined, postUrns);
          log(`Per-post analytics: ${perPost.length} posts`);
          perPost.forEach(ps => {
            postAnalyticsMap.set(ps.postUrn, ps);
            log(`  ${ps.postUrn.slice(-8)}: imp=${ps.impressions} react=${ps.reactions} comm=${ps.comments}`);
          });
        } catch (err) { log(`Per-post analytics FAILED: ${err}`); }
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

    // Top 15 posts by impressions (with analytics first)
    const withAnalytics = allPosts.filter(p => p.analytics).sort((a, b) => (b.analytics?.impressions || 0) - (a.analytics?.impressions || 0));
    const withoutAnalytics = allPosts.filter(p => !p.analytics);
    const sortedPosts = [...withAnalytics.slice(0, 15), ...withoutAnalytics.slice(0, Math.max(0, 15 - withAnalytics.length))];

    const totalEngagements = totalReactions + totalComments + totalShares;
    const avgEngagement = totalImpressions > 0 ? ((totalEngagements / totalImpressions) * 100).toFixed(2) : "0.00";

    log(`RESULT: ${allPosts.length} total posts, ${withAnalytics.length} with analytics, returning ${sortedPosts.length}`);

    const userTimezone = user.timezone || "America/New_York";

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
      posts: sortedPosts,
      followerGrowth,
      capabilities: { ...capabilities, hasLinkedInConnected: hasLinkedIn, hasCommunityConnected: !!communityToken, postingTarget },
      // Always calculate best posting times (used by basic analytics page)
      advanced: {
        bestPostingTimes: calculateBestPostingTimes(withAnalytics, userTimezone),
      },
    };

    // Advanced (full data)
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
        bestPostingTimes: calculateBestPostingTimes(withAnalytics, userTimezone),
        postingTimeHeatmap: calculateHeatmap(withAnalytics, userTimezone),
        pageViews,
        uniqueVisitors,
        followerDemographics,
      };
    }

    // Cache the response for 1 hour
    analyticsCache.set(cacheKey, { data: response, timestamp: Date.now() });

    return NextResponse.json(response);
  } catch (error) {
    log(`FATAL: ${error}`);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

// Convert a UTC date to day/hour in the user's timezone
function getLocalDayHour(date: Date, timezone: string): { day: number; hour: number } {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);

  const weekdayStr = formatted.find(p => p.type === "weekday")?.value || "Mon";
  const hourStr = formatted.find(p => p.type === "hour")?.value || "12";
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return { day: dayMap[weekdayStr] ?? 1, hour: parseInt(hourStr) % 24 };
}

function calculateBestPostingTimes(posts: PostData[], timezone: string) {
  const valid = posts.filter(p => p.analytics && p.publishedAt);
  if (valid.length < 3) return undefined;

  const dayStats: Record<number, { total: number; count: number }> = {};
  const hourStats: Record<number, { total: number; count: number }> = {};
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  valid.forEach(p => {
    const eng = p.analytics!.impressions > 0 ? ((p.analytics!.reactions + p.analytics!.comments + p.analytics!.reshares) / p.analytics!.impressions) * 100 : 0;
    const { day, hour } = getLocalDayHour(new Date(p.publishedAt!), timezone);
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

function calculateHeatmap(posts: PostData[], timezone: string) {
  const grid: Record<string, { total: number; count: number }> = {};
  posts.forEach(p => {
    if (!p.publishedAt || !p.analytics) return;
    const { day, hour } = getLocalDayHour(new Date(p.publishedAt), timezone);
    const key = `${day}-${hour}`;
    const eng = p.analytics.impressions > 0 ? ((p.analytics.reactions + p.analytics.comments + p.analytics.reshares) / p.analytics.impressions) * 100 : 0;
    if (!grid[key]) grid[key] = { total: 0, count: 0 };
    grid[key].total += eng; grid[key].count++;
  });
  return Object.entries(grid).map(([k, v]) => {
    const [day, hour] = k.split("-").map(Number);
    return { day, hour, avgEngagement: +(v.total / v.count).toFixed(2), postCount: v.count };
  });
}
