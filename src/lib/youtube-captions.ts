/**
 * Where a YouTube video's caption track lives.
 *
 * The edge worker that used to answer this is optional now: with
 * YOUTUBE_WORKER_URL and YOUTUBE_WORKER_SECRET set it is asked first, and
 * without them the server asks YouTube itself, through the same InnerTube
 * clients and the same watch page fallback the worker ran. The request
 * shapes are the worker's own, so what worked at the edge works here.
 */

const WORKER_URL = process.env.YOUTUBE_WORKER_URL;
const WORKER_SECRET = process.env.YOUTUBE_WORKER_SECRET;

const INNERTUBE_CLIENTS: Array<{
  name: string;
  version: string;
  ua: string;
  extra?: Record<string, string | number>;
}> = [
  {
    name: "ANDROID",
    version: "20.10.38",
    ua: "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
  },
  {
    name: "IOS",
    version: "20.10.4",
    ua: "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X)",
    extra: { deviceMake: "Apple", deviceModel: "iPhone16,2", osName: "iPhone", osVersion: "18.3.2" },
  },
  {
    name: "ANDROID_VR",
    version: "1.65.10",
    ua: "com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip",
    extra: { deviceMake: "Oculus", deviceModel: "Quest 3", androidSdkVersion: 32, osName: "Android", osVersion: "12L" },
  },
];

interface CaptionTrack {
  baseUrl?: string;
  vssId?: string;
  languageCode?: string;
}

interface PlayerResponse {
  playabilityStatus?: { status?: string };
  videoDetails?: { title?: string };
  captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] } };
}

export interface CaptionTrackResult {
  title: string;
  trackUrl: string;
  lang: string;
  debug: string;
}

export interface CaptionSegment {
  start: number;
  dur: number;
  text: string;
}

function findEnglishTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  return (
    tracks.find((t) => t.vssId === ".en" || t.vssId === "a.en") ||
    tracks.find((t) => t.languageCode === "en") ||
    tracks[0] ||
    null
  );
}

function trackFrom(data: PlayerResponse): { trackUrl: string; lang: string } | null {
  const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks?.length) return null;
  const track = findEnglishTrack(tracks);
  if (!track?.baseUrl) return null;
  return {
    trackUrl: track.baseUrl.replace(/&fmt=[^&]*/g, "") + "&fmt=srv1",
    lang: track.languageCode || "en",
  };
}

// Extract ytInitialPlayerResponse from YouTube watch page HTML
function extractPlayerResponse(html: string): PlayerResponse | null {
  const markers = ["var ytInitialPlayerResponse = ", "ytInitialPlayerResponse = "];
  let start = -1;
  for (const marker of markers) {
    const idx = html.indexOf(marker);
    if (idx !== -1) {
      start = idx + marker.length;
      break;
    }
  }
  if (start === -1 || html[start] !== "{") return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < Math.min(start + 500_000, html.length); i++) {
    const ch = html[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.substring(start, i + 1)) as PlayerResponse;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/**
 * The caption track URL of a video, or an error whose message is the debug
 * trail of everything that was tried.
 */
export async function getCaptionTrack(videoId: string): Promise<CaptionTrackResult> {
  const debug: string[] = [];

  // Method 1: the edge worker, when one is configured
  if (WORKER_URL && WORKER_SECRET) {
    try {
      const resp = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Worker-Secret": WORKER_SECRET },
        body: JSON.stringify({ videoId }),
        signal: AbortSignal.timeout(10_000),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.trackUrl) {
          return { title: data.title || "", trackUrl: data.trackUrl, lang: data.lang || "en", debug: `worker: ${data.debug}` };
        }
        debug.push(`worker: OK but no trackUrl (${data.debug || "?"})`);
      } else {
        const data = await resp.json().catch(() => null);
        debug.push(`worker: HTTP ${resp.status} (${data?.debug || "?"})`);
      }
    } catch (e) {
      debug.push(`worker: ${e instanceof Error ? e.message : "error"}`);
    }
  } else {
    debug.push("worker: not configured");
  }

  // Method 2: the InnerTube clients, from the server
  for (const client of INNERTUBE_CLIENTS) {
    try {
      const resp = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": client.ua },
        body: JSON.stringify({
          videoId,
          contentCheckOk: true,
          racyCheckOk: true,
          context: {
            client: {
              clientName: client.name,
              clientVersion: client.version,
              hl: "en",
              gl: "US",
              ...(client.extra || {}),
            },
          },
        }),
        signal: AbortSignal.timeout(8_000),
      });

      if (!resp.ok) {
        debug.push(`${client.name}: HTTP ${resp.status}`);
        continue;
      }
      const data = (await resp.json()) as PlayerResponse;
      const status = data.playabilityStatus?.status || "?";
      const found = trackFrom(data);
      if (found) {
        return { title: data.videoDetails?.title || "", ...found, debug: [...debug, `${client.name}: OK`].join(" | ") };
      }
      debug.push(`${client.name}: ${status}, 0 tracks`);
    } catch (e) {
      debug.push(`${client.name}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  // Method 3: the watch page, with retries. YouTube 429s are very short lived
  // (2 to 3 seconds), so a retry after a pause usually goes through.
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
    try {
      const resp = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          Cookie: "CONSENT=PENDING+999",
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (resp.ok) {
        const html = await resp.text();
        const playerResponse = extractPlayerResponse(html);
        if (playerResponse) {
          const found = trackFrom(playerResponse);
          if (found) {
            return {
              title: playerResponse.videoDetails?.title || "",
              ...found,
              debug: [...debug, `watch: OK attempt ${attempt + 1}`].join(" | "),
            };
          }
          debug.push(`watch[${attempt + 1}]: ${playerResponse.playabilityStatus?.status || "?"}, no tracks`);
        } else {
          debug.push(`watch[${attempt + 1}]: no playerResponse (${html.length}b)`);
        }
        break;
      } else if (resp.status === 429) {
        debug.push(`watch[${attempt + 1}]: 429 (retrying...)`);
        continue;
      } else {
        debug.push(`watch[${attempt + 1}]: HTTP ${resp.status}`);
        break;
      }
    } catch (e) {
      debug.push(`watch[${attempt + 1}]: ${e instanceof Error ? e.message : "error"}`);
      break;
    }
  }

  throw new Error(debug.join(" | "));
}

function decodeXmlEntities(text: string): string {
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

/** The transcript behind a caption track URL, as timed segments. */
export async function fetchCaptionSegments(trackUrl: string): Promise<CaptionSegment[]> {
  const resp = await fetch(trackUrl, { signal: AbortSignal.timeout(15_000) });
  if (!resp.ok) throw new Error(`transcript: HTTP ${resp.status}`);
  const xml = await resp.text();

  const segments: CaptionSegment[] = [];
  const regex = /<text\s+start="([^"]*)"(?:\s+dur="([^"]*)")?[^>]*>([\s\S]*?)<\/text>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    const text = decodeXmlEntities(match[3]);
    if (text) segments.push({ start: parseFloat(match[1]), dur: parseFloat(match[2] || "0"), text });
  }
  return segments;
}
