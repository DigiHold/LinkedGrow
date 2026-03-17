import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  engagementLists,
  engagementListProfiles,
  linkedinProfilePostsCache,
  users,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { canAccessFeature, type PlanId } from "@/lib/plans";
import { scrapeLinkedInProfile } from "@/lib/linkedin-scraper";
import { uploadToR2 } from "@/lib/storage/r2";

const LINKEDIN_CDN_HOSTS = [
  "media.licdn.com",
  "media-exp1.licdn.com",
  "media-exp2.licdn.com",
  "static.licdn.com",
];

async function downloadProfilePictureToR2(
  imageUrl: string,
  vanityName: string
): Promise<string | null> {
  try {
    const url = new URL(imageUrl);
    if (!LINKEDIN_CDN_HOSTS.some((h) => url.hostname.endsWith(h))) return null;
    if (url.protocol !== "https:") return null;

    const res = await fetch(imageUrl);
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 100) return null;

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";

    const result = await uploadToR2(buffer, {
      fileName: `engagement-profile-${vanityName}.${ext}`,
      contentType,
      userId: "engagement", // shared namespace for engagement profile pics
    });

    return result.url;
  } catch {
    return null;
  }
}

// POST /api/engagement/lists/[id]/profiles - Add a profile to a list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    let { vanityName } = body;

    if (!vanityName || typeof vanityName !== "string") {
      return NextResponse.json(
        { error: "vanityName is required (e.g. 'justinwelsh')" },
        { status: 400 }
      );
    }

    // Clean vanity name - handle full URLs and @ prefix
    vanityName = vanityName.trim();
    // Handle full LinkedIn URLs
    const urlMatch = vanityName.match(/linkedin\.com\/in\/([^/?]+)/);
    if (urlMatch) {
      vanityName = urlMatch[1];
    }
    // Remove @ prefix
    vanityName = vanityName.replace(/^@/, "");
    // Remove trailing slashes
    vanityName = vanityName.replace(/\/+$/, "");

    if (!vanityName || vanityName.length < 2) {
      return NextResponse.json({ error: "Invalid vanity name" }, { status: 400 });
    }

    // Verify list ownership
    const [list] = await db
      .select()
      .from(engagementLists)
      .where(
        and(eq(engagementLists.id, id), eq(engagementLists.userId, session.user.id))
      );
    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Check if already in this list
    const [existing] = await db
      .select()
      .from(engagementListProfiles)
      .where(
        and(
          eq(engagementListProfiles.listId, id),
          eq(engagementListProfiles.vanityName, vanityName)
        )
      );
    if (existing) {
      return NextResponse.json(
        { error: "Profile already in this list" },
        { status: 400 }
      );
    }

    // Max 50 profiles per list
    const profileCount = await db
      .select()
      .from(engagementListProfiles)
      .where(eq(engagementListProfiles.listId, id));
    if (profileCount.length >= 50) {
      return NextResponse.json(
        { error: "Maximum 50 profiles per list" },
        { status: 400 }
      );
    }

    // Check if we have cached profile data
    const [cached] = await db
      .select()
      .from(linkedinProfilePostsCache)
      .where(eq(linkedinProfilePostsCache.vanityName, vanityName));

    let displayName = vanityName;
    let headline = "";
    let profilePictureUrl = "";

    if (cached && cached.displayName) {
      displayName = cached.displayName;
      headline = cached.headline || "";
      profilePictureUrl = cached.profilePictureUrl || "";
    } else {
      // Scrape the profile to get basic info + cache posts
      try {
        const profile = await scrapeLinkedInProfile(vanityName);
        displayName = profile.displayName;
        headline = profile.headline;

        // Download profile picture to R2 for permanent storage
        if (profile.profilePictureUrl) {
          const r2Url = await downloadProfilePictureToR2(profile.profilePictureUrl, vanityName);
          profilePictureUrl = r2Url || profile.profilePictureUrl;
        }

        // Cache the scraped data
        await db
          .insert(linkedinProfilePostsCache)
          .values({
            vanityName,
            displayName: profile.displayName,
            headline: profile.headline,
            profilePictureUrl,
            followerCount: profile.followerCount,
            postsJson: JSON.stringify(profile.posts),
            lastFetchedAt: new Date(),
            status: "success",
          })
          .onConflictDoUpdate({
            target: linkedinProfilePostsCache.vanityName,
            set: {
              displayName: profile.displayName,
              headline: profile.headline,
              profilePictureUrl,
              followerCount: profile.followerCount,
              postsJson: JSON.stringify(profile.posts),
              lastFetchedAt: new Date(),
              status: "success",
            },
          });
      } catch {
        // Profile couldn't be scraped - add anyway with vanity name as display name
      }
    }

    const profileId = nanoid();
    await db.insert(engagementListProfiles).values({
      id: profileId,
      listId: id,
      vanityName,
      displayName,
      headline,
      profilePictureUrl,
      addedAt: new Date(),
    });

    return NextResponse.json({
      profile: {
        id: profileId,
        listId: id,
        vanityName,
        displayName,
        headline,
        profilePictureUrl,
      },
    });
  } catch (error) {
    console.error("Failed to add profile:", error);
    return NextResponse.json(
      { error: "Failed to add profile" },
      { status: 500 }
    );
  }
}

// DELETE /api/engagement/lists/[id]/profiles - Remove a profile from a list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        { error: "profileId query param required" },
        { status: 400 }
      );
    }

    // Verify list ownership
    const [list] = await db
      .select()
      .from(engagementLists)
      .where(
        and(eq(engagementLists.id, id), eq(engagementLists.userId, session.user.id))
      );
    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    await db
      .delete(engagementListProfiles)
      .where(
        and(
          eq(engagementListProfiles.id, profileId),
          eq(engagementListProfiles.listId, id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove profile:", error);
    return NextResponse.json(
      { error: "Failed to remove profile" },
      { status: 500 }
    );
  }
}
