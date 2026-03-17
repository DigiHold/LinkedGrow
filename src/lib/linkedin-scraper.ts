import { execSync } from "child_process";

// ============================================
// TYPES
// ============================================

export interface ScrapedPost {
  activityUrn: string; // urn:li:activity:XXXXX
  text: string;
  datePublished: string; // ISO date
  likes: number;
  comments: number;
  reposts: number;
  postUrl: string;
  imageUrl: string | null;
}

export interface ScrapedProfile {
  vanityName: string;
  displayName: string;
  headline: string;
  profilePictureUrl: string;
  followerCount: number;
  posts: ScrapedPost[];
}

// ============================================
// SCRAPER
// ============================================

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Fetch a LinkedIn public profile page via curl + SOCKS5 proxy.
 * Returns raw HTML string or throws on failure.
 */
function fetchProfileHtml(vanityName: string): string {
  const user = process.env.IPROYAL_PROXY_USER;
  const pass = process.env.IPROYAL_PROXY_PASS;
  const host = process.env.IPROYAL_PROXY_HOST || "geo.iproyal.com";
  const port = process.env.IPROYAL_PROXY_PORT || "12321";

  if (!user || !pass) {
    throw new Error("Proxy credentials not configured (IPROYAL_PROXY_USER/PASS)");
  }

  const url = `https://www.linkedin.com/in/${encodeURIComponent(vanityName)}/`;

  // Use curl with SOCKS5 proxy and browser-like headers
  const curlCmd = [
    "curl", "-s", "--max-time", "25",
    "--proxy", `socks5://${user}:${pass}@${host}:${port}`,
    "-L", // follow redirects
    "-H", "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "-H", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "-H", "Accept-Language: en-US,en;q=0.9",
    `"${url}"`,
  ].join(" ");

  const html = execSync(curlCmd, {
    encoding: "utf-8",
    timeout: 30000,
    maxBuffer: 5 * 1024 * 1024, // 5MB
  });

  return html;
}

/**
 * Check if the HTML is an authwall (bot detection) page.
 */
function isAuthwall(html: string): boolean {
  return (
    html.includes("/authwall?") ||
    html.includes("session_redirect") && html.length < 10000 ||
    !html.includes("application/ld+json")
  );
}

/**
 * Parse JSON-LD structured data from LinkedIn profile HTML.
 */
function parseJsonLd(html: string): { posts: ScrapedPost[]; profile: Partial<ScrapedProfile> } {
  const posts: ScrapedPost[] = [];
  const profile: Partial<ScrapedProfile> = {};

  // Extract JSON-LD script
  const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  if (!ldMatch) {
    return { posts, profile };
  }

  let data: { "@graph"?: Record<string, unknown>[] };
  try {
    data = JSON.parse(ldMatch[1]);
  } catch {
    return { posts, profile };
  }

  const graph = data["@graph"] || [];

  // Extract Person data
  const person = graph.find((item) => item["@type"] === "Person") as Record<string, unknown> | undefined;
  if (person) {
    profile.displayName = (person.name as string) || "";
    const image = person.image as { contentUrl?: string } | undefined;
    if (image?.contentUrl && !image.contentUrl.includes("/aero-v1/")) {
      profile.profilePictureUrl = image.contentUrl;
    }
    const stats = person.interactionStatistic as { userInteractionCount?: number } | undefined;
    if (stats?.userInteractionCount) {
      profile.followerCount = stats.userInteractionCount;
    }
  }

  // Extract headline from title tag
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  if (titleMatch) {
    // Format: "Name - Headline | LinkedIn"
    const titleParts = titleMatch[1].split(" | LinkedIn")[0];
    const dashIndex = titleParts.indexOf(" - ");
    if (dashIndex > 0) {
      profile.headline = titleParts.substring(dashIndex + 3).trim();
    }
  }

  // Extract DiscussionForumPosting entries (actual LinkedIn posts)
  const postEntries = graph.filter(
    (item) => item["@type"] === "DiscussionForumPosting"
  );

  for (const entry of postEntries) {
    const postUrl = (entry.mainEntityOfPage as string) || (entry.url as string) || "";
    const urnMatch = postUrl.match(/activity-(\d+)/);
    if (!urnMatch) continue;

    const activityUrn = `urn:li:activity:${urnMatch[1]}`;
    const stats = entry.interactionStatistic as { userInteractionCount?: number } | undefined;

    posts.push({
      activityUrn,
      text: (entry.text as string) || "",
      datePublished: (entry.datePublished as string) || "",
      likes: stats?.userInteractionCount || 0,
      comments: 0, // filled from HTML parsing
      reposts: 0,
      postUrl,
      imageUrl: null, // filled from HTML parsing
    });
  }

  return { posts, profile };
}

