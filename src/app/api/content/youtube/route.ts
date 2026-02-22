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

const INNERTUBE_BASE = "https://www.youtube.com/youtubei/v1";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

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

// Extract a JSON object from HTML using brace counting (handles nested objects)
function extractJsonObject(html: string, marker: string): AnyJson | null {
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) return null;

  const braceStart = html.indexOf("{", markerIdx + marker.length);
  if (braceStart === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = braceStart; i < html.length; i++) {
    const char = html[i];
    if (escaped) { escaped = false; continue; }
    if (char === "\\" && inString) { escaped = true; continue; }
    if (char === '"' && !escaped) { inString = !inString; continue; }
    if (inString) continue;
    if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.substring(braceStart, i + 1));
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

// Extract transcript continuation token from engagement panels
function findTranscriptToken(engagementPanels: AnyJson[]): string | null {
  const transcriptPanel = engagementPanels.find(
    (panel: AnyJson) =>
      panel?.engagementPanelSectionListRenderer?.panelIdentifier ===
      "engagement-panel-searchable-transcript"
  );

  if (!transcriptPanel) return null;

  const panelContent =
    transcriptPanel.engagementPanelSectionListRenderer?.content;
  if (!panelContent) return null;

  // Method A: Direct continuationItemRenderer
  const directItem = panelContent?.continuationItemRenderer;
  if (directItem?.continuationEndpoint?.getTranscriptEndpoint?.params) {
    return directItem.continuationEndpoint.getTranscriptEndpoint.params;
  }
  if (directItem?.continuationEndpoint?.continuationCommand?.token) {
    return directItem.continuationEndpoint.continuationCommand.token;
  }

  // Method B: Inside sectionListRenderer
  const nestedItem =
    panelContent?.sectionListRenderer?.contents?.[0]?.continuationItemRenderer;
  if (nestedItem?.continuationEndpoint?.getTranscriptEndpoint?.params) {
    return nestedItem.continuationEndpoint.getTranscriptEndpoint.params;
  }
  if (nestedItem?.continuationEndpoint?.continuationCommand?.token) {
    return nestedItem.continuationEndpoint.continuationCommand.token;
  }

  // Method C: Via transcriptRenderer footer language menu
  if (panelContent?.sectionListRenderer?.contents) {
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
            return selected.continuation.reloadContinuationData.continuation;
          }
        }
      }
    }
  }

  return null;
}

