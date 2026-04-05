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

    // Cache disabled - always fetch fresh data to avoid stale results when switching targets
    const refresh = searchParams.get("refresh") === "true";
    const cacheKey = `${user.id}:${days}:${advanced}:${user.linkedinPostingTarget || 'profile'}`;
    if (refresh) {
      for (const key of analyticsCache.keys()) {
        if (key.startsWith(`${user.id}:`)) analyticsCache.delete(key);
      }
    }
    // Always clear any existing cache entry for this key
    analyticsCache.delete(cacheKey);
    log(`Fetching fresh data (target: ${user.linkedinPostingTarget || 'profile'})`);

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
    const { token } = await ensureFreshTokens(user.id);

    log(`User: ${user.email} | Plan: ${user.plan} | Target: ${postingTarget} | Org: ${isOrg ? user.linkedinSelectedOrgId : 'no'}`);
    log(`Token: ${!!user.linkedinAccessToken}`);

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

      // Load local DB posts and their media (images on R2) for matching
      const dbPosts = await db.select().from(posts)
        .where(and(eq(posts.userId, user.id), eq(posts.status, "published")))
        .orderBy(desc(posts.publishedAt))
        .limit(100);
      const dbPostsByLinkedinId = new Map<string, typeof dbPosts[0]>();
      for (const p of dbPosts) {
        if (p.linkedinPostId) dbPostsByLinkedinId.set(p.linkedinPostId, p);
      }

      // Load media from R2 for local posts
      const dbPostIds = dbPosts.map(p => p.id);
      const localMediaMap = new Map<string, string>();
      if (dbPostIds.length > 0) {
        const mediaRows = await db.select({ postId: media.postId, storageUrl: media.storageUrl, mimeType: media.mimeType })
          .from(media)
          .where(eq(media.userId, user.id));
        for (const m of mediaRows) {
          if (m.postId && !localMediaMap.has(m.postId) && m.mimeType?.startsWith("image/")) {
            localMediaMap.set(m.postId, m.storageUrl);
          }
        }
      }
      log(`Local DB: ${dbPosts.length} posts, ${localMediaMap.size} images`);

      // 1. Fetch ALL posts from LinkedIn (org has r_organization_social)
      try {
        const result = await getPostsByAuthor(token, orgUrn, 100);
        log(`Org posts fetched: ${result.posts.length}`);

        // Only fetch LinkedIn images for posts NOT in our DB
        const needLinkedInImages: string[] = [];
        for (const p of result.posts) {
          const dbPost = dbPostsByLinkedinId.get(p.id);
          if (!dbPost && p.mediaId?.includes("urn:li:image:")) {
            needLinkedInImages.push(p.mediaId);
          }
        }
        const imageUrls = needLinkedInImages.length > 0
          ? await getImageDownloadUrls(token, needLinkedInImages).catch(() => new Map<string, string>())
          : new Map<string, string>();
        log(`LinkedIn image URLs: ${imageUrls.size}, Local images: ${localMediaMap.size}`);

        for (const p of result.posts) {
          if (p.lifecycleState !== "PUBLISHED") continue;
          const published = new Date(p.publishedAt);
          if (published < startDate) continue;

          let postType: "text" | "image" | "carousel" | "video" = "text";
          if (p.mediaType === "video") postType = "video";
          else if (p.mediaType === "document") postType = "carousel";
          else if (p.mediaType === "image" || p.mediaType === "multiImage" || p.mediaType === "article") postType = "image";

          // Use local R2 image if post was published through LinkedGrow, otherwise LinkedIn
          const dbPost = dbPostsByLinkedinId.get(p.id);
          const localImage = dbPost ? (dbPost.linkedinImageUrl || localMediaMap.get(dbPost.id)) : undefined;
          const linkedInImage = p.mediaId ? imageUrls.get(p.mediaId) : undefined;

          allPosts.push({
            id: dbPost?.id || p.id,
            content: p.commentary?.substring(0, 200) || null,
            postType,
            status: "published",
            publishedAt: published.toISOString(),
            createdAt: new Date(p.createdAt).toISOString(),
            linkedinPostId: p.id,
            linkedinPostUrl: dbPost?.linkedinPostUrl || `https://www.linkedin.com/feed/update/${p.id}/`,
            linkedinImageUrl: localImage || linkedInImage || undefined,
            syncedFromLinkedin: !dbPost,
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
      capabilities: { ...capabilities, hasLinkedInConnected: hasLinkedIn, postingTarget },
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

// Industry benchmark scores by day-hour slot (0-6 Sun-Sat, 0-23 hours)
// Compiled from Sprout Social (2B engagements), Buffer (4.8M posts), Taplio (130K posts) - 2025/2026 data
// Scores: 0.0 (worst) to 1.0 (best) representing relative engagement potential
const INDUSTRY_BENCHMARKS: Record<string, number> = (() => {
  const scores: Record<string, number> = {};
  // Base: all slots start at 0.1 (never truly zero - someone is always online)
  for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) scores[`${d}-${h}`] = 0.1;

  // Weekday patterns (Mon=1 through Fri=5): work hours are strong
  for (const d of [1, 2, 3, 4, 5]) {
    scores[`${d}-7`] = 0.3; scores[`${d}-8`] = 0.6; scores[`${d}-9`] = 0.8;
    scores[`${d}-10`] = 0.85; scores[`${d}-11`] = 0.9; scores[`${d}-12`] = 0.8;
    scores[`${d}-13`] = 0.75; scores[`${d}-14`] = 0.7; scores[`${d}-15`] = 0.65;
    scores[`${d}-16`] = 0.6; scores[`${d}-17`] = 0.55; scores[`${d}-18`] = 0.4;
    scores[`${d}-19`] = 0.3; scores[`${d}-20`] = 0.25;
  }
  // Tue/Wed/Thu are the strongest days (universal consensus)
  for (const d of [2, 3, 4]) {
    scores[`${d}-9`] = 0.9; scores[`${d}-10`] = 0.95; scores[`${d}-11`] = 1.0;
    scores[`${d}-12`] = 0.9; scores[`${d}-13`] = 0.85; scores[`${d}-14`] = 0.8;
    scores[`${d}-15`] = 0.75; scores[`${d}-16`] = 0.7; scores[`${d}-17`] = 0.65;
  }
  // Weekend: significantly weaker
  for (const d of [0, 6]) {
    scores[`${d}-9`] = 0.3; scores[`${d}-10`] = 0.35; scores[`${d}-11`] = 0.3;
    scores[`${d}-12`] = 0.25; scores[`${d}-17`] = 0.25; scores[`${d}-18`] = 0.2;
  }
  return scores;
})();

function calculateBestPostingTimes(posts: PostData[], timezone: string) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const valid = posts.filter(p => p.analytics && p.publishedAt && p.analytics.impressions > 0);

  // Progressive blending: more personal data = less reliance on benchmarks
  // 0 posts: 100% benchmarks, 5: 70/30, 10: 40/60, 20+: 10/90
  const n = valid.length;
  const personalWeight = n === 0 ? 0 : Math.min(0.9, n * 0.045);
  const benchmarkWeight = 1 - personalWeight;
  const source = n === 0 ? "industry" : n < 10 ? "hybrid" : "personal";

  // Calculate personal scores per day-hour slot using recency-weighted median-like approach
  const slotData: Record<string, number[]> = {};
  const now = Date.now();
  const HALF_LIFE_DAYS = 21; // Posts older than 3 weeks lose half their weight
  const lambda = Math.LN2 / (HALF_LIFE_DAYS * 86400000);

  valid.forEach(p => {
    // Weighted engagement: comments worth 3x, shares 2x, reactions 1x (reflects LinkedIn algorithm)
    const weighted = (p.analytics!.reactions + p.analytics!.comments * 3 + p.analytics!.reshares * 2) / p.analytics!.impressions * 100;
    const { day, hour } = getLocalDayHour(new Date(p.publishedAt!), timezone);
    const key = `${day}-${hour}`;
    // Apply recency decay
    const age = now - new Date(p.publishedAt!).getTime();
    const recencyWeight = Math.exp(-lambda * age);
    const weightedEng = weighted * recencyWeight;
    if (!slotData[key]) slotData[key] = [];
    slotData[key].push(weightedEng);
  });

  // Bayesian smoothing: blend slot average with global average for sparse slots
  const allEngagements = Object.values(slotData).flat();
  const globalMedian = allEngagements.length > 0
    ? allEngagements.sort((a, b) => a - b)[Math.floor(allEngagements.length / 2)]
    : 0;
  const SMOOTHING_K = 3; // Posts needed before slot data fully trusted

  // Calculate blended score for each day-hour slot
  const slotScores: Record<string, number> = {};
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const key = `${d}-${h}`;
      const benchmark = INDUSTRY_BENCHMARKS[key] || 0.1;

      let personalScore = 0;
      if (slotData[key] && slotData[key].length > 0) {
        const vals = slotData[key].sort((a, b) => a - b);
        const median = vals[Math.floor(vals.length / 2)];
        // Bayesian smoothing: (n * median + k * global) / (n + k)
        personalScore = (vals.length * median + SMOOTHING_K * globalMedian) / (vals.length + SMOOTHING_K);
      } else {
        personalScore = globalMedian;
      }

      // Normalize personal score to 0-1 range for blending
      const maxPossibleEng = Math.max(globalMedian * 3, 1);
      const normalizedPersonal = Math.min(personalScore / maxPossibleEng, 1);

      slotScores[key] = benchmarkWeight * benchmark + personalWeight * normalizedPersonal;
    }
  }

  // Find best day (aggregate slot scores per day)
  const dayScores: Record<number, number> = {};
  for (let d = 0; d < 7; d++) {
    let sum = 0;
    for (let h = 0; h < 24; h++) sum += slotScores[`${d}-${h}`];
    dayScores[d] = sum;
  }
  let bestDay = 2;
  let bestDayScore = 0;
  Object.entries(dayScores).forEach(([d, s]) => { if (s > bestDayScore) { bestDayScore = s; bestDay = +d; } });

  // Find best 2-hour window on the best day
  let bestWindowStart = 10;
  let bestWindowScore = 0;
  for (let h = 6; h <= 21; h++) { // Only consider 6 AM - 9 PM windows
    const windowScore = slotScores[`${bestDay}-${h}`] + slotScores[`${bestDay}-${(h + 1) % 24}`];
    if (windowScore > bestWindowScore) { bestWindowScore = windowScore; bestWindowStart = h; }
  }
  const windowEnd = bestWindowStart + 2;

  const fh = (h: number) => `${h % 12 || 12} ${h >= 12 ? "PM" : "AM"}`;
  const bestWindow = `${fh(bestWindowStart)} - ${fh(windowEnd)}`;

  const insightPrefix = source === "industry"
    ? "Based on LinkedIn industry data"
    : source === "hybrid"
      ? `Based on your ${n} posts combined with industry data`
      : `Based on your ${n} posts`;

  return {
    bestDay: days[bestDay],
    bestHour: bestWindow,
    insight: `${insightPrefix}, ${days[bestDay]}s between ${bestWindow} tend to get the most engagement.`,
    source,
    postCount: n,
  };
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
