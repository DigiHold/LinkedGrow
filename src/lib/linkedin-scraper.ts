import { execFileSync } from "child_process";

// ============================================
// TYPES
// ============================================

export interface ScrapedPost {
  activityUrn: string;
  text: string;
  datePublished: string;
  likes: number;
  comments: number;
  reposts: number;
  postUrl: string;
  imageUrl: string | null;
  mediaType: "image" | "video" | "carousel" | "article" | null;
  carouselSlides: string[]; // URLs for carousel pages
  videoThumbnailUrl: string | null;
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

const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours - posts don't change fast, saves proxy bandwidth
const STALE_SERVE_MS = 24 * 60 * 60 * 1000; // Serve stale cache up to 24h while refreshing in background

// No rate limiter - rely on proxy rotation for IP diversity
async function waitForRateLimit(): Promise<void> {
  // no-op - removed to allow faster scraping within Vercel timeout
}

function fetchProfileHtml(vanityName: string): string {
  const user = process.env.IPROYAL_PROXY_USER;
  const pass = process.env.IPROYAL_PROXY_PASS;
  const host = process.env.IPROYAL_PROXY_HOST || "geo.iproyal.com";
  const port = process.env.IPROYAL_PROXY_PORT || "12321";

  if (!user || !pass) {
    throw new Error("Proxy credentials not configured (IPROYAL_PROXY_USER/PASS)");
  }

  const url = `https://www.linkedin.com/in/${encodeURIComponent(vanityName)}/`;

  return execFileSync("curl", [
    "-s", "--max-time", "20",
    "--proxy", `socks5://${user}:${pass}@${host}:${port}`,
    "-L",
    "-H", "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "-H", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "-H", "Accept-Language: en-US,en;q=0.9",
    url,
  ], {
    encoding: "utf-8",
    timeout: 25000,
    maxBuffer: 5 * 1024 * 1024,
  });
}

function isAuthwall(html: string): boolean {
  return (
    html.includes("/authwall?") ||
    (html.includes("session_redirect") && html.length < 10000) ||
    !html.includes("application/ld+json")
  );
}

function parseJsonLd(html: string): { posts: ScrapedPost[]; profile: Partial<ScrapedProfile> } {
  const posts: ScrapedPost[] = [];
  const profile: Partial<ScrapedProfile> = {};

  const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  if (!ldMatch) return { posts, profile };

  let data: { "@graph"?: Record<string, unknown>[] };
  try {
    data = JSON.parse(ldMatch[1]);
  } catch {
    return { posts, profile };
  }

  const graph = data["@graph"] || [];

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

  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  if (titleMatch) {
    const titleParts = titleMatch[1].split(" | LinkedIn")[0];
    const dashIndex = titleParts.indexOf(" - ");
    if (dashIndex > 0) {
      profile.headline = titleParts.substring(dashIndex + 3).trim();
    }
  }

  const postEntries = graph.filter((item) => item["@type"] === "DiscussionForumPosting");

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
      comments: 0,
      reposts: 0,
      postUrl,
      imageUrl: null,
      mediaType: null,
      carouselSlides: [],
      videoThumbnailUrl: null,
    });
  }

  return { posts, profile };
}

