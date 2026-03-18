import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  engagementLists,
  engagementListProfiles,
  linkedinProfilePostsCache,
  users,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { canAccessFeature, type PlanId } from "@/lib/plans";
import {
  scrapeLinkedInProfile,
  isCacheFresh,
  isCacheServable,
  type ScrapedPost,
} from "@/lib/linkedin-scraper";

interface FeedPost extends ScrapedPost {
  authorVanityName: string;
  authorDisplayName: string;
  authorHeadline: string;
  authorProfilePictureUrl: string;
}

// GET /api/engagement/feed?listId=xxx&limit=12&offset=0&forceRefresh=true
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, session.user.id));
    if (!canAccessFeature((user?.plan || "free") as PlanId, "engagement")) {
      return NextResponse.json({ error: "Requires Pro plan" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get("listId");
    const forceRefreshAll = searchParams.get("forceRefresh") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Force refresh: delete all cache so everything gets re-scraped
    if (forceRefreshAll) {
      await db.delete(linkedinProfilePostsCache);
    }

    // Get all profiles from user's lists (or specific list)
    let profileRows;
    if (listId) {
      const [list] = await db
        .select()
        .from(engagementLists)
        .where(and(eq(engagementLists.id, listId), eq(engagementLists.userId, session.user.id)));
      if (!list) {
        return NextResponse.json({ error: "List not found" }, { status: 404 });
      }
      profileRows = await db
        .select()
        .from(engagementListProfiles)
        .where(eq(engagementListProfiles.listId, listId));
    } else {
      const userLists = await db
        .select({ id: engagementLists.id })
        .from(engagementLists)
        .where(eq(engagementLists.userId, session.user.id));

      if (userLists.length === 0) {
        return NextResponse.json({ posts: [], total: 0, hasMore: false });
      }

      profileRows = await db
        .select()
        .from(engagementListProfiles)
        .where(inArray(engagementListProfiles.listId, userLists.map((l) => l.id)));
    }

    // Deduplicate
    const uniqueProfiles = new Map<
      string,
      { vanityName: string; displayName: string | null; headline: string | null; profilePictureUrl: string | null }
    >();
    for (const p of profileRows) {
      if (!uniqueProfiles.has(p.vanityName)) uniqueProfiles.set(p.vanityName, p);
    }

    // Step 1: Load ALL cached posts (fast DB reads)
    const allPosts: FeedPost[] = [];
    const uncachedProfiles: string[] = [];

    for (const profile of uniqueProfiles.values()) {
      const [cached] = await db
        .select()
        .from(linkedinProfilePostsCache)
        .where(eq(linkedinProfilePostsCache.vanityName, profile.vanityName));

      if (cached && isCacheServable(cached.lastFetchedAt) && !forceRefreshAll) {
        let posts: ScrapedPost[] = [];
        try { posts = JSON.parse(cached.postsJson || "[]"); } catch { posts = []; }
        const pd = {
          displayName: cached.displayName || profile.displayName || profile.vanityName,
          headline: cached.headline || profile.headline || "",
          profilePictureUrl: cached.profilePictureUrl || profile.profilePictureUrl || "",
        };
        for (const post of posts) {
          allPosts.push({ ...post, authorVanityName: profile.vanityName, authorDisplayName: pd.displayName, authorHeadline: pd.headline, authorProfilePictureUrl: pd.profilePictureUrl });
        }
        if (!isCacheFresh(cached.lastFetchedAt)) uncachedProfiles.push(profile.vanityName);
      } else {
        uncachedProfiles.push(profile.vanityName);
      }
    }

    // Step 2: If not enough cached posts to fill this page, scrape some uncached profiles
    const neededPosts = offset + limit;
    const needsScraping = allPosts.length < neededPosts && uncachedProfiles.length > 0;

    if (needsScraping) {
      // Scrape enough profiles to fill the page (3 at a time, max 6 profiles)
      const toScrape = uncachedProfiles.filter((vn) => !allPosts.some((p) => p.authorVanityName === vn)).slice(0, 6);
      const CONCURRENCY = 3;

      for (let batch = 0; batch < toScrape.length; batch += CONCURRENCY) {
        const batchNames = toScrape.slice(batch, batch + CONCURRENCY);
        const results = await Promise.allSettled(batchNames.map((vn) => scrapeLinkedInProfile(vn)));

        for (let j = 0; j < batchNames.length; j++) {
          const vanityName = batchNames[j];
          const result = results[j];
          if (result.status === "rejected" || result.value.posts.length === 0) continue;

          const scraped = result.value;
          await db.insert(linkedinProfilePostsCache).values({
            vanityName, displayName: scraped.displayName, headline: scraped.headline,
            profilePictureUrl: scraped.profilePictureUrl, followerCount: scraped.followerCount,
            postsJson: JSON.stringify(scraped.posts), lastFetchedAt: new Date(), status: "success",
          }).onConflictDoUpdate({
            target: linkedinProfilePostsCache.vanityName,
            set: { displayName: scraped.displayName, headline: scraped.headline, profilePictureUrl: scraped.profilePictureUrl,
              followerCount: scraped.followerCount, postsJson: JSON.stringify(scraped.posts), lastFetchedAt: new Date(), status: "success" },
          });
          await db.update(engagementListProfiles).set({
            displayName: scraped.displayName, headline: scraped.headline, profilePictureUrl: scraped.profilePictureUrl,
          }).where(eq(engagementListProfiles.vanityName, vanityName));

          const pd = { displayName: scraped.displayName, headline: scraped.headline, profilePictureUrl: scraped.profilePictureUrl };
          for (const post of scraped.posts) {
            allPosts.push({ ...post, authorVanityName: vanityName, authorDisplayName: pd.displayName, authorHeadline: pd.headline, authorProfilePictureUrl: pd.profilePictureUrl });
          }
        }

        // Stop scraping if we have enough posts
        if (allPosts.length >= neededPosts) break;
      }
    }

    // Sort by date
    allPosts.sort((a, b) => {
      const dateA = new Date(a.datePublished).getTime() || 0;
      const dateB = new Date(b.datePublished).getTime() || 0;
      return dateB - dateA;
    });

    // Paginate
    const paginatedPosts = allPosts.slice(offset, offset + limit);
    const hasMore = offset + limit < allPosts.length || uncachedProfiles.length > 0;

    return NextResponse.json({
      posts: paginatedPosts,
      total: allPosts.length,
      hasMore,
    });
  } catch (error) {
    console.error("Failed to fetch engagement feed:", error);
    return NextResponse.json({ error: "Failed to load feed" }, { status: 500 });
  }
}