/**
 * Enrich posts with comment counts, repost counts, and images from HTML.
 */
function enrichFromHtml(html: string, posts: ScrapedPost[]): void {
  for (const post of posts) {
    const activityId = post.activityUrn.split(":").pop();
    if (!activityId) continue;

    // Find the position of this activity URN in HTML
    const urnIdx = html.indexOf(`urn:li:activity:${activityId}`);
    if (urnIdx < 0) continue;

    // Search in a window after the URN for social counts
    const chunk = html.substring(urnIdx, Math.min(html.length, urnIdx + 10000));

    // Reactions count (should match JSON-LD, but HTML is more current)
    const reactionsMatch = chunk.match(/([\d,]+)\s*Reactions?/i);
    if (reactionsMatch) {
      const count = parseInt(reactionsMatch[1].replace(/,/g, ""), 10);
      if (count > 0) post.likes = count;
    }

    // Comment count
    const commentsMatch = chunk.match(/([\d,]+)\s*Comments?/i);
    if (commentsMatch) {
      post.comments = parseInt(commentsMatch[1].replace(/,/g, ""), 10);
    }

    // Repost count
    const repostsMatch = chunk.match(/([\d,]+)\s*Reposts?/i);
    if (repostsMatch) {
      post.reposts = parseInt(repostsMatch[1].replace(/,/g, ""), 10);
    }

    // Post image (feedshare or image-shrink URLs)
    const imgMatch = chunk.match(
      /https:\/\/media\.licdn\.com\/dms\/image\/v2\/[^"&]*(?:feedshare-shrink|image-shrink)[^"&]*/
    );
    if (imgMatch) {
      post.imageUrl = imgMatch[0].replace(/&amp;/g, "&");
    }
  }
}

/**
 * Extract profile picture from HTML if not found in JSON-LD.
 */
function extractProfilePicture(html: string): string | null {
  // Look for profile display photo in img elements
  const match = html.match(
    /https:\/\/media\.licdn\.com\/dms\/image\/v2\/[^"&]*profile-displayphoto-scale_200_200[^"&]*/
  );
  if (match) {
    return match[0].replace(/&amp;/g, "&");
  }
  return null;
}

/**
 * Scrape a LinkedIn profile's public page for recent posts.
 * Retries up to 3 times on authwall (different proxy IP each time).
 */
export async function scrapeLinkedInProfile(
  vanityName: string,
  maxRetries = 3
): Promise<ScrapedProfile> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const html = fetchProfileHtml(vanityName);

      if (!html || html.length < 1000) {
        throw new Error("Empty or too small response from LinkedIn");
      }

      if (isAuthwall(html)) {
        throw new Error("LinkedIn authwall (bot detection)");
      }

      // Parse JSON-LD data
      const { posts, profile } = parseJsonLd(html);

      // Enrich with HTML data (comments, images)
      enrichFromHtml(html, posts);

      // Get profile picture from HTML if not in JSON-LD
      if (!profile.profilePictureUrl) {
        profile.profilePictureUrl = extractProfilePicture(html) || "";
      }

      return {
        vanityName,
        displayName: profile.displayName || vanityName,
        headline: profile.headline || "",
        profilePictureUrl: profile.profilePictureUrl || "",
        followerCount: profile.followerCount || 0,
        posts: posts.slice(0, 10), // max 10 posts
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Only retry on authwall or network errors
      if (attempt < maxRetries) {
        // Small delay before retry (different proxy IP each request)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError || new Error("Failed to scrape profile after retries");
}

/**
 * Check if cached data is still fresh.
 */
export function isCacheFresh(lastFetchedAt: Date | number): boolean {
  const fetchedMs = lastFetchedAt instanceof Date ? lastFetchedAt.getTime() : lastFetchedAt * 1000;
  return Date.now() - fetchedMs < CACHE_TTL_MS;
}
