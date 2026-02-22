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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface PlayerResponse { [key: string]: any }

// Parse caption XML into segments
function parseCaptionXml(xml: string): CaptionSegment[] {
  const captions: CaptionSegment[] = [];
  const textRegex = /<text\s+start="([^"]*)"(?:\s+dur="([^"]*)")?[^>]*>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = textRegex.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    const dur = parseFloat(match[2] || "0");
    const text = match[3]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/<[^>]*>/g, "")
      .replace(/\n/g, " ")
      .trim();

    if (text) {
      captions.push({ start, dur, text });
    }
  }
  return captions;
}

// Extract caption tracks from a player response and fetch caption XML
async function fetchCaptionsFromPlayerResponse(
  playerResponse: PlayerResponse
): Promise<{ captions: CaptionSegment[]; title: string } | null> {
  const captionTracks =
    playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!captionTracks || captionTracks.length === 0) {
    return null;
  }

  // Prefer English, then auto-generated English, then first available
  let selectedTrack = captionTracks.find(
    (t: { vssId?: string }) => t.vssId === ".en" || t.vssId === "a.en"
  );
  if (!selectedTrack) {
    selectedTrack = captionTracks.find(
      (t: { languageCode?: string }) => t.languageCode === "en"
    );
  }
  if (!selectedTrack) {
    selectedTrack = captionTracks[0];
  }

  const captionUrl = selectedTrack.baseUrl;
  if (!captionUrl) return null;

  const captionResponse = await fetch(captionUrl, {
    signal: AbortSignal.timeout(10000),
  });

  if (!captionResponse.ok) return null;

  const captionXml = await captionResponse.text();
  const captions = parseCaptionXml(captionXml);

  const title = playerResponse?.videoDetails?.title || "";

  return { captions, title };
}

// Method 1: InnerTube API (most reliable from server environments)
async function tryInnerTubeApi(
  videoId: string
): Promise<{ captions: CaptionSegment[]; title: string } | null> {
  // Try multiple client configs - some work better from datacenter IPs
  const clients = [
    {
      clientName: "WEB",
      clientVersion: "2.20250101.00.00",
    },
    {
      clientName: "ANDROID",
      clientVersion: "19.02.37",
      androidSdkVersion: 30,
    },
  ];

  for (const client of clients) {
    try {
      const response = await fetch(
        "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent":
              client.clientName === "ANDROID"
                ? "com.google.android.youtube/19.02.37 (Linux; U; Android 11) gzip"
                : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          body: JSON.stringify({
            videoId,
            context: {
              client: {
                hl: "en",
                gl: "US",
                ...client,
              },
            },
          }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) continue;

      const playerResponse = await response.json();

      // Check playability
      const status = playerResponse?.playabilityStatus?.status;
      if (status === "ERROR") {
        throw new Error("VIDEO_NOT_FOUND");
      }

      // Try to get captions even if status is LOGIN_REQUIRED
      const result = await fetchCaptionsFromPlayerResponse(playerResponse);
      if (result && result.captions.length > 0) {
        return result;
      }

      // If status indicates unavailable and no captions, try next client
      if (status === "UNPLAYABLE" || status === "LOGIN_REQUIRED") {
        continue;
      }
    } catch (err) {
      if (err instanceof Error && err.message === "VIDEO_NOT_FOUND") {
        throw err;
      }
      // Try next client
    }
  }

  return null;
}

// Method 2: Page scraping with consent cookies (fallback)
async function tryPageScraping(
  videoId: string
): Promise<{ captions: CaptionSegment[]; title: string } | null> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(watchUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Cookie: "CONSENT=PENDING+999; SOCS=CAESEwgDEgk2ODE4MTAyMjQaAmVuIAEaBgiA_ZC3Bg",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) return null;

  const html = await response.text();

  // Extract title
  let title = "";
  const titleMatch =
    html.match(/<meta\s+name="title"\s+content="([^"]*)"/) ||
    html.match(/<title>([^<]*)<\/title>/);
  if (titleMatch) {
    title = titleMatch[1].replace(" - YouTube", "").trim();
  }

  // Extract ytInitialPlayerResponse using brace counting (more robust than regex)
  const marker = "ytInitialPlayerResponse";
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) return null;

  const braceStart = html.indexOf("{", markerIdx + marker.length);
  if (braceStart === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  let braceEnd = -1;

  for (let i = braceStart; i < html.length; i++) {
    const char = html[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\" && inString) {
      escaped = true;
      continue;
    }
    if (char === '"' && !escaped) {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth === 0) {
        braceEnd = i;
        break;
      }
    }
  }

  if (braceEnd === -1) return null;

  let playerResponse: PlayerResponse;
  try {
    playerResponse = JSON.parse(html.substring(braceStart, braceEnd + 1));
  } catch {
    return null;
  }

  // Try to get captions regardless of playability status
  const result = await fetchCaptionsFromPlayerResponse(playerResponse);
  if (result && result.captions.length > 0) {
    return { captions: result.captions, title: result.title || title };
  }

  // Check why we failed
  const playabilityStatus = playerResponse?.playabilityStatus?.status;
  if (playabilityStatus === "ERROR") {
    throw new Error("VIDEO_NOT_FOUND");
  }
  if (
    playabilityStatus === "UNPLAYABLE" ||
    playabilityStatus === "LOGIN_REQUIRED"
  ) {
    throw new Error("VIDEO_UNAVAILABLE");
  }

  return null;
}

