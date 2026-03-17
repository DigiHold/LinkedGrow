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

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

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
  for (const post of posts) {
    const activityId = post.activityUrn.split(":").pop();
    if (!activityId) continue;

    const urnIdx = html.indexOf(`urn:li:activity:${activityId}`);
    if (urnIdx < 0) continue;

    const chunk = html.substring(urnIdx, Math.min(html.length, urnIdx + 15000));

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

    // Carousel/document detection - look for document cover images
    const carouselCovers = chunk.match(
      /https:\/\/media\.licdn\.com\/dms\/image\/v2\/[^"&]*feedshare-document-cover-images[^"&]*/g
    );
    if (carouselCovers && carouselCovers.length > 0) {
      post.mediaType = "carousel";
      // Deduplicate and sort by page index
      const uniqueSlides = [...new Set(carouselCovers.map((u) => u.replace(/&amp;/g, "&")))];
      post.carouselSlides = uniqueSlides;
      post.imageUrl = uniqueSlides[0] || null;
      continue; // skip other media checks
    }

    // Video detection - look for video thumbnails
    const videoThumb = chunk.match(
      /https:\/\/(?:dms|media)\.licdn\.com\/[^"&]*feedshare-video-thumbnail[^"&]*/
    );
    if (videoThumb) {
      post.mediaType = "video";
      post.videoThumbnailUrl = videoThumb[0].replace(/&amp;/g, "&");
      post.imageUrl = post.videoThumbnailUrl;
      continue;
    }

    // Single image (feedshare or image-shrink)
    const imgMatch = chunk.match(
      /https:\/\/media\.licdn\.com\/dms\/image\/v2\/[^"&]*(?:feedshare-shrink|image-shrink)[^"&]*/
    );
    if (imgMatch) {
      post.mediaType = "image";
      post.imageUrl = imgMatch[0].replace(/&amp;/g, "&");
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

      const { posts, profile } = parseJsonLd(html);

      enrichFromHtml(html, posts);

      if (!profile.profilePictureUrl) {
        profile.profilePictureUrl = extractProfilePicture(html) || "";
      }

      return {
        vanityName,
        displayName: profile.displayName || vanityName,
        headline: profile.headline || "",
        profilePictureUrl: profile.profilePictureUrl || "",
        followerCount: profile.followerCount || 0,
        posts: posts.slice(0, 10),
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError || new Error("Failed to scrape profile after retries");
}

export function isCacheFresh(lastFetchedAt: Date | number): boolean {
  const fetchedMs = lastFetchedAt instanceof Date ? lastFetchedAt.getTime() : lastFetchedAt * 1000;
  return Date.now() - fetchedMs < CACHE_TTL_MS;
}
