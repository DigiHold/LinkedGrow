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

    // Fetch posts for each profile (from cache or scrape)
    await Promise.all(
      Array.from(uniqueProfiles.values()).map(async (profile) => {
        try {
          let posts: ScrapedPost[] = [];
          let profileData = {
            displayName: profile.displayName || profile.vanityName,
            headline: profile.headline || "",
            profilePictureUrl: profile.profilePictureUrl || "",
          };

          // Check cache first
          const [cached] = await db
            .select()
            .from(linkedinProfilePostsCache)
            .where(eq(linkedinProfilePostsCache.vanityName, profile.vanityName));

          const needsFresh =
            refreshVanity === profile.vanityName ||
            !cached ||
            !isCacheFresh(cached.lastFetchedAt);

          if (cached && !needsFresh) {
            // Use cached data
            try {
              posts = JSON.parse(cached.postsJson || "[]");
            } catch {
              posts = [];
            }
            profileData = {
              displayName: cached.displayName || profileData.displayName,
              headline: cached.headline || profileData.headline,
              profilePictureUrl: cached.profilePictureUrl || profileData.profilePictureUrl,
            };
          } else {
            // Scrape fresh data
            try {
              const scraped = await scrapeLinkedInProfile(profile.vanityName);
              posts = scraped.posts;
              profileData = {
                displayName: scraped.displayName,
                headline: scraped.headline,
                profilePictureUrl: scraped.profilePictureUrl,
              };

              // Update cache
              await db
                .insert(linkedinProfilePostsCache)
                .values({
                  vanityName: profile.vanityName,
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

              // Also update the list profile info
              await db
                .update(engagementListProfiles)
                .set({
                  displayName: scraped.displayName,
                  headline: scraped.headline,
                  profilePictureUrl: scraped.profilePictureUrl,
                })
                .where(eq(engagementListProfiles.vanityName, profile.vanityName));
            } catch (scrapeErr) {
              // If scraping fails, fall back to cached data if available
              if (cached) {
                try {
                  posts = JSON.parse(cached.postsJson || "[]");
                } catch {
                  posts = [];
                }
                profileData = {
                  displayName: cached.displayName || profileData.displayName,
                  headline: cached.headline || profileData.headline,
                  profilePictureUrl: cached.profilePictureUrl || profileData.profilePictureUrl,
                };
              } else {
                errors.push({
                  vanityName: profile.vanityName,
                  error:
                    scrapeErr instanceof Error
                      ? scrapeErr.message
                      : "Failed to fetch profile",
                });
                return;
              }
            }
          }

          // Add author info to each post
          for (const post of posts) {
            allPosts.push({
              ...post,
              authorVanityName: profile.vanityName,
              authorDisplayName: profileData.displayName,
              authorHeadline: profileData.headline,
              authorProfilePictureUrl: profileData.profilePictureUrl,
            });
          }
        } catch (err) {
          errors.push({
            vanityName: profile.vanityName,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      })
    );

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
