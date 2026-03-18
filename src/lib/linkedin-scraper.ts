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
    "-s", "--max-time", "12",
    "--proxy", `socks5://${user}:${pass}@${host}:${port}`,
    "-L",
    "-H", "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "-H", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "-H", "Accept-Language: en-US,en;q=0.9",
    url,
  ], {
    encoding: "utf-8",
    timeout: 15000,
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

  // LinkedIn card structure (public profile):
  //   <a href="...activity-{ID}..." data-tracking-control-name="public_profile">
  //     <span class="sr-only">post text</span>
  //   </a>
  //   <div class="base-main-card__media">
  //     <img class="main-activity-card__img" data-delayed-url="IMAGE_URL">
  //   </div>
  //
  // The image is AFTER the activity ref (~500-700 chars forward), not before it.
  // Each activity ID appears multiple times in the HTML (JSON-LD, ellipsis menu, etc.)
  // The correct one has data-tracking-control-name="public_profile" right after it.

  const IMG_URL_CHARS = `[^"'\\s)}<>]+`;

  for (const post of posts) {
    const activityId = post.activityUrn.split(":").pop();
    if (!activityId) continue;

    // Find the activity ref that's in the card link (with public_profile tracking)
    const searchStr = `activity-${activityId}`;
    let searchPos = 0;
    let cardPos = -1;

    while (true) {
      const idx = html.indexOf(searchStr, searchPos);
      if (idx < 0) break;

      // Check if this occurrence has the card tracking attribute within 150 chars
      const afterSnippet = html.substring(idx, idx + 150);
      if (afterSnippet.includes('data-tracking-control-name="public_profile"')) {
        cardPos = idx;
        break;
      }
      searchPos = idx + 1;
    }

    if (cardPos < 0) continue;

    // Look FORWARD from the card link for the image (within 2000 chars)
    const chunk = html.substring(cardPos, cardPos + 2000);

    // Find the main-activity-card__img data-delayed-url
    const imgTagMatch = chunk.match(/main-activity-card__img[^"]*"[^>]*data-delayed-url="([^"]+)"/);
    if (!imgTagMatch) continue;

    const imgUrl = imgTagMatch[1];

    // Skip ghost/placeholder images (text-only posts)
    if (imgUrl.includes("aero-v1") || imgUrl.includes("static.licdn.com")) continue;

    const resolvedUrl = cleanUrl(imgUrl);

    // Carousel/document
    if (resolvedUrl.includes("feedshare-document-cover")) {
      post.mediaType = "carousel";
      // For carousels, find all document-cover URLs in a wider window
      const wideChunk = html.substring(cardPos, cardPos + 5000);
      const carouselMatches = wideChunk.match(
        new RegExp(`https://media\\.licdn\\.com/dms/image/v2/${IMG_URL_CHARS}feedshare-document-cover-images${IMG_URL_CHARS}`, "g")
      );
      if (carouselMatches) {
        post.carouselSlides = [...new Set(carouselMatches.map(cleanUrl))];
        post.imageUrl = post.carouselSlides[0] || null;
      }
      continue;
    }

    // Video (videocover-high or feedshare-video-thumbnail)
    if (resolvedUrl.includes("videocover") || resolvedUrl.includes("feedshare-video-thumbnail")) {
      post.mediaType = "video";
      post.videoThumbnailUrl = resolvedUrl;
      post.imageUrl = resolvedUrl;
      continue;
    }

    // Single image (feedshare-shrink or image-shrink)
    if (resolvedUrl.includes("feedshare-shrink") || resolvedUrl.includes("image-shrink")) {
      post.mediaType = "image";
      post.imageUrl = resolvedUrl;
      continue;
    }

    // Article share (articleshare-shrink)
    if (resolvedUrl.includes("articleshare")) {
      post.mediaType = "article";
      post.imageUrl = resolvedUrl;
      continue;
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

function extractProfilePicture(html: string): string | null {
  // Use [^"\s)}<>]+ to capture full URL with &amp; encoded params (same pattern as post images)
  const match = html.match(
    /https:\/\/media\.licdn\.com\/dms\/image\/v2\/[^"\s)}<>]*profile-displayphoto-scale_200_200[^"\s)}<>]*/
  );
  if (match) return match[0].replace(/&amp;/g, "&").replace(/["')}<>]/g, "");
  return null;
}

export async function scrapeLinkedInProfile(
  vanityName: string,
  maxRetries = 1
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
        profile.profilePictureUrl = extractProfilePicture(html) || "";
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
