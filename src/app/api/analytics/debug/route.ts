import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getLinkedInProfileWithHeadline,
  scrapeOwnProfilePostURNs,
  getPostByUrn,
  getImageDownloadUrls,
  getMemberAggregatedAnalytics,
  getMemberAllPostsAnalytics,
  getPostsByAuthor,
} from "@/lib/linkedin";

// DEBUG endpoint - tests every step of the analytics pipeline
// Access: https://staging.linkedgrow.ai/api/analytics/debug
export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [user] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const token = user.linkedinCommunityAccessToken || user.linkedinAccessToken;
    results.user = {
      email: user.email,
      plan: user.plan,
      postingTarget: user.linkedinPostingTarget,
      orgId: user.linkedinSelectedOrgId,
      profileId: user.linkedinProfileId,
      vanityName: user.linkedinVanityName,
      headline: user.linkedinHeadline,
      hasCommunityToken: !!user.linkedinCommunityAccessToken,
      hasPosterToken: !!user.linkedinAccessToken,
    };

    if (!token) {
      results.error = "No token available";
      return NextResponse.json(results);
    }

    // Test 1: Profile with headline (r_basicprofile)
    try {
      const profile = await getLinkedInProfileWithHeadline(token);
      results.test1_profile = { success: true, data: profile };
    } catch (err) {
      results.test1_profile = { success: false, error: String(err) };
    }

    // Test 2: Scrape own public profile for post URNs
    const vanity = user.linkedinVanityName || '';
    if (vanity) {
      try {
        const posts = await scrapeOwnProfilePostURNs(vanity);
        results.test2_scrape = { success: true, postCount: posts.length, first3: posts.slice(0, 3) };
      } catch (err) {
        results.test2_scrape = { success: false, error: String(err) };
      }
    } else {
      results.test2_scrape = { skipped: "no vanity name" };
    }

    // Test 3: Aggregated analytics (r_member_postAnalytics)
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const agg = await getMemberAggregatedAnalytics(token, { start: thirtyDaysAgo, end: new Date() });
      results.test3_aggregated = { success: true, data: agg };
    } catch (err) {
      results.test3_aggregated = { success: false, error: String(err) };
    }

    // Test 4: Try fetching posts via Posts API with person URN (even though r_member_social is "closed")
    if (user.linkedinProfileId) {
      try {
        const personUrn = `urn:li:person:${user.linkedinProfileId}`;
        const postsResult = await getPostsByAuthor(token, personUrn, 10);
        results.test4_postsAPI_person = { success: true, postCount: postsResult.posts.length, first3: postsResult.posts.slice(0, 3).map(p => ({ id: p.id, text: p.commentary?.substring(0, 50), mediaType: p.mediaType })) };
      } catch (err) {
        results.test4_postsAPI_person = { success: false, error: String(err) };
      }
    }

    // Test 5: Try fetching posts via Posts API with org URN
    if (user.linkedinSelectedOrgId) {
      try {
        const orgUrn = `urn:li:organization:${user.linkedinSelectedOrgId}`;
        const postsResult = await getPostsByAuthor(token, orgUrn, 10);
        results.test5_postsAPI_org = { success: true, postCount: postsResult.posts.length, first3: postsResult.posts.slice(0, 3).map(p => ({ id: p.id, text: p.commentary?.substring(0, 50), mediaType: p.mediaType })) };
      } catch (err) {
        results.test5_postsAPI_org = { success: false, error: String(err) };
      }
    } else {
      results.test5_postsAPI_org = { skipped: "no org selected" };
    }

    // Test 6: If we got scraped URNs, try to read one post by URN
    const scrapeData = results.test2_scrape as Record<string, unknown>;
    if (scrapeData?.success && (scrapeData.first3 as Array<Record<string, unknown>>)?.length > 0) {
      const firstPost = (scrapeData.first3 as Array<Record<string, unknown>>)[0];
      const shareUrn = firstPost.shareUrn as string;
      try {
        const post = await getPostByUrn(token, shareUrn);
        results.test6_getPostByUrn = { success: true, data: post ? { id: post.id, text: post.commentary?.substring(0, 50), mediaType: post.mediaType, mediaId: post.mediaId } : null };
      } catch (err) {
        results.test6_getPostByUrn = { success: false, error: String(err) };
      }
    }

    // Test 7: If we have an org, try to get org posts WITH their share statistics
    if (user.linkedinSelectedOrgId) {
      try {
        // Get org follower count
        const { getOrganizationFollowerCount } = await import("@/lib/linkedin");
        const orgStats = await getOrganizationFollowerCount(token, user.linkedinSelectedOrgId);
        results.test7_orgFollowers = { success: true, data: orgStats };
      } catch (err) {
        results.test7_orgFollowers = { success: false, error: String(err) };
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    results.fatalError = String(err);
    return NextResponse.json(results, { status: 500 });
  }
}
