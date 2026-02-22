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
type AnyJson = any;

const INNERTUBE_API_KEY = "REMOVED";
const INNERTUBE_URL = "https://www.youtube.com/youtubei/v1/player";

// Decode HTML entities in caption text
function decodeText(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<[^>]*>/g, "")
    .replace(/\n/g, " ")
    .trim();
}

// Parse caption XML into segments
function parseCaptionXml(xml: string): CaptionSegment[] {
  const captions: CaptionSegment[] = [];
  const textRegex =
    /<text\s+start="([^"]*)"(?:\s+dur="([^"]*)")?[^>]*>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = textRegex.exec(xml)) !== null) {
    const text = decodeText(match[3]);
    if (text) {
      captions.push({
        start: parseFloat(match[1]),
        dur: parseFloat(match[2] || "0"),
        text,
      });
    }
  }
  return captions;
}

// InnerTube client configs that do NOT require PO tokens for captions.
// Ordered by likelihood of working from datacenter IPs.
// Source: yt-dlp PO Token Guide + yt-dlp default client list
interface ClientConfig {
  clientName: string;
  clientVersion: string;
  clientNumericId: number;
  userAgent: string;
  extraContext?: Record<string, unknown>;
  extraBody?: Record<string, unknown>;
}

const CLIENTS: ClientConfig[] = [
  // ANDROID_VR - yt-dlp's #1 default for logged-out. No PO tokens needed at all.
  {
    clientName: "ANDROID_VR",
    clientVersion: "1.71.26",
    clientNumericId: 28,
    userAgent:
      "com.google.android.apps.youtube.vr.oculus/1.71.26 (Linux; U; Android 12L; Quest 3 Build/SQ3A.220605.009.A1) gzip",
    extraContext: {
      deviceMake: "Oculus",
      deviceModel: "Quest 3",
      osName: "Android",
      osVersion: "12L",
      androidSdkVersion: 32,
    },
  },
  // IOS downgraded - yt-dlp's #2 default for logged-out. No PO tokens needed.
  {
    clientName: "IOS",
    clientVersion: "19.49.7",
    clientNumericId: 5,
    userAgent:
      "com.google.ios.youtube/19.49.7 (iPhone; CPU iPhone OS 18_2_1 like Mac OS X; en_US)",
    extraContext: {
      deviceMake: "Apple",
      deviceModel: "iPhone",
      osName: "iPhone",
      osVersion: "18.2.1",
    },
  },
  // WEB_EMBEDDED_PLAYER - for third-party embeds. No PO tokens needed.
  {
    clientName: "WEB_EMBEDDED_PLAYER",
    clientVersion: "1.20260115.01.00",
    clientNumericId: 56,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    extraBody: {
      thirdParty: { embedUrl: "https://www.google.com" },
    },
  },
  // TVHTML5_SIMPLY_EMBEDDED_PLAYER - Smart TV embed. No PO tokens needed.
  {
    clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
    clientVersion: "2.0",
    clientNumericId: 85,
    userAgent:
      "Mozilla/5.0 (CrKey armv7l 1.5.44178) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.225 Safari/537.36",
    extraBody: {
      thirdParty: { embedUrl: "https://www.google.com" },
    },
  },
  // ANDROID - standard mobile. No PO tokens for captions.
  {
    clientName: "ANDROID",
    clientVersion: "21.02.35",
    clientNumericId: 3,
    userAgent:
      "com.google.android.youtube/21.02.35 (Linux; U; Android 14; Pixel 8 Build/UQ1A.240105.004) gzip",
    extraContext: {
      deviceMake: "Google",
      deviceModel: "Pixel 8",
      osName: "Android",
      osVersion: "14",
      androidSdkVersion: 34,
    },
  },
];

// Try to get captions using InnerTube /player with multiple client configs
async function extractCaptions(
  videoId: string
): Promise<{ captions: CaptionSegment[]; title: string; debug?: string }> {
  const debug: string[] = [];

  for (const client of CLIENTS) {
    try {
      // Build the request body
      const body: Record<string, unknown> = {
        videoId,
        context: {
          client: {
            hl: "en",
            gl: "US",
            clientName: client.clientName,
            clientVersion: client.clientVersion,
            ...client.extraContext,
          },
        },
        ...(client.extraBody || {}),
      };

      // For embedded players, thirdParty goes inside context
      if (client.extraBody?.thirdParty) {
        (body.context as Record<string, unknown>).thirdParty =
          client.extraBody.thirdParty;
        delete body.thirdParty;
      }

      const response = await fetch(
        `${INNERTUBE_URL}?key=${INNERTUBE_API_KEY}&prettyPrint=false`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": client.userAgent,
            "X-Youtube-Client-Name": String(client.clientNumericId),
            "X-Youtube-Client-Version": client.clientVersion,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        debug.push(`${client.clientName}: HTTP ${response.status}`);
        continue;
      }

      const playerData = await response.json();
      const status = playerData?.playabilityStatus?.status || "?";
      const title = playerData?.videoDetails?.title || "";

      // Check for caption tracks regardless of playability status
      const captionTracks: AnyJson[] | undefined =
        playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

      if (!captionTracks || captionTracks.length === 0) {
        debug.push(`${client.clientName}: ${status}, 0 tracks`);
        continue;
      }

      // Find best caption track: prefer English, then auto-generated, then first
      let track = captionTracks.find(
        (t: AnyJson) => t.vssId === ".en" || t.vssId === "a.en"
      );
      if (!track) {
        track = captionTracks.find(
          (t: AnyJson) => t.languageCode === "en"
        );
      }
      if (!track) track = captionTracks[0];
      if (!track?.baseUrl) {
        debug.push(
          `${client.clientName}: ${status}, ${captionTracks.length} tracks, no baseUrl`
        );
        continue;
      }

      // Fetch the caption XML
      const captionResponse = await fetch(track.baseUrl, {
        headers: { "User-Agent": client.userAgent },
        signal: AbortSignal.timeout(10000),
      });

      if (!captionResponse.ok) {
        debug.push(
          `${client.clientName}: ${status}, ${captionTracks.length} tracks, caption XML HTTP ${captionResponse.status}`
        );
        continue;
      }

      const xml = await captionResponse.text();
      const captions = parseCaptionXml(xml);

      if (captions.length > 0) {
        debug.push(`${client.clientName}: OK, ${captions.length} segments`);
        return { captions, title };
      }

      debug.push(
        `${client.clientName}: ${status}, XML empty (${xml.length}B)`
      );
    } catch (err) {
      debug.push(
        `${client.clientName}: ${err instanceof Error ? err.message : "error"}`
      );
    }
  }

  // All clients failed
  const debugInfo = debug.join(" | ");
  console.error(
    `YouTube caption extraction failed for ${videoId}: ${debugInfo}`
  );

  const error = new Error("NO_CAPTIONS") as Error & { debug?: string };
  error.debug = debugInfo;
  throw error;
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
      const debugInfo = (err as Error & { debug?: string })?.debug || "";

      if (errorMsg === "NO_CAPTIONS") {
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
