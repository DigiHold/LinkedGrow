import { NextRequest, NextResponse } from "next/server";

// Extract LinkedIn post/activity ID from various URL formats
function extractLinkedInPostId(url: string): string | null {
  // Patterns:
  // https://www.linkedin.com/posts/username_activity-1234567890-abcd
  // https://www.linkedin.com/feed/update/urn:li:activity:1234567890/
  // https://www.linkedin.com/feed/update/urn:li:ugcPost:1234567890/
  // https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:1234567890

  const activityMatch = url.match(/activity[:\-](\d+)/);
  if (activityMatch) return activityMatch[1];

  const ugcMatch = url.match(/ugcPost[:\-](\d+)/);
  if (ugcMatch) return ugcMatch[1];

  const shareMatch = url.match(/share[:\-](\d+)/);
  if (shareMatch) return shareMatch[1];

  return null;
}

// Validate the URL is actually a LinkedIn URL
function isValidLinkedInUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "www.linkedin.com" ||
      parsed.hostname === "linkedin.com" ||
      parsed.hostname === "m.linkedin.com"
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Please provide a LinkedIn post URL" },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();

    if (!isValidLinkedInUrl(trimmedUrl)) {
      return NextResponse.json(
        { error: "Please provide a valid LinkedIn URL (linkedin.com)" },
        { status: 400 }
      );
    }

    const postId = extractLinkedInPostId(trimmedUrl);
    if (!postId) {
      return NextResponse.json(
        { error: "Could not find a LinkedIn post or activity ID in this URL. Make sure you copied the full post URL." },
        { status: 400 }
      );
    }

    // Fetch the LinkedIn post page to extract video URL from meta tags
    // LinkedIn embeds video URLs in og:video meta tags on public posts
    const embedUrl = `https://www.linkedin.com/embed/feed/update/urn:li:activity:${postId}`;

    const response = await fetch(embedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      // Try with ugcPost URN instead
      const ugcResponse = await fetch(
        `https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:${postId}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        }
      );

      if (!ugcResponse.ok) {
        return NextResponse.json(
          { error: "Could not access this LinkedIn post. Make sure the post is public and the URL is correct." },
          { status: 404 }
        );
      }

      const ugcHtml = await ugcResponse.text();
      return extractVideoFromHtml(ugcHtml);
    }

    const html = await response.text();
    return extractVideoFromHtml(html);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

function extractVideoFromHtml(html: string): NextResponse {
  // Look for video URL in various places LinkedIn might put it
  // 1. data-sources attribute (JSON array of video sources)
  const dataSourcesMatch = html.match(/data-sources="([^"]+)"/);
  if (dataSourcesMatch) {
    try {
      const decoded = dataSourcesMatch[1]
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&");
      const sources = JSON.parse(decoded);
      if (Array.isArray(sources) && sources.length > 0) {
        // Get the highest quality source
        const best = sources.reduce(
          (prev: { width?: number }, curr: { width?: number }) =>
            (curr.width || 0) > (prev.width || 0) ? curr : prev,
          sources[0]
        );
        return NextResponse.json({
          videoUrl: best.src || best.url,
          quality: best.width ? `${best.width}p` : "HD",
          sources: sources.map((s: { src?: string; url?: string; width?: number }) => ({
            url: s.src || s.url,
            quality: s.width ? `${s.width}p` : "SD",
          })),
        });
      }
    } catch {
      // Continue to next extraction method
    }
  }

  // 2. Look for video source in <source> tags
  const sourceMatch = html.match(/<source[^>]+src="([^"]+)"[^>]*type="video\/mp4"/);
  if (sourceMatch) {
    const videoUrl = sourceMatch[1].replace(/&amp;/g, "&");
    return NextResponse.json({
      videoUrl,
      quality: "HD",
      sources: [{ url: videoUrl, quality: "HD" }],
    });
  }

  // 3. Look for video URL in <video> tag
  const videoTagMatch = html.match(/<video[^>]+src="([^"]+)"/);
  if (videoTagMatch) {
    const videoUrl = videoTagMatch[1].replace(/&amp;/g, "&");
    return NextResponse.json({
      videoUrl,
      quality: "HD",
      sources: [{ url: videoUrl, quality: "HD" }],
    });
  }

  // 4. Look for any LinkedIn video CDN URL in the HTML
  const cdnMatch = html.match(
    /https:\/\/dms\.licdn\.com\/playlist\/vid\/[^"'\s]+/
  );
  if (cdnMatch) {
    const videoUrl = cdnMatch[0].replace(/&amp;/g, "&");
    return NextResponse.json({
      videoUrl,
      quality: "HD",
      sources: [{ url: videoUrl, quality: "HD" }],
    });
  }

  // 5. Alternative CDN pattern
  const altCdnMatch = html.match(
    /https:\/\/[a-z0-9-]+\.licdn\.com\/[^"'\s]*\.mp4[^"'\s]*/
  );
  if (altCdnMatch) {
    const videoUrl = altCdnMatch[0].replace(/&amp;/g, "&");
    return NextResponse.json({
      videoUrl,
      quality: "HD",
      sources: [{ url: videoUrl, quality: "HD" }],
    });
  }

  return NextResponse.json(
    {
      error:
        "No video found in this LinkedIn post. This might be a text-only post, an image post, or the video may be restricted. Make sure the post contains a native LinkedIn video.",
    },
    { status: 404 }
  );
}
