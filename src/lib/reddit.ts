// Reddit content fetcher with 2-layer fallback:
// 1. Direct .json fetch (full data with accurate scores when not blocked)
// 2. Arctic Shift API (free Reddit mirror, always works, full post + comments)
//
// Client-side: Arctic Shift has CORS (Access-Control-Allow-Origin: *) so the
// browser can fetch directly without hitting our server. Zero server load, scales infinitely.

const ARCTIC_SHIFT_BASE = "https://arctic-shift.photon-reddit.com/api";

export interface TrimmedRedditData {
  post: {
    title: string;
    selftext: string;
    score: number;
    upvote_ratio?: number;
    num_comments: number;
    subreddit: string;
    author?: string;
  };
  comments: Array<{
    body: string;
    score: number;
  }>;
}

export function parseRedditUrl(url: string): { subreddit: string; postId: string } | null {
  const match = url.match(/reddit\.com\/r\/(\w+)\/comments\/(\w+)/);
  return match ? { subreddit: match[1], postId: match[2] } : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function trimRedditData(rawJson: any[]): TrimmedRedditData {
  const postData = rawJson[0]?.data?.children?.[0]?.data;
  const commentsData = rawJson[1]?.data?.children || [];

  if (!postData) {
    throw new Error("Invalid Reddit JSON structure");
  }

  return {
    post: {
      title: postData.title,
      selftext: postData.selftext ? postData.selftext.substring(0, 2000) : "",
      score: postData.score,
      upvote_ratio: postData.upvote_ratio,
      num_comments: postData.num_comments,
      subreddit: postData.subreddit,
      author: postData.author,
    },
    comments: commentsData
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((c: any) => c.kind === "t1" && c.data?.body)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => (b.data?.score || 0) - (a.data?.score || 0))
      .slice(0, 60)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => ({
        body: c.data.body.substring(0, 500),
        score: c.data.score,
      })),
  };
}

// --- Method 1: Direct .json fetch (best data quality, but blocked from some IPs) ---
async function fetchViaDirect(url: string): Promise<TrimmedRedditData> {
  let jsonUrl = url
    .replace("old.reddit.com", "www.reddit.com")
    .replace(/^(https?:\/\/)reddit\.com/, "$1www.reddit.com");

  if (!jsonUrl.endsWith(".json")) {
    jsonUrl = jsonUrl.replace(/\/?$/, ".json");
  }

  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0",
  ];
  const ua = userAgents[Math.floor(Math.random() * userAgents.length)];

  let lastResponse: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 * attempt));
    lastResponse = await fetch(jsonUrl, {
      headers: {
        "User-Agent": ua,
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (lastResponse.ok || lastResponse.status === 404) break;
    if (lastResponse.status !== 429 && lastResponse.status !== 403) break;
  }

  if (lastResponse?.status === 404) {
    throw new Error("POST_NOT_FOUND");
  }

  if (!lastResponse || !lastResponse.ok) {
    throw new Error(`DIRECT_FETCH_FAILED:${lastResponse?.status}`);
  }

  const rawJson = await lastResponse.json();
  return trimRedditData(rawJson);
}

// --- Method 2: Arctic Shift API (free Reddit mirror, always works) ---
// Arctic Shift mirrors Reddit data and has CORS enabled.
// Post data is near-real-time. Comment scores may lag behind live Reddit.
export async function fetchViaArcticShift(url: string): Promise<TrimmedRedditData> {
  const parsed = parseRedditUrl(url);
  if (!parsed) throw new Error("INVALID_URL");

  // Fetch post and comments in parallel
  const [postRes, commentsRes] = await Promise.all([
    fetch(`${ARCTIC_SHIFT_BASE}/posts/ids?ids=${parsed.postId}`, {
      signal: AbortSignal.timeout(10_000),
    }),
    fetch(`${ARCTIC_SHIFT_BASE}/comments/search?link_id=${parsed.postId}&limit=60`, {
      signal: AbortSignal.timeout(10_000),
    }),
  ]);

  if (!postRes.ok) throw new Error(`ARCTIC_POST_FAILED:${postRes.status}`);

  const postJson = await postRes.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const post: any = postJson.data?.[0];
  if (!post?.title) throw new Error("POST_NOT_FOUND_ARCTIC");

  // Parse comments (flat list, sort by score client-side)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let comments: Array<{ body: string; score: number }> = [];
  if (commentsRes.ok) {
    const commentsJson = await commentsRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawComments: any[] = commentsJson.data || [];
    comments = rawComments
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((c: any) => c.body && c.body !== "[deleted]" && c.body !== "[removed]")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
      .slice(0, 60)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => ({
        body: c.body.substring(0, 500),
        score: c.score || 0,
      }));
  }

  return {
    post: {
      title: post.title || "",
      selftext: post.selftext ? post.selftext.substring(0, 2000) : "",
      score: post.score || 0,
      upvote_ratio: post.upvote_ratio,
      num_comments: post.num_comments || 0,
      subreddit: post.subreddit || parsed.subreddit,
      author: post.author,
    },
    comments,
  };
}

// --- Main export: Server-side fetch with fallback chain ---
export async function fetchRedditContent(url: string): Promise<TrimmedRedditData> {
  const errors: string[] = [];

  // Method 1: Direct .json (best quality - accurate scores + all data)
  try {
    return await fetchViaDirect(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    if (msg === "POST_NOT_FOUND") {
      throw new Error("Reddit post not found. It may have been deleted or made private.");
    }
    errors.push(`Direct: ${msg}`);
  }

  // Method 2: Arctic Shift (always works, free Reddit mirror)
  try {
    return await fetchViaArcticShift(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    if (msg.includes("NOT_FOUND")) {
      throw new Error("Reddit post not found. It may have been deleted or made private.");
    }
    errors.push(`ArcticShift: ${msg}`);
  }

  console.error("All Reddit fetch methods failed:", errors.join(", "));
  throw new Error("Unable to fetch Reddit content. Please try again in a moment.");
}
