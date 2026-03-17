import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const LINKEDIN_REST_API_BASE = 'https://api.linkedin.com/rest';
const LINKEDIN_API_VERSION = '202506';

// DEBUG endpoint - tests every analytics API call with RAW responses
export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [user] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const token = user.linkedinCommunityAccessToken || user.linkedinAccessToken;
    results.tokenType = user.linkedinCommunityAccessToken ? "community" : "poster";

    if (!token) {
      results.error = "No token";
      return NextResponse.json(results);
    }

    // Test 1: memberCreatorPostAnalytics WITHOUT date range (lifetime)
    try {
      const url = `${LINKEDIN_REST_API_BASE}/memberCreatorPostAnalytics?q=me&queryType=IMPRESSION&aggregation=TOTAL`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': LINKEDIN_API_VERSION,
        },
      });
      const text = await res.text();
      results.test1_impression_lifetime = { status: res.status, raw: text.substring(0, 500) };
    } catch (err) { results.test1_impression_lifetime = { error: String(err) }; }

    // Test 2: Same but with date range (30 days)
    try {
      const url = `${LINKEDIN_REST_API_BASE}/memberCreatorPostAnalytics?q=me&queryType=IMPRESSION&aggregation=TOTAL&dateRange=(start:(year:2026,month:2,day:15),end:(year:2026,month:3,day:17))`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': LINKEDIN_API_VERSION,
        },
      });
      const text = await res.text();
      results.test2_impression_30d = { status: res.status, raw: text.substring(0, 500) };
    } catch (err) { results.test2_impression_30d = { error: String(err) }; }

    // Test 3: REACTION lifetime
    try {
      const url = `${LINKEDIN_REST_API_BASE}/memberCreatorPostAnalytics?q=me&queryType=REACTION&aggregation=TOTAL`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': LINKEDIN_API_VERSION,
        },
      });
      const text = await res.text();
      results.test3_reaction_lifetime = { status: res.status, raw: text.substring(0, 500) };
    } catch (err) { results.test3_reaction_lifetime = { error: String(err) }; }

    // Test 4: DAILY impressions (should show daily breakdown)
    try {
      const url = `${LINKEDIN_REST_API_BASE}/memberCreatorPostAnalytics?q=me&queryType=IMPRESSION&aggregation=DAILY&dateRange=(start:(year:2026,month:3,day:10),end:(year:2026,month:3,day:17))`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': LINKEDIN_API_VERSION,
        },
      });
      const text = await res.text();
      results.test4_impression_daily = { status: res.status, raw: text.substring(0, 1000) };
    } catch (err) { results.test4_impression_daily = { error: String(err) }; }

    // Test 5: Try with poster token instead of community token
    if (user.linkedinAccessToken && user.linkedinCommunityAccessToken) {
      try {
        const url = `${LINKEDIN_REST_API_BASE}/memberCreatorPostAnalytics?q=me&queryType=IMPRESSION&aggregation=TOTAL`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${user.linkedinAccessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
            'LinkedIn-Version': LINKEDIN_API_VERSION,
          },
        });
        const text = await res.text();
        results.test5_impression_poster_token = { status: res.status, raw: text.substring(0, 500) };
      } catch (err) { results.test5_impression_poster_token = { error: String(err) }; }
    }

    // Test 6: Follower count (this works - for comparison)
    try {
      const url = `${LINKEDIN_REST_API_BASE}/memberFollowersCount?q=me`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': LINKEDIN_API_VERSION,
        },
      });
      const text = await res.text();
      results.test6_followers = { status: res.status, raw: text.substring(0, 500) };
    } catch (err) { results.test6_followers = { error: String(err) }; }

    // Test 7: Try Posts API for org (if org exists in linkedin_organizations)
    if (user.linkedinOrganizations) {
      try {
        const orgs = JSON.parse(user.linkedinOrganizations);
        if (orgs.length > 0) {
          const orgId = orgs[0].id;
          const orgUrn = encodeURIComponent(`urn:li:organization:${orgId}`);
          const url = `${LINKEDIN_REST_API_BASE}/posts?author=${orgUrn}&q=author&count=5&sortBy=LAST_MODIFIED`;
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Restli-Protocol-Version': '2.0.0',
              'LinkedIn-Version': LINKEDIN_API_VERSION,
              'X-RestLi-Method': 'FINDER',
            },
          });
          const text = await res.text();
          results.test7_org_posts = { status: res.status, orgId, raw: text.substring(0, 1000) };
        }
      } catch (err) { results.test7_org_posts = { error: String(err) }; }
    }

    return NextResponse.json(results);
  } catch (err) {
    results.fatalError = String(err);
    return NextResponse.json(results, { status: 500 });
  }
}
