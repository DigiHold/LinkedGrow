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

function extractPlayerResponse(html: string): Record<string, unknown> | null {
  const markers = ["var ytInitialPlayerResponse = ", "ytInitialPlayerResponse = "];
  let start = -1;

  for (const marker of markers) {
    const idx = html.indexOf(marker);
    if (idx !== -1) { start = idx + marker.length; break; }
  }

  if (start === -1 || html[start] !== "{") return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < Math.min(start + 500_000, html.length); i++) {
    const ch = html[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\" && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(html.substring(start, i + 1)); }
        catch { return null; }
      }
    }
  }

  return null;
}

// Fallback chain to get YouTube caption track URL
// Returns { title, trackUrl, debug } on success, throws with debug info on failure
async function getTrackUrl(videoId: string): Promise<{ title: string; trackUrl: string; debug: string }> {
  const debug: string[] = [];

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
        debug.push(`worker: OK but no trackUrl (${data.debug || "?"})`);
      } else {
        const data = await resp.json().catch(() => null);
        debug.push(`worker: HTTP ${resp.status} (${data?.debug || "?"})`);
      }
    } catch (e) {
      debug.push(`worker: ${e instanceof Error ? e.message : "error"}`);
    }
  } else {
    debug.push("worker: not configured");
  }

  // Method 2: Try multiple InnerTube clients (from Vercel)
  const clients = [
    { name: "ANDROID", version: "20.10.38", ua: "com.google.android.youtube/20.10.38 (Linux; U; Android 14)", extra: {} },
    { name: "IOS", version: "20.10.4", ua: "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X)", extra: { deviceMake: "Apple", deviceModel: "iPhone16,2", osName: "iPhone", osVersion: "18.3.2" } },
    { name: "ANDROID_VR", version: "1.65.10", ua: "com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip", extra: { deviceMake: "Oculus", deviceModel: "Quest 3", androidSdkVersion: 32, osName: "Android", osVersion: "12L" } },
  ];

  for (const client of clients) {
    try {
      const resp = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": client.ua },
        body: JSON.stringify({
          videoId, contentCheckOk: true, racyCheckOk: true,
          context: { client: { clientName: client.name, clientVersion: client.version, hl: "en", gl: "US", ...client.extra } },
        }),
        signal: AbortSignal.timeout(8_000),
      });

      if (resp.ok) {
        const data = await resp.json();
        const status = data?.playabilityStatus?.status || "?";
        const trackUrl = findCaptionTrack(data);
        if (trackUrl) return { title: data?.videoDetails?.title || "", trackUrl, debug: [...debug, `${client.name}: OK`].join(" | ") };
        debug.push(`${client.name}: ${status}, 0 tracks`);
      } else {
        debug.push(`${client.name}: HTTP ${resp.status}`);
      }
    } catch (e) {
      debug.push(`${client.name}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  // Method 3: Scrape YouTube watch page HTML
  try {
    const resp = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (trackUrl) return { title: (playerResponse as any)?.videoDetails?.title || "", trackUrl, debug: [...debug, "watch: OK"].join(" | ") };
        debug.push("watch: no tracks");
      } else {
        debug.push(`watch: no playerResponse (${html.length}b)`);
      }
    } else {
      debug.push(`watch: HTTP ${resp.status}`);
    }
  } catch (e) {
    debug.push(`watch: ${e instanceof Error ? e.message : "error"}`);
  }

  const debugStr = debug.join(" | ");
  console.error(`YouTube failed [${videoId}]:`, debugStr);
  throw new Error(debugStr);
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

    try {
      const result = await getTrackUrl(videoId);
      return NextResponse.json({ videoId, title: result.title, trackUrl: result.trackUrl, lang: "en" });
    } catch (e) {
      const debugStr = e instanceof Error ? e.message : "unknown";
      const isAdmin = session.user.isAdmin;
      return NextResponse.json({
        error: isAdmin
          ? `YouTube failed: ${debugStr}`
          : "Could not get transcript for this video. Please try again.",
      }, { status: 400 });
    }
  } catch (error) {
    console.error("YouTube tracks error:", error);
    return NextResponse.json({ error: "Failed to get YouTube video info" }, { status: 500 });
  }
}