// Parse transcript segments from /get_transcript response
function parseTranscriptSegments(data: AnyJson): CaptionSegment[] {
  const segments: AnyJson[] | undefined =
    data?.actions?.[0]?.updateEngagementPanelAction?.content
      ?.transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body
      ?.transcriptSegmentListRenderer?.initialSegments;

  if (!segments || !Array.isArray(segments)) return [];

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

  return captions;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY METHOD: Page-based transcript extraction
//
// This simulates what a real browser does when you click "Show Transcript":
// 1. Load the YouTube watch page (gets real cookies + session)
// 2. Extract ytInitialData which has the transcript engagement panel
// 3. Extract the real API key, visitor data, and session cookies from the page
// 4. Call /get_transcript with REAL session credentials
//
// This works because the page fetch creates a real YouTube session, and we
// reuse those exact credentials for the transcript API call.
// ─────────────────────────────────────────────────────────────────────────────
async function tryPageBasedTranscript(
  videoId: string,
  debug: string[]
): Promise<{ captions: CaptionSegment[]; title: string } | null> {
  try {
    // Step 1: Fetch the YouTube watch page
    const pageResponse = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          "User-Agent": UA,
          "Accept-Language": "en-US,en;q=0.9",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          Cookie:
            "CONSENT=PENDING+999; SOCS=CAESEwgDEgk2ODE4MTAyMjQaAmVuIAEaBgiA_ZC3Bg",
        },
        signal: AbortSignal.timeout(15000),
        redirect: "follow",
      }
    );

    if (!pageResponse.ok) {
      debug.push(`page HTTP ${pageResponse.status}`);
      return null;
    }

    const html = await pageResponse.text();
    debug.push(`page ${(html.length / 1024).toFixed(0)}KB`);

    // Step 2: Extract real session data from the page
    // Get cookies from Set-Cookie headers
    const setCookieHeaders = pageResponse.headers.getSetCookie?.() || [];
    const pageCookies = setCookieHeaders
      .map((c: string) => c.split(";")[0])
      .filter(Boolean)
      .join("; ");

    // Also keep our consent cookies and add page cookies
    const allCookies = pageCookies
      ? `CONSENT=PENDING+999; SOCS=CAESEwgDEgk2ODE4MTAyMjQaAmVuIAEaBgiA_ZC3Bg; ${pageCookies}`
      : "CONSENT=PENDING+999; SOCS=CAESEwgDEgk2ODE4MTAyMjQaAmVuIAEaBgiA_ZC3Bg";

    // Extract INNERTUBE_API_KEY from page
    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY"\s*:\s*"([^"]+)"/);
    const apiKey = apiKeyMatch?.[1] || "REMOVED";

    // Extract real VISITOR_DATA from page (ytcfg)
    const visitorDataMatch = html.match(/"VISITOR_DATA"\s*:\s*"([^"]+)"/);
    const visitorData = visitorDataMatch?.[1] || "";

    // Extract client version from page
    const clientVersionMatch = html.match(/"INNERTUBE_CLIENT_VERSION"\s*:\s*"([^"]+)"/);
    const clientVersion = clientVersionMatch?.[1] || "2.20250220.01.00";

    debug.push(`cookies=${setCookieHeaders.length}, visitor=${visitorData ? "yes" : "no"}, ver=${clientVersion}`);

    // Step 3: Extract title
    let title = "";
    const titleMatch =
      html.match(/<meta\s+name="title"\s+content="([^"]*)"/) ||
      html.match(/<title>([^<]*)<\/title>/);
    if (titleMatch) {
      title = titleMatch[1].replace(" - YouTube", "").trim();
    }

    // Step 4: Try to get captions from ytInitialPlayerResponse first
    const playerData = extractJsonObject(html, "ytInitialPlayerResponse");
    if (playerData) {
      const captionTracks =
        playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (captionTracks && captionTracks.length > 0) {
        let track = captionTracks.find(
          (t: AnyJson) => t.vssId === ".en" || t.vssId === "a.en"
        );
        if (!track) track = captionTracks.find((t: AnyJson) => t.languageCode === "en");
        if (!track) track = captionTracks[0];

        if (track?.baseUrl) {
          try {
            const captionResponse = await fetch(track.baseUrl, {
              headers: { "User-Agent": UA, Cookie: allCookies },
              signal: AbortSignal.timeout(10000),
            });
            if (captionResponse.ok) {
              const xml = await captionResponse.text();
              const captions = parseCaptionXml(xml);
              if (captions.length > 0) {
                debug.push(`player captions OK (${captions.length})`);
                return { captions, title: playerData?.videoDetails?.title || title };
              }
            }
          } catch { /* continue to ytInitialData approach */ }
        }
      }
      debug.push(`player status=${playerData?.playabilityStatus?.status || "?"}, tracks=${captionTracks?.length || 0}`);
    } else {
      debug.push("no playerResponse in HTML");
    }

    // Step 5: Extract ytInitialData and find transcript token
    const initialData = extractJsonObject(html, "ytInitialData");
    if (!initialData) {
      debug.push("no ytInitialData");
      return null;
    }

    const engagementPanels: AnyJson[] = initialData?.engagementPanels || [];
    const token = findTranscriptToken(engagementPanels);

    if (!token) {
      const panelIds = engagementPanels
        .map((p: AnyJson) => p?.engagementPanelSectionListRenderer?.panelIdentifier)
        .filter(Boolean);
      debug.push(`ytInitialData panels=[${panelIds.join(",")}], no token`);
      return null;
    }

    debug.push("token found");

    // Step 6: Call /get_transcript with REAL session data from the page
    const context = {
      client: {
        hl: "en",
        gl: "US",
        clientName: "WEB",
        clientVersion: clientVersion,
        ...(visitorData ? { visitorData } : {}),
      },
      user: { enableSafetyMode: false },
      request: { useSsl: true },
    };

    const transcriptResponse = await fetch(
      `${INNERTUBE_BASE}/get_transcript?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          "User-Agent": UA,
          "X-Youtube-Client-Version": clientVersion,
          "X-Youtube-Client-Name": "1",
          ...(visitorData ? { "X-Goog-Visitor-Id": visitorData } : {}),
          Origin: "https://www.youtube.com",
          Referer: `https://www.youtube.com/watch?v=${videoId}`,
          Cookie: allCookies,
        },
        body: JSON.stringify({
          context,
          ...(visitorData ? { visitorData } : {}),
          params: token,
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!transcriptResponse.ok) {
      let errorBody = "";
      try { errorBody = (await transcriptResponse.text()).substring(0, 150); } catch { /* */ }
      debug.push(`get_transcript HTTP ${transcriptResponse.status} [${errorBody}]`);
      return null;
    }

    const transcriptData = await transcriptResponse.json();
    const captions = parseTranscriptSegments(transcriptData);

    if (captions.length > 0) {
      debug.push(`transcript OK (${captions.length} segments)`);
      // Get title from ytInitialData if not from player
      if (!title) {
        title = initialData?.contents?.twoColumnWatchNextResults?.results?.results
          ?.contents?.[0]?.videoPrimaryInfoRenderer?.title?.runs?.[0]?.text || "";
      }
      return { captions, title };
    }

    debug.push(`transcript response parsed, 0 segments`);
    return null;
  } catch (err) {
    debug.push(`error: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK: InnerTube API with /player + /next + /get_transcript
// Uses generated session data (no page fetch). Less reliable from datacenter
// but avoids the extra page fetch overhead.
// ─────────────────────────────────────────────────────────────────────────────
async function tryInnerTubeApi(
  videoId: string,
  debug: string[]
): Promise<{ captions: CaptionSegment[]; title: string } | null> {
  try {
    // Generate random visitor data
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let visitorData = "";
    for (let i = 0; i < 11; i++) {
      visitorData += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const apiKey = "REMOVED";
    const clientVersion = "2.20250220.01.00";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "*/*",
      "User-Agent": UA,
      "X-Youtube-Client-Version": clientVersion,
      "X-Youtube-Client-Name": "1",
      "X-Goog-Visitor-Id": visitorData,
      Origin: "https://www.youtube.com",
      Referer: "https://www.youtube.com/",
    };

    const context = {
      client: {
        hl: "en",
        gl: "US",
        clientName: "WEB",
        clientVersion: clientVersion,
        visitorData,
      },
      user: { enableSafetyMode: false },
      request: { useSsl: true },
    };

    // Call /player
    const playerResponse = await fetch(
      `${INNERTUBE_BASE}/player?key=${apiKey}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          videoId,
          context,
          visitorData,
          playbackContext: {
            contentPlaybackContext: { vis: 0, splay: false, lactMilliseconds: "-1" },
          },
          racyCheckOk: true,
          contentCheckOk: true,
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!playerResponse.ok) {
      debug.push(`API player HTTP ${playerResponse.status}`);
      return null;
    }

    const playerData = await playerResponse.json();
    const title = playerData?.videoDetails?.title || "";

    // Try player captions
    const captionTracks =
      playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (captionTracks && captionTracks.length > 0) {
      let track = captionTracks.find(
        (t: AnyJson) => t.vssId === ".en" || t.vssId === "a.en"
      );
      if (!track) track = captionTracks.find((t: AnyJson) => t.languageCode === "en");
      if (!track) track = captionTracks[0];

      if (track?.baseUrl) {
        try {
          const resp = await fetch(track.baseUrl.replace("&fmt=srv3", ""), {
            headers: { "User-Agent": UA },
            signal: AbortSignal.timeout(10000),
          });
          if (resp.ok) {
            const xml = await resp.text();
            const captions = parseCaptionXml(xml);
            if (captions.length > 0) {
              debug.push(`API player captions OK (${captions.length})`);
              return { captions, title };
            }
          }
        } catch { /* continue */ }
      }
    }

    // Call /next with same session
    const nextResponse = await fetch(
      `${INNERTUBE_BASE}/next?key=${apiKey}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ videoId, context, visitorData }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!nextResponse.ok) {
      debug.push(`API next HTTP ${nextResponse.status}`);
      return null;
    }

    const nextData = await nextResponse.json();
    const engagementPanels: AnyJson[] = nextData?.engagementPanels || [];
    const token = findTranscriptToken(engagementPanels);

    if (!token) {
      debug.push("API no transcript token");
      return null;
    }

    // Call /get_transcript with same session
    const transcriptResponse = await fetch(
      `${INNERTUBE_BASE}/get_transcript?key=${apiKey}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ context, visitorData, params: token }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!transcriptResponse.ok) {
      debug.push(`API get_transcript HTTP ${transcriptResponse.status}`);
      return null;
    }

    const transcriptData = await transcriptResponse.json();
    const captions = parseTranscriptSegments(transcriptData);

    if (captions.length > 0) {
      let videoTitle = title;
      if (!videoTitle) {
        videoTitle = nextData?.contents?.twoColumnWatchNextResults?.results?.results
          ?.contents?.[0]?.videoPrimaryInfoRenderer?.title?.runs?.[0]?.text || "";
      }
      debug.push(`API transcript OK (${captions.length})`);
      return { captions, title: videoTitle };
    }

    debug.push("API transcript 0 segments");
    return null;
  } catch (err) {
    debug.push(`API error: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

// Main extraction
async function extractCaptions(
  videoId: string
): Promise<{ captions: CaptionSegment[]; title: string; debug?: string }> {
  const debug: string[] = [];

  // Method 1: Page-based extraction with real cookies/session (primary)
  const pageResult = await tryPageBasedTranscript(videoId, debug);
  if (pageResult && pageResult.captions.length > 0) {
    return pageResult;
  }

  // Method 2: InnerTube API with generated session (fallback)
  const apiResult = await tryInnerTubeApi(videoId, debug);
  if (apiResult && apiResult.captions.length > 0) {
    return apiResult;
  }

  // All methods failed
  const debugInfo = debug.join(" | ");
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
