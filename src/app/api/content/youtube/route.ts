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

// YouTube InnerTube API configuration
const INNERTUBE_API_KEY = "REMOVED";
const INNERTUBE_BASE = "https://www.youtube.com/youtubei/v1";
const CLIENT_VERSION = "2.20250220.01.00";

// Generate random visitor data (simplified YouTube.js approach)
function generateVisitorData(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let result = "";
  for (let i = 0; i < 11; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function makeHeaders(visitorData: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "*/*",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "X-Youtube-Client-Version": CLIENT_VERSION,
    "X-Youtube-Client-Name": "1",
    "X-Goog-Visitor-Id": visitorData,
    Origin: "https://www.youtube.com",
    Referer: "https://www.youtube.com/",
  };
}

function makeContext(visitorData: string) {
  return {
    client: {
      hl: "en",
      gl: "US",
      clientName: "WEB",
      clientVersion: CLIENT_VERSION,
      visitorData,
    },
    user: { enableSafetyMode: false },
    request: { useSsl: true },
  };
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyJson = any;

// ─────────────────────────────────────────────────────────────────────────────
// Method 1: /next + /get_transcript endpoint
// This is the most reliable method from datacenter IPs. Instead of asking
// /player for caption URLs (which YouTube blocks), we ask /next for the
// transcript engagement panel, then call /get_transcript for the actual text.
// Based on youtube-caption-extractor's approach.
// ─────────────────────────────────────────────────────────────────────────────
async function tryGetTranscript(
  videoId: string
): Promise<{ captions: CaptionSegment[]; title: string } | null> {
  try {
    const visitorData = generateVisitorData();
    const headers = makeHeaders(visitorData);
    const context = makeContext(visitorData);

    // Step 1: Call /next to get engagement panels (always, not just on LOGIN_REQUIRED)
    const nextResponse = await fetch(
      `${INNERTUBE_BASE}/next?key=${INNERTUBE_API_KEY}&prettyPrint=false`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ videoId, context, visitorData }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!nextResponse.ok) return null;
    const nextData = await nextResponse.json();

    // Extract title
    let title = "";
    const titleRuns =
      nextData?.contents?.twoColumnWatchNextResults?.results?.results
        ?.contents?.[0]?.videoPrimaryInfoRenderer?.title?.runs;
    if (titleRuns) {
      title = titleRuns
        .map((r: { text: string }) => r.text)
        .join("");
    }
    if (!title) {
      title =
        nextData?.metadata?.videoMetadataRenderer?.title?.simpleText || "";
    }

    // Find transcript engagement panel
    const engagementPanels: AnyJson[] = nextData?.engagementPanels || [];
    const transcriptPanel = engagementPanels.find(
      (panel: AnyJson) =>
        panel?.engagementPanelSectionListRenderer?.panelIdentifier ===
        "engagement-panel-searchable-transcript"
    );

    if (!transcriptPanel) return null;

    const panelContent =
      transcriptPanel.engagementPanelSectionListRenderer?.content;
    let token: string | null = null;

    // Token extraction Method A: Direct continuationItemRenderer
    const directItem = panelContent?.continuationItemRenderer;
    if (directItem?.continuationEndpoint?.getTranscriptEndpoint?.params) {
      token =
        directItem.continuationEndpoint.getTranscriptEndpoint.params;
    } else if (
      directItem?.continuationEndpoint?.continuationCommand?.token
    ) {
      token = directItem.continuationEndpoint.continuationCommand.token;
    }

    // Token extraction Method B: Inside sectionListRenderer
    if (
      !token &&
      panelContent?.sectionListRenderer?.contents?.[0]
        ?.continuationItemRenderer
    ) {
      const nested =
        panelContent.sectionListRenderer.contents[0]
          .continuationItemRenderer;
      if (nested?.continuationEndpoint?.getTranscriptEndpoint?.params) {
        token =
          nested.continuationEndpoint.getTranscriptEndpoint.params;
      } else if (
        nested?.continuationEndpoint?.continuationCommand?.token
      ) {
        token =
          nested.continuationEndpoint.continuationCommand.token;
      }
    }

    // Token extraction Method C: Via transcriptRenderer footer language menu
    if (!token && panelContent?.sectionListRenderer?.contents) {
      for (const item of panelContent.sectionListRenderer.contents) {
        if (item?.transcriptRenderer) {
          const menuItems =
            item.transcriptRenderer?.footer?.transcriptFooterRenderer
              ?.languageMenu?.sortFilterSubMenuRenderer?.subMenuItems;
          if (menuItems) {
            const selected =
              menuItems.find(
                (m: AnyJson) =>
                  m?.title?.toLowerCase().includes("english") ||
                  m?.selected
              ) || menuItems[0];
            if (
              selected?.continuation?.reloadContinuationData?.continuation
            ) {
              token =
                selected.continuation.reloadContinuationData.continuation;
              break;
            }
          }
        }
      }
    }

    if (!token) return null;

    // Step 2: Call /get_transcript with a fresh session
    const transcriptVisitorData = generateVisitorData();
    const transcriptHeaders = makeHeaders(transcriptVisitorData);
    const transcriptContext = makeContext(transcriptVisitorData);

    const transcriptResponse = await fetch(
      `${INNERTUBE_BASE}/get_transcript?key=${INNERTUBE_API_KEY}&prettyPrint=false`,
      {
        method: "POST",
        headers: transcriptHeaders,
        body: JSON.stringify({
          params: token,
          context: transcriptContext,
          visitorData: transcriptVisitorData,
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!transcriptResponse.ok) return null;
    const transcriptData = await transcriptResponse.json();

    // Parse transcript segments from the response
    const segments: AnyJson[] | undefined =
      transcriptData?.actions?.[0]?.updateEngagementPanelAction?.content
        ?.transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body
        ?.transcriptSegmentListRenderer?.initialSegments;

    if (!segments || !Array.isArray(segments)) return null;

    const captions: CaptionSegment[] = [];
    for (const segment of segments) {
      const renderer = segment?.transcriptSegmentRenderer;
      if (!renderer) continue;

      const startMs = parseInt(renderer.startMs || "0", 10);
      const endMs = parseInt(renderer.endMs || "0", 10);

      let text = "";
      if (renderer.snippet?.simpleText) {
        text = renderer.snippet.simpleText;
      } else if (renderer.snippet?.runs) {
        text = renderer.snippet.runs
          .map((r: { text: string }) => r.text)
          .join("");
      }

      text = decodeText(text);
      if (text) {
        captions.push({
          start: startMs / 1000,
          dur: (endMs - startMs) / 1000,
          text,
        });
      }
    }

    return captions.length > 0 ? { captions, title } : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Method 2: /player API for caption track XML URLs
// Traditional approach - asks YouTube for caption track URLs, then fetches XML.
// May not work from datacenter IPs as YouTube blocks caption data in responses.
// ─────────────────────────────────────────────────────────────────────────────
async function tryPlayerCaptions(
  videoId: string
): Promise<{ captions: CaptionSegment[]; title: string } | null> {
  try {
    const visitorData = generateVisitorData();
    const headers = makeHeaders(visitorData);
    const context = makeContext(visitorData);

    const response = await fetch(
      `${INNERTUBE_BASE}/player?key=${INNERTUBE_API_KEY}&prettyPrint=false`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          videoId,
          context,
          visitorData,
          playbackContext: {
            contentPlaybackContext: {
              vis: 0,
              splay: false,
              lactMilliseconds: "-1",
            },
          },
          racyCheckOk: true,
          contentCheckOk: true,
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) return null;
    const playerData = await response.json();

    const captionTracks =
      playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captionTracks || captionTracks.length === 0) return null;

    // Prefer English, then auto-generated English, then first available
    let track = captionTracks.find(
      (t: AnyJson) => t.vssId === ".en" || t.vssId === "a.en"
    );
    if (!track) {
      track = captionTracks.find(
        (t: AnyJson) => t.languageCode === "en"
      );
    }
    if (!track) track = captionTracks[0];
    if (!track?.baseUrl) return null;

    // Strip srv3 format to get plain XML
    const captionUrl = track.baseUrl.replace("&fmt=srv3", "");
    const captionResponse = await fetch(captionUrl, {
      headers: {
        "User-Agent": headers["User-Agent"],
        Referer: `https://www.youtube.com/watch?v=${videoId}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!captionResponse.ok) return null;
    const xml = await captionResponse.text();
    const captions = parseCaptionXml(xml);
    const title = playerData?.videoDetails?.title || "";

    return captions.length > 0 ? { captions, title } : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Method 3: Watch page scraping with consent cookies
// Last resort - fetches the full watch page HTML and extracts
// ytInitialPlayerResponse. Never throws - returns null on any failure.
// ─────────────────────────────────────────────────────────────────────────────
async function tryPageScraping(
  videoId: string
): Promise<{ captions: CaptionSegment[]; title: string } | null> {
  try {
    const response = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          Cookie:
            "CONSENT=PENDING+999; SOCS=CAESEwgDEgk2ODE4MTAyMjQaAmVuIAEaBgiA_ZC3Bg",
        },
        signal: AbortSignal.timeout(15000),
      }
    );

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

    // Extract ytInitialPlayerResponse using brace counting
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

    let playerResponse: AnyJson;
    try {
      playerResponse = JSON.parse(
        html.substring(braceStart, braceEnd + 1)
      );
    } catch {
      return null;
    }

    // Try caption tracks from the page player response
    const captionTracks =
      playerResponse?.captions?.playerCaptionsTracklistRenderer
        ?.captionTracks;
    if (!captionTracks || captionTracks.length === 0) return null;

    let track = captionTracks.find(
      (t: AnyJson) => t.vssId === ".en" || t.vssId === "a.en"
    );
    if (!track) {
      track = captionTracks.find(
        (t: AnyJson) => t.languageCode === "en"
      );
    }
    if (!track) track = captionTracks[0];
    if (!track?.baseUrl) return null;

    const captionResponse = await fetch(track.baseUrl, {
      signal: AbortSignal.timeout(10000),
    });
    if (!captionResponse.ok) return null;

    const xml = await captionResponse.text();
    const captions = parseCaptionXml(xml);

    return captions.length > 0
      ? { captions, title: playerResponse?.videoDetails?.title || title }
      : null;
  } catch {
    return null;
  }
}

// Main extraction: tries all methods in order, never throws except NO_CAPTIONS
async function extractCaptions(
  videoId: string
): Promise<{ captions: CaptionSegment[]; title: string }> {
  // Method 1: /next + /get_transcript (best for datacenter/serverless IPs)
  const transcriptResult = await tryGetTranscript(videoId);
  if (transcriptResult && transcriptResult.captions.length > 0) {
    return transcriptResult;
  }

  // Method 2: /player API for caption track XML
  const playerResult = await tryPlayerCaptions(videoId);
  if (playerResult && playerResult.captions.length > 0) {
    return playerResult;
  }

  // Method 3: Watch page scraping with consent cookies
  const scrapingResult = await tryPageScraping(videoId);
  if (scrapingResult && scrapingResult.captions.length > 0) {
    return scrapingResult;
  }

  // All methods failed
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
