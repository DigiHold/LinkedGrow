import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessFeature, type PlanId } from "@/lib/plans";
import { checkAIRateLimit } from "@/lib/rate-limit";

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

const WORKER_URL = process.env.YOUTUBE_WORKER_URL;
const WORKER_SECRET = process.env.YOUTUBE_WORKER_SECRET;

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

    // Check plan access
    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, session.user.id));
    const userPlan = (user?.plan || "free") as PlanId;

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid YouTube URL (e.g., youtube.com/watch?v=... or youtu.be/...)",
        },
        { status: 400 }
      );
    }

    if (!WORKER_URL || !WORKER_SECRET) {
return NextResponse.json(
        { error: "YouTube extraction is not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Call Cloudflare Worker to extract captions (uses Cloudflare IPs, not Vercel)
    const workerResponse = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Worker-Secret": WORKER_SECRET,
      },
      body: JSON.stringify({ videoId }),
      signal: AbortSignal.timeout(30000),
    });

    if (!workerResponse.ok) {
      const workerData = await workerResponse.json().catch(() => null);
      const debugInfo = workerData?.debug || "";

      if (workerResponse.status === 404 && workerData?.error === "NO_CAPTIONS") {
        const isAdmin = session.user.isAdmin;
        return NextResponse.json(
          {
            error: isAdmin
              ? `Caption extraction failed. Debug: ${debugInfo}`
              : "This video doesn't have captions. YouTube auto-generates captions for most videos, but some (music, very short clips, non-speech content) may not have them. Try a different video.",
          },
          { status: 400 }
        );
      }

return NextResponse.json(
        { error: "Failed to extract captions from this video. Please try again." },
        { status: 500 }
      );
    }

    const { captions, title: videoTitle } = await workerResponse.json();

    // Combine caption text into a single transcript
    const transcript = captions
      .map((c: { text: string }) => c.text)
      .join(" ");

    // Estimate video duration from last caption
    const lastCaption = captions[captions.length - 1];
    const videoDurationSeconds = lastCaption.start + lastCaption.dur;
    const durationMinutes = Math.round(videoDurationSeconds / 60);

    // Trim to 4,000 words (~30 min of content)
    const words = transcript.split(/\s+/);
    const trimmedTranscript = words.slice(0, 4000).join(" ");

    // Build warning for long videos
    let warning: string | undefined;
    if (videoDurationSeconds > 3600) {
      warning =
        "This video is over 60 minutes. The AI will focus on the first ~30 minutes of content.";
    }

    return NextResponse.json({
      source: "youtube",
      title: videoTitle,
      content: trimmedTranscript,
      wordCount: words.length,
      metadata: {
        duration: Math.round(videoDurationSeconds),
        durationMinutes,
      },
      warning,
    });
  } catch (error) {
return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Failed to extract YouTube content",
      },
      { status: 500 }
    );
  }
}
