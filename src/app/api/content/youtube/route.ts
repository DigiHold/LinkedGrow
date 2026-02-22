import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessFeature, type PlanId } from "@/lib/plans";
import { getSubtitles } from "youtube-caption-extractor";

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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check plan access
    const [user] = await db.select({ plan: users.plan }).from(users).where(eq(users.id, session.user.id));
    const userPlan = (user?.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "contentRepurposing")) {
      return NextResponse.json(
        { error: "Content repurposing requires a Starter plan or higher. Please upgrade to access this feature." },
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
        { error: "Please enter a valid YouTube URL (e.g., youtube.com/watch?v=... or youtu.be/...)" },
        { status: 400 }
      );
    }

    // Try to get video title from oEmbed (no API key needed)
    let videoTitle = "";
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oembedResponse = await fetch(oembedUrl);
      if (oembedResponse.ok) {
        const oembedData = await oembedResponse.json();
        videoTitle = oembedData.title || "";
      }
    } catch {
      // oEmbed failed - continue without title
    }

    // Fetch captions - try English first, then fallback
    let captions;
    try {
      captions = await getSubtitles({ videoID: videoId, lang: "en" });
    } catch {
      // Try without language specification (auto-detect)
      try {
        captions = await getSubtitles({ videoID: videoId });
      } catch {
        return NextResponse.json(
          { error: "This video is private, deleted, or unavailable." },
          { status: 404 }
        );
      }
    }

    if (!captions || captions.length === 0) {
      return NextResponse.json(
        { error: "This video doesn't have captions. YouTube auto-generates captions for most videos, but some (music, very short clips, non-speech content) may not have them. Try a different video." },
        { status: 400 }
      );
    }

    // Combine caption text into a single transcript
    const transcript = captions.map((c) => c.text).join(" ");

    // Estimate video duration from last caption
    const lastCaption = captions[captions.length - 1];
    const videoDurationSeconds = parseFloat(lastCaption.start) + parseFloat(lastCaption.dur);
    const durationMinutes = Math.round(videoDurationSeconds / 60);

    // Trim to 4,000 words (~30 min of content)
    const words = transcript.split(/\s+/);
    const trimmedTranscript = words.slice(0, 4000).join(" ");

    // Build warning for long videos
    let warning: string | undefined;
    if (videoDurationSeconds > 3600) {
      warning = "This video is over 60 minutes. The AI will focus on the first ~30 minutes of content.";
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
    console.error("YouTube extraction error:", error);

    // Check for rate limiting
    if (error instanceof Error && error.message.includes("429")) {
      return NextResponse.json(
        { error: "YouTube is temporarily blocking requests. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to extract YouTube content" },
      { status: 500 }
    );
  }
}
