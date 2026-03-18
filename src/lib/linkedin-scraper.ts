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

// Global rate limiter - max 1 fetch every 3 seconds across all users
let lastFetchTime = 0;
const MIN_FETCH_INTERVAL_MS = 3000;

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastFetchTime;
  if (elapsed < MIN_FETCH_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_FETCH_INTERVAL_MS - elapsed));
  }
  lastFetchTime = Date.now();
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
    "-s", "--max-time", "25",
    "--proxy", `socks5://${user}:${pass}@${host}:${port}`,
    "-L",
    "-H", "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "-H", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "-H", "Accept-Language: en-US,en;q=0.9",
    url,
  ], {
    encoding: "utf-8",
    timeout: 30000,
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

  // Build a map of activity positions in HTML (sorted by position)
  // Each post's content is between its activity ref and the next one
  const activityPositions: { id: string; pos: number }[] = [];
  for (const post of posts) {
    const id = post.activityUrn.split(":").pop();
    if (!id) continue;
    // Find ALL occurrences, pick the one closest to the social counts area (after pos 100000)
    let searchPos = 0;
    let bestPos = -1;
    while (true) {
      const idx = html.indexOf(`activity-${id}`, searchPos);
      if (idx < 0) break;
      bestPos = idx; // keep the last (usually deepest) occurrence
      searchPos = idx + 1;
    }
    if (bestPos > 0) {
      activityPositions.push({ id, pos: bestPos });
    }
  }

  // Sort by position in HTML
  activityPositions.sort((a, b) => a.pos - b.pos);

  for (const post of posts) {
    const activityId = post.activityUrn.split(":").pop();
    if (!activityId) continue;

    const posEntry = activityPositions.find((p) => p.id === activityId);
    if (!posEntry) continue;

    // The activity ref is at the END of each card (in the post URL link).
    // The card content (social counts, images) is BEFORE the activity ref.
    // Window: from PREVIOUS activity ref to THIS one.
    const currentIdx = activityPositions.indexOf(posEntry);
    const prevEntry = activityPositions[currentIdx - 1];
    // For the first post, limit backwards search to 8KB (cards are ~5-8KB)
    const windowStart = prevEntry ? prevEntry.pos + 50 : Math.max(0, posEntry.pos - 8000);
    const chunk = html.substring(windowStart, posEntry.pos + 500);

    // Reactions
    const reactionsMatch = chunk.match(/([\d,]+)\s*Reactions?/i);
    if (reactionsMatch) {
      const count = parseInt(reactionsMatch[1].replace(/,/g, ""), 10);
      if (count > 0) post.likes = count;
    }

    // Comments
    const commentsMatch = chunk.match(/([\d,]+)\s*Comments?/i);
    if (commentsMatch) {
      post.comments = parseInt(commentsMatch[1].replace(/,/g, ""), 10);
    }

    // Reposts
    const repostsMatch = chunk.match(/([\d,]+)\s*Reposts?/i);
    if (repostsMatch) {
      post.reposts = parseInt(repostsMatch[1].replace(/,/g, ""), 10);
    }

    // Image URL regex - stop at quotes, whitespace, parens, angle brackets
    // Allow ; because LinkedIn CDN uses &amp; which contains ;
    const IMG_URL_CHARS = `[^"'\\s)}<>]+`;

    // Carousel/document
    const carouselMatches = chunk.match(
      new RegExp(`https://media\\.licdn\\.com/dms/image/v2/${IMG_URL_CHARS}feedshare-document-cover-images${IMG_URL_CHARS}`, "g")
    );
    if (carouselMatches && carouselMatches.length > 0) {
      post.mediaType = "carousel";
      post.carouselSlides = [...new Set(carouselMatches.map(cleanUrl))];
      post.imageUrl = post.carouselSlides[0] || null;
      continue;
    }

    // Video
    const videoMatch = chunk.match(
      new RegExp(`https://(?:dms|media)\\.licdn\\.com/${IMG_URL_CHARS}feedshare-video-thumbnail${IMG_URL_CHARS}`)
    );
    if (videoMatch) {
      post.mediaType = "video";
      post.videoThumbnailUrl = cleanUrl(videoMatch[0]);
      post.imageUrl = post.videoThumbnailUrl;
      continue;
    }

    // Single image - ONLY feedshare-shrink (actual post images)
    // Explicitly exclude profile photos and banners
    const imgMatch = chunk.match(
      new RegExp(`https://media\\.licdn\\.com/dms/image/v2/${IMG_URL_CHARS}feedshare-shrink${IMG_URL_CHARS}`)
    );
    if (imgMatch) {
      post.mediaType = "image";
      post.imageUrl = cleanUrl(imgMatch[0]);
    }
  }
}

function extractProfilePicture(html: string): string | null {
  const match = html.match(
    /https:\/\/media\.licdn\.com\/dms\/image\/v2\/[^"&]*profile-displayphoto-scale_200_200[^"&]*/
  );
  if (match) return match[0].replace(/&amp;/g, "&");
  return null;
}

export async function scrapeLinkedInProfile(
  vanityName: string,
  maxRetries = 4
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
