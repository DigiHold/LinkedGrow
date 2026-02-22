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

// Diagnostic info collector - tracks what each method sees
interface DiagnosticInfo {
  method1: string;
  method2: string;
  method3: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Method 1: /player + /next + /get_transcript
// Matches youtube-caption-extractor's flow exactly:
// 1. Call /player first (to get video status + potentially captions)
// 2. Call /next with SAME session (to get transcript engagement panel)
// 3. Call /get_transcript with the panel's continuation token
// ─────────────────────────────────────────────────────────────────────────────
async function tryTranscriptApi(
  videoId: string,
  diag: DiagnosticInfo
): Promise<{ captions: CaptionSegment[]; title: string } | null> {
  try {
    const visitorData = generateVisitorData();
    const headers = makeHeaders(visitorData);
    const context = makeContext(visitorData);

    // Step 1: Call /player first (same session)
    const playerResponse = await fetch(
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

    if (!playerResponse.ok) {
      diag.method1 = `player HTTP ${playerResponse.status}`;
      return null;
    }

    const playerData = await playerResponse.json();
    const playabilityStatus = playerData?.playabilityStatus?.status || "unknown";
    const title = playerData?.videoDetails?.title || "";

    // If player has captions, use them directly
    const captionTracks =
      playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (captionTracks && captionTracks.length > 0) {
      let track = captionTracks.find(
        (t: AnyJson) => t.vssId === ".en" || t.vssId === "a.en"
      );
      if (!track) track = captionTracks.find((t: AnyJson) => t.languageCode === "en");
      if (!track) track = captionTracks[0];

      if (track?.baseUrl) {
        const captionUrl = track.baseUrl.replace("&fmt=srv3", "");
        try {
          const captionResponse = await fetch(captionUrl, {
            headers: {
              "User-Agent": headers["User-Agent"],
              Referer: `https://www.youtube.com/watch?v=${videoId}`,
            },
            signal: AbortSignal.timeout(10000),
          });
          if (captionResponse.ok) {
            const xml = await captionResponse.text();
            const captions = parseCaptionXml(xml);
            if (captions.length > 0) {
              diag.method1 = `player captions OK (${captions.length} segments)`;
              return { captions, title };
            }
          }
        } catch {
          // Caption XML fetch failed, continue to /next
        }
      }
    }

    diag.method1 = `player status=${playabilityStatus}, tracks=${captionTracks?.length || 0}`;

    // Step 2: Call /next with SAME session to get engagement panels
    const nextResponse = await fetch(
      `${INNERTUBE_BASE}/next?key=${INNERTUBE_API_KEY}&prettyPrint=false`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ videoId, context, visitorData }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!nextResponse.ok) {
      diag.method1 += ` -> next HTTP ${nextResponse.status}`;
      return null;
    }

    const nextData = await nextResponse.json();

    // Extract title from next if player didn't have it
    let videoTitle = title;
    if (!videoTitle) {
      const titleRuns =
        nextData?.contents?.twoColumnWatchNextResults?.results?.results
          ?.contents?.[0]?.videoPrimaryInfoRenderer?.title?.runs;
      if (titleRuns) {
        videoTitle = titleRuns.map((r: { text: string }) => r.text).join("");
      }
      if (!videoTitle) {
        videoTitle = nextData?.metadata?.videoMetadataRenderer?.title?.simpleText || "";
      }
    }

    // Find transcript engagement panel
    const engagementPanels: AnyJson[] = nextData?.engagementPanels || [];
    const panelIds = engagementPanels
      .map((p: AnyJson) => p?.engagementPanelSectionListRenderer?.panelIdentifier)
      .filter(Boolean);

    const transcriptPanel = engagementPanels.find(
      (panel: AnyJson) =>
        panel?.engagementPanelSectionListRenderer?.panelIdentifier ===
        "engagement-panel-searchable-transcript"
    );

    if (!transcriptPanel) {
      diag.method1 += ` -> next OK, panels=[${panelIds.join(",")}], NO transcript panel`;
      return null;
    }

    const panelContent =
      transcriptPanel.engagementPanelSectionListRenderer?.content;
    let token: string | null = null;
    let tokenSource = "";

    // Token extraction Method A: Direct continuationItemRenderer
    const directItem = panelContent?.continuationItemRenderer;
    if (directItem?.continuationEndpoint?.getTranscriptEndpoint?.params) {
      token = directItem.continuationEndpoint.getTranscriptEndpoint.params;
      tokenSource = "A-getTranscript";
    } else if (directItem?.continuationEndpoint?.continuationCommand?.token) {
      token = directItem.continuationEndpoint.continuationCommand.token;
      tokenSource = "A-continuation";
    }

    // Token extraction Method B: Inside sectionListRenderer
    if (!token && panelContent?.sectionListRenderer?.contents?.[0]?.continuationItemRenderer) {
      const nested = panelContent.sectionListRenderer.contents[0].continuationItemRenderer;
      if (nested?.continuationEndpoint?.getTranscriptEndpoint?.params) {
        token = nested.continuationEndpoint.getTranscriptEndpoint.params;
        tokenSource = "B-getTranscript";
      } else if (nested?.continuationEndpoint?.continuationCommand?.token) {
        token = nested.continuationEndpoint.continuationCommand.token;
        tokenSource = "B-continuation";
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
                  m?.title?.toLowerCase().includes("english") || m?.selected
              ) || menuItems[0];
            if (selected?.continuation?.reloadContinuationData?.continuation) {
              token = selected.continuation.reloadContinuationData.continuation;
              tokenSource = "C-languageMenu";
              break;
            }
          }
        }
      }
    }

    if (!token) {
      // Log the panel content structure to understand why no token was found
      const contentKeys = panelContent ? Object.keys(panelContent) : [];
      diag.method1 += ` -> transcript panel found, contentKeys=[${contentKeys.join(",")}], NO token`;
      return null;
    }

    diag.method1 += ` -> token via ${tokenSource}`;

    // Step 3: Call /get_transcript - try SAME session first, then new session
    // The token may be bound to the session that created it
    const sessions = [
      { vis: visitorData, hdr: headers, ctx: context, label: "same-session" },
      { vis: generateVisitorData(), hdr: makeHeaders(generateVisitorData()), ctx: makeContext(generateVisitorData()), label: "new-session" },
    ];

    let transcriptData: AnyJson = null;
    for (const s of sessions) {
      const transcriptResponse = await fetch(
        `${INNERTUBE_BASE}/get_transcript?key=${INNERTUBE_API_KEY}`,
        {
          method: "POST",
          headers: s.hdr,
          body: JSON.stringify({
            context: s.ctx,
            visitorData: s.vis,
            params: token,
          }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (transcriptResponse.ok) {
        transcriptData = await transcriptResponse.json();
        diag.method1 += ` -> get_transcript OK (${s.label})`;
        break;
      }

      // Read error body for diagnostics
      let errorBody = "";
      try { errorBody = (await transcriptResponse.text()).substring(0, 200); } catch { /* */ }
      diag.method1 += ` -> get_transcript ${s.label} HTTP ${transcriptResponse.status} [${errorBody}]`;
    }

    if (!transcriptData) {
      return null;
    }

    // Parse transcript segments from the response
    const segments: AnyJson[] | undefined =
      transcriptData?.actions?.[0]?.updateEngagementPanelAction?.content
        ?.transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body
        ?.transcriptSegmentListRenderer?.initialSegments;

    if (!segments || !Array.isArray(segments)) {
      // Log what we got to understand the structure
      const actionKeys = transcriptData?.actions?.[0]
        ? Object.keys(transcriptData.actions[0])
        : [];
      diag.method1 += ` -> get_transcript OK, actionKeys=[${actionKeys.join(",")}], no segments`;
      return null;
    }

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

    if (captions.length > 0) {
      diag.method1 += ` -> ${captions.length} segments OK`;
      return { captions, title: videoTitle };
    }

    diag.method1 += ` -> ${segments.length} raw segments, 0 parsed`;
    return null;
  } catch (err) {
    diag.method1 = `error: ${err instanceof Error ? err.message : String(err)}`;
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Method 2: Watch page scraping + caption XML
// Fetches the watch page HTML, extracts ytInitialPlayerResponse,
// then fetches the caption track XML.
// ─────────────────────────────────────────────────────────────────────────────
async function tryPageScraping(
  videoId: string,
  diag: DiagnosticInfo
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

    if (!response.ok) {
      diag.method2 = `page HTTP ${response.status}`;
      return null;
    }

    const html = await response.text();
    diag.method2 = `page ${(html.length / 1024).toFixed(0)}KB`;

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
    if (markerIdx === -1) {
      diag.method2 += ", no ytInitialPlayerResponse marker";
      return null;
    }

    const braceStart = html.indexOf("{", markerIdx + marker.length);
    if (braceStart === -1) {
      diag.method2 += ", no brace after marker";
      return null;
    }

    let depth = 0;
    let inString = false;
    let escaped = false;
    let braceEnd = -1;

    for (let i = braceStart; i < html.length; i++) {
      const char = html[i];
      if (escaped) { escaped = false; continue; }
      if (char === "\\" && inString) { escaped = true; continue; }
      if (char === '"' && !escaped) { inString = !inString; continue; }
      if (inString) continue;
      if (char === "{") depth++;
      else if (char === "}") {
        depth--;
        if (depth === 0) { braceEnd = i; break; }
      }
    }

    if (braceEnd === -1) {
      diag.method2 += ", brace counting failed";
      return null;
    }

    let playerResponse: AnyJson;
    try {
      playerResponse = JSON.parse(html.substring(braceStart, braceEnd + 1));
    } catch {
      diag.method2 += ", JSON parse failed";
      return null;
    }

    const playabilityStatus = playerResponse?.playabilityStatus?.status || "unknown";
    const captionTracks =
      playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks || captionTracks.length === 0) {
      diag.method2 += `, status=${playabilityStatus}, no caption tracks`;
      return null;
    }

    let track = captionTracks.find(
      (t: AnyJson) => t.vssId === ".en" || t.vssId === "a.en"
    );
    if (!track) track = captionTracks.find((t: AnyJson) => t.languageCode === "en");
    if (!track) track = captionTracks[0];
    if (!track?.baseUrl) {
      diag.method2 += `, ${captionTracks.length} tracks but no baseUrl`;
      return null;
    }

    const captionResponse = await fetch(track.baseUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!captionResponse.ok) {
      diag.method2 += `, caption XML HTTP ${captionResponse.status}`;
      return null;
    }

    const xml = await captionResponse.text();
    const captions = parseCaptionXml(xml);

    if (captions.length > 0) {
      diag.method2 += `, ${captions.length} segments OK`;
      return { captions, title: playerResponse?.videoDetails?.title || title };
    }

    diag.method2 += `, caption XML empty (${xml.length} bytes)`;
    return null;
  } catch (err) {
    diag.method2 = `error: ${err instanceof Error ? err.message : String(err)}`;
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Method 3: Direct timedtext URL
// Tries to fetch caption XML directly without any API call.
// This URL format sometimes works without authentication.
// ─────────────────────────────────────────────────────────────────────────────
async function tryDirectTimedtext(
  videoId: string,
  diag: DiagnosticInfo
): Promise<{ captions: CaptionSegment[]; title: string } | null> {
  try {
    // Try common caption languages
    const langs = ["en", "a.en", "fr", "a.fr"];
    for (const lang of langs) {
      const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=srv1`;
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          Referer: `https://www.youtube.com/watch?v=${videoId}`,
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) continue;

      const xml = await response.text();
      if (!xml || xml.length < 50 || !xml.includes("<text")) continue;

      const captions = parseCaptionXml(xml);
      if (captions.length > 0) {
        diag.method3 = `timedtext lang=${lang}, ${captions.length} segments OK`;
        return { captions, title: "" };
      }
    }

    diag.method3 = "timedtext all langs empty";
    return null;
  } catch (err) {
    diag.method3 = `error: ${err instanceof Error ? err.message : String(err)}`;
    return null;
  }
}

// Main extraction: tries all methods in order
async function extractCaptions(
  videoId: string
): Promise<{ captions: CaptionSegment[]; title: string; debug?: string }> {
  const diag: DiagnosticInfo = {
    method1: "not tried",
    method2: "not tried",
    method3: "not tried",
  };

  // Method 1: /player + /next + /get_transcript (best for datacenter IPs)
  const transcriptResult = await tryTranscriptApi(videoId, diag);
  if (transcriptResult && transcriptResult.captions.length > 0) {
    return transcriptResult;
  }

  // Method 2: Watch page scraping + caption XML
  const scrapingResult = await tryPageScraping(videoId, diag);
  if (scrapingResult && scrapingResult.captions.length > 0) {
    return scrapingResult;
  }

  // Method 3: Direct timedtext URL
  const timedtextResult = await tryDirectTimedtext(videoId, diag);
  if (timedtextResult && timedtextResult.captions.length > 0) {
    return timedtextResult;
  }

  // All methods failed - include diagnostic info
  const debugInfo = `M1: ${diag.method1} | M2: ${diag.method2} | M3: ${diag.method3}`;
  console.error(`YouTube caption extraction failed for ${videoId}: ${debugInfo}`);

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
        // Include debug info for admin users so we can diagnose
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
