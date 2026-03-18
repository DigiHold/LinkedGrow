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

// GET /api/engagement/feed?listId=xxx&refresh=vanityName
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
    const refreshVanity = searchParams.get("refresh"); // force refresh a specific profile
    const forceRefreshAll = searchParams.get("forceRefresh") === "true"; // clear all cache and re-scrape

    // If force refresh, delete all cache entries for this user's profiles
    if (forceRefreshAll) {
      // We'll handle this by treating all profiles as needing refresh
    }

    // Get all profiles from user's lists (or specific list)
    let profileRows;
    if (listId) {
      // Verify list ownership
      const [list] = await db
        .select()
        .from(engagementLists)
        .where(
          and(
            eq(engagementLists.id, listId),
            eq(engagementLists.userId, session.user.id)
          )
        );
      if (!list) {
        return NextResponse.json({ error: "List not found" }, { status: 404 });
      }
      profileRows = await db
        .select()
        .from(engagementListProfiles)
        .where(eq(engagementListProfiles.listId, listId));
    } else {
      // Get all profiles from all user's lists
      const userLists = await db
        .select({ id: engagementLists.id })
        .from(engagementLists)
        .where(eq(engagementLists.userId, session.user.id));

      if (userLists.length === 0) {
        return NextResponse.json({ posts: [] });
      }

      profileRows = await db
        .select()
        .from(engagementListProfiles)
        .where(
          inArray(
            engagementListProfiles.listId,
            userLists.map((l) => l.id)
          )
        );
    }

    // Deduplicate by vanity name (same profile might be in multiple lists)
    const uniqueProfiles = new Map<
      string,
      { vanityName: string; displayName: string | null; headline: string | null; profilePictureUrl: string | null }
    >();
    for (const p of profileRows) {
      if (!uniqueProfiles.has(p.vanityName)) {
        uniqueProfiles.set(p.vanityName, p);
      }
    }

    const allPosts: FeedPost[] = [];
    const errors: { vanityName: string; error: string }[] = [];
    const profilesToRefresh: string[] = [];

    // Step 1: Serve all available cache immediately, collect stale profiles
    for (const profile of uniqueProfiles.values()) {
      const [cached] = await db
        .select()
        .from(linkedinProfilePostsCache)
        .where(eq(linkedinProfilePostsCache.vanityName, profile.vanityName));

      if (cached && isCacheServable(cached.lastFetchedAt) && !forceRefreshAll) {
        // Serve from cache (even if stale)
        let posts: ScrapedPost[] = [];
        try {
          posts = JSON.parse(cached.postsJson || "[]");
        } catch {
          posts = [];
        }
        const profileData = {
          displayName: cached.displayName || profile.displayName || profile.vanityName,
          headline: cached.headline || profile.headline || "",
          profilePictureUrl: cached.profilePictureUrl || profile.profilePictureUrl || "",
        };
        for (const post of posts) {
          allPosts.push({
            ...post,
            authorVanityName: profile.vanityName,
            authorDisplayName: profileData.displayName,
            authorHeadline: profileData.headline,
            authorProfilePictureUrl: profileData.profilePictureUrl,
          });
        }
        // Mark for background refresh if stale (but still served)
        if (!isCacheFresh(cached.lastFetchedAt) || refreshVanity === profile.vanityName) {
          profilesToRefresh.push(profile.vanityName);
        }
      } else {
        // No cache at all - must scrape now
        profilesToRefresh.push(profile.vanityName);
      }
    }

    // Step 2: Scrape profiles that need refreshing (sequentially to respect rate limit)
    // Scrape all that need it - the rate limiter in the scraper handles pacing
    const toScrapeNow = profilesToRefresh;
    for (const vanityName of toScrapeNow) {
      try {
        const scraped = await scrapeLinkedInProfile(vanityName);

        // Don't cache empty results (authwall/failure) - keep stale data
        if (scraped.posts.length === 0) {
          console.log(`[Feed] Skipping cache update for ${vanityName} - no posts found (authwall?)`);
          continue;
        }

        const profileData = {
          displayName: scraped.displayName,
          headline: scraped.headline,
          profilePictureUrl: scraped.profilePictureUrl,
        };

        // Update cache
        await db
          .insert(linkedinProfilePostsCache)
          .values({
            vanityName,
            displayName: scraped.displayName,
            headline: scraped.headline,
            profilePictureUrl: scraped.profilePictureUrl,
            followerCount: scraped.followerCount,
            postsJson: JSON.stringify(scraped.posts),
            lastFetchedAt: new Date(),
            status: "success",
          })
          .onConflictDoUpdate({
            target: linkedinProfilePostsCache.vanityName,
            set: {
              displayName: scraped.displayName,
              headline: scraped.headline,
              profilePictureUrl: scraped.profilePictureUrl,
              followerCount: scraped.followerCount,
              postsJson: JSON.stringify(scraped.posts),
              lastFetchedAt: new Date(),
              status: "success",
            },
          });

        // Update list profile info
        await db
          .update(engagementListProfiles)
          .set({
            displayName: scraped.displayName,
            headline: scraped.headline,
            profilePictureUrl: scraped.profilePictureUrl,
          })
          .where(eq(engagementListProfiles.vanityName, vanityName));

        // Remove old posts from this author and add fresh ones
        const filtered = allPosts.filter((p) => p.authorVanityName !== vanityName);
        allPosts.length = 0;
        allPosts.push(...filtered);
        for (const post of scraped.posts) {
          allPosts.push({
            ...post,
            authorVanityName: vanityName,
            authorDisplayName: profileData.displayName,
            authorHeadline: profileData.headline,
            authorProfilePictureUrl: profileData.profilePictureUrl,
          });
        }
      } catch (err) {
        // Only error if we have NO cached data for this profile
        const hasExistingPosts = allPosts.some((p) => p.authorVanityName === vanityName);
        if (!hasExistingPosts) {
          errors.push({
            vanityName,
            error: err instanceof Error ? err.message : "Failed to fetch profile",
          });
        }
      }
    }

    // Sort all posts by date (most recent first)
    allPosts.sort((a, b) => {
      const dateA = new Date(a.datePublished).getTime() || 0;
      const dateB = new Date(b.datePublished).getTime() || 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      posts: allPosts,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Failed to fetch engagement feed:", error);
    return NextResponse.json(
      { error: "Failed to load feed" },
      { status: 500 }
    );
  }
}
