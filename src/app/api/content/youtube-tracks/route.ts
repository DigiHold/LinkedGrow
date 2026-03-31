import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessFeature, type PlanId } from "@/lib/plans";
import { checkAIRateLimit } from "@/lib/rate-limit";

function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

const WORKER_URL = process.env.YOUTUBE_WORKER_URL;
const WORKER_SECRET = process.env.YOUTUBE_WORKER_SECRET;

// Extract English caption track URL from InnerTube player response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findCaptionTrack(data: any): string | null {
  const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks?.length) return null;

  const track =
    tracks.find((t: { vssId?: string }) => t.vssId === ".en" || t.vssId === "a.en") ||
    tracks.find((t: { languageCode?: string }) => t.languageCode === "en") ||
    tracks[0];

  if (!track?.baseUrl) return null;
  return track.baseUrl.replace(/&fmt=[^&]*/g, "") + "&fmt=srv1";
}

// Extract ytInitialPlayerResponse JSON from YouTube watch page HTML
function extractPlayerResponse(html: string): Record<string, unknown> | null {
  // Try both formats YouTube uses
  const markers = ["var ytInitialPlayerResponse = ", "ytInitialPlayerResponse = "];
  let start = -1;

  for (const marker of markers) {
    const idx = html.indexOf(marker);
    if (idx !== -1) {
      start = idx + marker.length;
      break;
    }
  }

  if (start === -1 || html[start] !== "{") return null;

  // Count braces to find matching closing brace (handles nested JSON)
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < Math.min(start + 500_000, html.length); i++) {
    const ch = html[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.substring(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

interface TrackResult {
  title: string;
  trackUrl: string;
  debug: string;
}

// 4-method fallback chain to get YouTube caption track URL
async function getTrackUrl(videoId: string): Promise<TrackResult | null> {
  // Method 1: Cloudflare Worker (distributed edge IPs)
  if (WORKER_URL && WORKER_SECRET) {
    try {
      const resp = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Worker-Secret": WORKER_SECRET },
        body: JSON.stringify({ videoId }),
        signal: AbortSignal.timeout(10_000),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.trackUrl) return { title: data.title, trackUrl: data.trackUrl, debug: `worker: ${data.debug}` };
      }
    } catch {}
  }

  // Method 2: InnerTube ANDROID client (from Vercel)
  try {
    const resp = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
      },
      body: JSON.stringify({
        videoId,
        contentCheckOk: true,
        racyCheckOk: true,
        context: { client: { clientName: "ANDROID", clientVersion: "20.10.38", hl: "en", gl: "US" } },
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (resp.ok) {
      const data = await resp.json();
      const trackUrl = findCaptionTrack(data);
      if (trackUrl) {
        return { title: data?.videoDetails?.title || "", trackUrl, debug: `vercel-android: ${data?.playabilityStatus?.status}` };
      }
    }
  } catch {}

  // Method 3: Scrape YouTube watch page HTML (most resilient - YouTube always serves this)
  try {
    const resp = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        Cookie: "CONSENT=PENDING+999",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (resp.ok) {
      const html = await resp.text();
      const playerResponse = extractPlayerResponse(html);
      if (playerResponse) {
        const trackUrl = findCaptionTrack(playerResponse);
        if (trackUrl) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return { title: (playerResponse as any)?.videoDetails?.title || "", trackUrl, debug: "watch-page" };
        }
      }
    }
  } catch {}

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const aiRateLimit = checkAIRateLimit(session.user.id);
    if (!aiRateLimit.success) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }

    const [user] = await db.select({ plan: users.plan }).from(users).where(eq(users.id, session.user.id));
    const userPlan = (user?.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "contentRepurposing")) {
      return NextResponse.json({ error: "Content repurposing requires a Starter plan or higher." }, { status: 403 });
    }

    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 });

    const videoId = extractVideoId(url);
    if (!videoId) return NextResponse.json({ error: "Please enter a valid YouTube URL" }, { status: 400 });

    const result = await getTrackUrl(videoId);

    if (!result) {
      return NextResponse.json({
        error: "Could not get transcript for this video. The video may not have captions available, or YouTube is blocking all extraction methods. Please try a different video.",
      }, { status: 400 });
    }

    return NextResponse.json({
      videoId,
      title: result.title,
      trackUrl: result.trackUrl,
      lang: "en",
    });
  } catch (error) {
    console.error("YouTube tracks error:", error);
    return NextResponse.json({ error: "Failed to get YouTube video info" }, { status: 500 });
  }
}