function enrichFromHtml(html: string, posts: ScrapedPost[]): void {
  const cleanUrl = (u: string) => u.replace(/&amp;/g, "&").replace(/["')}<>]/g, "");
  const IMG_PATTERN = /https:\/\/media\.licdn\.com\/dms\/image\/v2\/[^"\s)}<>]+/g;

  // Collect ALL media URLs with their positions
  const mediaItems: { url: string; pos: number; type: string }[] = [];
  let m;
  while ((m = IMG_PATTERN.exec(html)) !== null) {
    const url = cleanUrl(m[0]);
    if (url.includes("profile-displayphoto") || url.includes("profile-displaybackground") ||
        url.includes("company-logo") || url.includes("aero-v1") || url.includes("article-cover")) continue;
    let type = "unknown";
    if (url.includes("feedshare-shrink") || url.includes("image-shrink")) type = "image";
    else if (url.includes("feedshare-document-cover")) type = "carousel";
    else if (url.includes("videocover") || url.includes("video-thumbnail")) type = "video";
    if (type !== "unknown") mediaItems.push({ url, pos: m.index, type });
  }

  // For each post, find the CLOSEST media item to any of its activity refs
  for (const post of posts) {
    const activityId = post.activityUrn.split(":").pop();
    if (!activityId) continue;

    // Find ALL positions of this activity ID in the HTML
    const positions: number[] = [];
    let searchPos = 0;
    while (true) {
      const idx = html.indexOf(`activity-${activityId}`, searchPos);
      if (idx < 0) break;
      positions.push(idx);
      searchPos = idx + 1;
    }
    if (positions.length === 0) continue;

    // Find the closest media item (within 5000 chars of any activity ref position)
    let bestMedia: { url: string; type: string; dist: number } | null = null;
    for (const refPos of positions) {
      for (const media of mediaItems) {
        const dist = Math.abs(media.pos - refPos);
        if (dist < 5000 && (!bestMedia || dist < bestMedia.dist)) {
          bestMedia = { url: media.url, type: media.type, dist };
        }
      }
    }

    if (!bestMedia) continue;

    // Mark the media item as used so it's not assigned to another post
    const mediaIdx = mediaItems.findIndex((mi) => mi.url === bestMedia!.url);
    if (mediaIdx >= 0) mediaItems.splice(mediaIdx, 1);

    if (bestMedia.type === "image") {
      post.mediaType = "image";
      post.imageUrl = bestMedia.url;
    } else if (bestMedia.type === "video") {
      post.mediaType = "video";
      post.videoThumbnailUrl = bestMedia.url;
      post.imageUrl = bestMedia.url;
    } else if (bestMedia.type === "carousel") {
      post.mediaType = "carousel";
      post.imageUrl = bestMedia.url;
      // Find all carousel slides near this position
      const nearbySlides = [...html.matchAll(/https:\/\/media\.licdn\.com\/dms\/image\/v2\/[^"\s)}<>]*feedshare-document-cover[^"\s)}<>]*/g)]
        .filter((s) => positions.some((p) => Math.abs(s.index - p) < 8000))
        .map((s) => cleanUrl(s[0]));
      post.carouselSlides = [...new Set(nearbySlides)];
    }
  }
}

/**
 * Extract comment counts from HTML and map to posts by order.
 * LinkedIn puts social counts in a separate HTML section from the post cards,
 * but they appear in the same order as the posts.
 */
function extractCommentCounts(html: string, posts: ScrapedPost[]): void {
  if (posts.length === 0) return;

  // LinkedIn HTML has comment counts for articles FIRST, then for posts.
  // We need to skip article comments and only get post comments.
  // Articles are near "linkedInArticle" or "article-cover" in HTML.
  const commentMatches: number[] = [];
  const regex = /(\d[\d,]*)\s*Comments?/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    // Check 300 chars before this match - skip if it's near an article
    const before = html.substring(Math.max(0, match.index - 300), match.index);
    if (before.includes("linkedInArticle") || before.includes("article-cover") || before.includes("PublicationIssue")) {
      continue; // Skip article/newsletter comments
    }
    commentMatches.push(parseInt(match[1].replace(/,/g, ""), 10));
  }

  // Map non-article comment counts to posts by order
  for (let i = 0; i < Math.min(posts.length, commentMatches.length); i++) {
    posts[i].comments = commentMatches[i];
  }
}

function extractProfilePicture(html: string, vanityName: string): string | null {
  // The owner's photo uses "scale_200_200" (not "shrink_200_200" which is for related profiles).
  // The FIRST scale_200_200 in the HTML is the profile owner's photo.
  const match = html.match(
    /https:\/\/media\.licdn\.com\/dms\/image\/v2\/[^"\s)}<>]*profile-displayphoto-scale_200_200[^"\s)}<>]*/
  );
  if (match) return match[0].replace(/&amp;/g, "&").replace(/["')}<>]/g, "");
  return null;
}

export async function scrapeLinkedInProfile(
  vanityName: string,
  maxRetries = 2
): Promise<ScrapedProfile> {
  let lastError: Error | null = null;
  let bestResult: ScrapedProfile | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await waitForRateLimit();
      const html = fetchProfileHtml(vanityName);

      if (!html || html.length < 1000) {
        throw new Error("Empty or too small response from LinkedIn");
      }

      if (isAuthwall(html)) {
        throw new Error("LinkedIn authwall (bot detection)");
      }

      const { posts, profile } = parseJsonLd(html);

      enrichFromHtml(html, posts);
      extractCommentCounts(html, posts);

      if (!profile.profilePictureUrl) {
        profile.profilePictureUrl = extractProfilePicture(html, vanityName) || "";
      }

      const result: ScrapedProfile = {
        vanityName,
        displayName: profile.displayName || vanityName,
        headline: profile.headline || "",
        profilePictureUrl: profile.profilePictureUrl || "",
        followerCount: profile.followerCount || 0,
        posts: posts.slice(0, 10),
      };

      // LinkedIn serves full pages (~500KB+ with JSON-LD posts) or stripped pages (~300KB without).
      // If we got a stripped page (0 posts), retry with a different IP to get the full one.
      if (posts.length > 0) {
        return result; // Got full page with posts - done
      }

      // Keep the best result (with profile info even if no posts)
      if (!bestResult || result.displayName !== vanityName) {
        bestResult = result;
      }

      // Only retry for stripped pages, not authwalls
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue; // retry to get full page
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // Return best result even if it has 0 posts (profile info is still useful)
  if (bestResult) return bestResult;

  throw lastError || new Error("Failed to scrape profile after retries");
}

export function isCacheFresh(lastFetchedAt: Date | number): boolean {
  const fetchedMs = lastFetchedAt instanceof Date ? lastFetchedAt.getTime() : lastFetchedAt * 1000;
  return Date.now() - fetchedMs < CACHE_TTL_MS;
}

/** Returns true if cache is old but still usable (serve stale while refreshing) */
export function isCacheServable(lastFetchedAt: Date | number): boolean {
  const fetchedMs = lastFetchedAt instanceof Date ? lastFetchedAt.getTime() : lastFetchedAt * 1000;
  return Date.now() - fetchedMs < STALE_SERVE_MS;
}
