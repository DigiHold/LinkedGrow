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

const ANDROID_UA =
  "com.google.android.youtube/20.10.38 (Linux; U; Android 14)";

// Server-side: get caption track URLs from InnerTube API (lightweight, no transcript download)
// The actual transcript is fetched client-side from the user's browser IP
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const aiRateLimit = checkAIRateLimit(session.user.id);
    if (!aiRateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, session.user.id));
    const userPlan = (user?.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "contentRepurposing")) {
      return NextResponse.json(
        { error: "Content repurposing requires a Starter plan or higher." },
        { status: 403 }
      );
    }

    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Please enter a valid YouTube URL" },
        { status: 400 }
      );
    }

    // Call InnerTube ANDROID API to get caption track metadata (lightweight JSON call)
    const resp = await fetch(
      "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": ANDROID_UA,
        },
        body: JSON.stringify({
          videoId,
          contentCheckOk: true,
          racyCheckOk: true,
          context: {
            client: {
              clientName: "ANDROID",
              clientVersion: "20.10.38",
              hl: "en",
              gl: "US",
            },
          },
        }),
      }
    );

    if (!resp.ok) {
      return NextResponse.json(
        { error: "Failed to get video info from YouTube" },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const status = data?.playabilityStatus?.status;
    const title = data?.videoDetails?.title || "";

    const captionTracks =
      data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks || captionTracks.length === 0) {
      return NextResponse.json(
        {
          error:
            "This video doesn't have captions available. Try a different video.",
          debug: session.user.isAdmin ? `InnerTube status: ${status}` : undefined,
        },
        { status: 400 }
      );
    }

    // Find English track, fallback to first
    const track =
      captionTracks.find(
        (t: { vssId?: string }) =>
          t.vssId === ".en" || t.vssId === "a.en"
      ) ||
      captionTracks.find(
        (t: { languageCode?: string }) => t.languageCode === "en"
      ) ||
      captionTracks[0];

    if (!track?.baseUrl) {
      return NextResponse.json(
        { error: "Caption track found but no download URL available" },
        { status: 400 }
      );
    }

    // Return the caption track URL - the browser will fetch it directly (CORS allowed on timedtext)
    // Force srv1 format (XML with <text> tags) for easy parsing
    let trackUrl = track.baseUrl;
    trackUrl = trackUrl.replace(/&fmt=[^&]*/g, "") + "&fmt=srv1";

    return NextResponse.json({
      videoId,
      title,
      trackUrl,
      lang: track.languageCode || "en",
    });
  } catch (error) {
    console.error("YouTube tracks error:", error);
    return NextResponse.json(
      { error: "Failed to get YouTube video info" },
      { status: 500 }
    );
  }
}
