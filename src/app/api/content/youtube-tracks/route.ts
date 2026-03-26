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

const ANDROID_UA = "com.google.android.youtube/20.10.38 (Linux; U; Android 14)";

// Try Cloudflare Worker first (different IPs from Vercel), fallback to direct InnerTube
async function getTrackUrl(videoId: string): Promise<{ title: string; trackUrl: string; debug: string } | null> {
  // Method 1: Cloudflare Worker (distributed edge IPs)
  if (WORKER_URL && WORKER_SECRET) {
    try {
      const resp = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Worker-Secret": WORKER_SECRET },
        body: JSON.stringify({ videoId }),
        signal: AbortSignal.timeout(10000),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.trackUrl) return { title: data.title, trackUrl: data.trackUrl, debug: `worker: ${data.debug}` };
      }
    } catch {}
  }

  // Method 2: Direct InnerTube from Vercel
  try {
    const resp = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": ANDROID_UA },
      body: JSON.stringify({
        videoId, contentCheckOk: true, racyCheckOk: true,
        context: { client: { clientName: "ANDROID", clientVersion: "20.10.38", hl: "en", gl: "US" } },
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (tracks?.length > 0) {
        const track = tracks.find((t: { vssId?: string }) => t.vssId === ".en" || t.vssId === "a.en")
          || tracks.find((t: { languageCode?: string }) => t.languageCode === "en")
          || tracks[0];
        if (track?.baseUrl) {
          const trackUrl = track.baseUrl.replace(/&fmt=[^&]*/g, "") + "&fmt=srv1";
          return { title: data?.videoDetails?.title || "", trackUrl, debug: `vercel: ${data?.playabilityStatus?.status}` };
        }
      }
      return null;
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
        error: "Could not get transcript for this video. YouTube may be temporarily limiting requests. Please try again in a moment.",
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