// Main extraction: tries InnerTube API first, then page scraping
async function extractCaptions(
  videoId: string
): Promise<{ captions: CaptionSegment[]; title: string }> {
  // Method 1: InnerTube API (works from datacenter IPs, no HTML parsing)
  const innerTubeResult = await tryInnerTubeApi(videoId);
  if (innerTubeResult && innerTubeResult.captions.length > 0) {
    return innerTubeResult;
  }

  // Method 2: Page scraping with consent cookies
  const scrapingResult = await tryPageScraping(videoId);
  if (scrapingResult && scrapingResult.captions.length > 0) {
    return scrapingResult;
  }

  // Both methods failed
  throw new Error("NO_CAPTIONS");
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check plan access
    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, session.user.id));
    const userPlan = (user?.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "contentRepurposing")) {
      return NextResponse.json(
        {
          error:
            "Content repurposing requires a Starter plan or higher. Please upgrade to access this feature.",
        },
        { status: 403 }
      );
    }

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

    let result;
    try {
      result = await extractCaptions(videoId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "";

      if (
        errorMsg === "VIDEO_UNAVAILABLE" ||
        errorMsg === "VIDEO_NOT_FOUND"
      ) {
        return NextResponse.json(
          { error: "This video is private, deleted, or unavailable." },
          { status: 404 }
        );
      }
      if (errorMsg === "NO_CAPTIONS") {
        return NextResponse.json(
          {
            error:
              "This video doesn't have captions. YouTube auto-generates captions for most videos, but some (music, very short clips, non-speech content) may not have them. Try a different video.",
          },
          { status: 400 }
        );
      }

      console.error("YouTube caption extraction error:", err);
      return NextResponse.json(
        {
          error:
            "Failed to extract captions from this video. Please try again.",
        },
        { status: 500 }
      );
    }

    const { captions, title: videoTitle } = result;

    if (captions.length === 0) {
      return NextResponse.json(
        {
          error:
            "This video doesn't have captions. YouTube auto-generates captions for most videos, but some (music, very short clips, non-speech content) may not have them. Try a different video.",
        },
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
    console.error("YouTube extraction error:", error);

    if (error instanceof Error && error.message.includes("429")) {
      return NextResponse.json(
        {
          error:
            "YouTube is temporarily blocking requests. Please try again in a few minutes.",
        },
        { status: 429 }
      );
    }

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
