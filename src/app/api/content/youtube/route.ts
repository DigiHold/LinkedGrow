import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessFeature, type PlanId } from "@/lib/plans";

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

interface CaptionSegment {
  start: number;
  dur: number;
  text: string;
}

// Extract captions directly from YouTube page HTML - more reliable than InnerTube API packages
async function extractCaptions(videoId: string): Promise<{ captions: CaptionSegment[]; title: string }> {
  // Fetch the YouTube watch page
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(watchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`YouTube returned HTTP ${response.status}`);
  }

  const html = await response.text();

  // Extract video title from HTML
  let title = "";
  const titleMatch = html.match(/<meta\s+name="title"\s+content="([^"]*)"/) ||
                     html.match(/<title>([^<]*)<\/title>/);
  if (titleMatch) {
    title = titleMatch[1].replace(" - YouTube", "").trim();
  }

  // Extract ytInitialPlayerResponse from page HTML
  const playerResponseMatch = html.match(/var\s+ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\});/) ||
                               html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\});/);

  if (!playerResponseMatch) {
    throw new Error("PLAYER_RESPONSE_NOT_FOUND");
  }

  let playerResponse;
  try {
    playerResponse = JSON.parse(playerResponseMatch[1]);
  } catch {
    throw new Error("PLAYER_RESPONSE_PARSE_FAILED");
  }

  // Check if video is playable
  const playabilityStatus = playerResponse?.playabilityStatus?.status;
  if (playabilityStatus === "UNPLAYABLE" || playabilityStatus === "LOGIN_REQUIRED") {
    throw new Error("VIDEO_UNAVAILABLE");
  }
  if (playabilityStatus === "ERROR") {
    throw new Error("VIDEO_NOT_FOUND");
  }

  // Extract caption tracks
  const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!captionTracks || captionTracks.length === 0) {
    throw new Error("NO_CAPTIONS");
  }

  // Prefer English, then auto-generated English, then first available
  let selectedTrack = captionTracks.find((t: { vssId: string }) =>
    t.vssId === ".en" || t.vssId === "a.en"
  );
  if (!selectedTrack) {
    // Try any English variant
    selectedTrack = captionTracks.find((t: { languageCode: string }) =>
      t.languageCode === "en"
    );
  }
  if (!selectedTrack) {
    // Fall back to first track
    selectedTrack = captionTracks[0];
  }

  // Fetch the caption XML
  const captionUrl = selectedTrack.baseUrl;
  const captionResponse = await fetch(captionUrl, {
    signal: AbortSignal.timeout(10000),
  });

  if (!captionResponse.ok) {
    throw new Error("CAPTION_FETCH_FAILED");
  }

  const captionXml = await captionResponse.text();

  // Parse XML captions: <text start="0.5" dur="2.1">caption text</text>
  const captions: CaptionSegment[] = [];
  const textRegex = /<text\s+start="([^"]*)"(?:\s+dur="([^"]*)")?[^>]*>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = textRegex.exec(captionXml)) !== null) {
    const start = parseFloat(match[1]);
    const dur = parseFloat(match[2] || "0");
    // Decode HTML entities
    const text = match[3]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/<[^>]*>/g, "") // Strip any HTML tags
      .replace(/\n/g, " ")
      .trim();

    if (text) {
      captions.push({ start, dur, text });
    }
  }

  return { captions, title: title || "" };
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

    let result;
    try {
      result = await extractCaptions(videoId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "";

      if (errorMsg === "VIDEO_UNAVAILABLE" || errorMsg === "VIDEO_NOT_FOUND") {
        return NextResponse.json(
          { error: "This video is private, deleted, or unavailable." },
          { status: 404 }
        );
      }
      if (errorMsg === "NO_CAPTIONS") {
        return NextResponse.json(
          { error: "This video doesn't have captions. YouTube auto-generates captions for most videos, but some (music, very short clips, non-speech content) may not have them. Try a different video." },
          { status: 400 }
        );
      }
      if (errorMsg === "PLAYER_RESPONSE_NOT_FOUND" || errorMsg === "PLAYER_RESPONSE_PARSE_FAILED") {
        return NextResponse.json(
          { error: "Failed to load video data from YouTube. Please try again in a moment." },
          { status: 502 }
        );
      }

      console.error("YouTube caption extraction error:", err);
      return NextResponse.json(
        { error: "Failed to extract captions from this video. Please try again." },
        { status: 500 }
      );
    }

    const { captions, title: videoTitle } = result;

    if (captions.length === 0) {
      return NextResponse.json(
        { error: "This video doesn't have captions. YouTube auto-generates captions for most videos, but some (music, very short clips, non-speech content) may not have them. Try a different video." },
        { status: 400 }
      );
    }

    // Combine caption text into a single transcript
    const transcript = captions.map((c) => c.text).join(" ");

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
