import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Server-side Reddit fetch to bypass CORS restrictions
// Reddit blocks requests from servers/bots, so we use their official RSS/JSON feeds
// which are more permissive than the main API

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url || !url.includes("reddit.com")) {
      return NextResponse.json({ error: "Invalid Reddit URL" }, { status: 400 });
    }

    // Convert regular Reddit URL to JSON API URL
    let jsonUrl = url.trim();

    // Remove query parameters and trailing slashes
    jsonUrl = jsonUrl.split("?")[0].replace(/\/+$/, "");

    // Add .json extension
    jsonUrl = jsonUrl + ".json";

    // Try multiple approaches
    const userAgents = [
      // Reddit's own bot format (most likely to work)
      "bot: LinkedGrow:v1.0 (by /u/linkedgrow)",
      // Generic curl-like agent
      "curl/7.64.1",
      // Node.js default
      "node-fetch/1.0",
    ];

    let response: Response | null = null;
    let lastError: string = "";

    for (const userAgent of userAgents) {
      try {
        response = await fetch(jsonUrl, {
          headers: {
            "User-Agent": userAgent,
            "Accept": "application/json, text/plain, */*",
          },
          // Add a small delay to avoid rate limiting
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          break;
        }

        lastError = `Status ${response.status}`;
      } catch (e) {
        lastError = e instanceof Error ? e.message : "Request failed";
      }
    }

    if (!response || !response.ok) {
      // If all attempts failed, provide a helpful error
      return NextResponse.json(
        {
          error: "Unable to fetch Reddit post. Reddit may be blocking automated requests. Try copying the post content manually.",
          details: lastError
        },
        { status: 503 }
      );
    }

    const data = await response.json();

    // Reddit JSON structure: [post data, comments data]
    const postData = data[0]?.data?.children?.[0]?.data;

    if (!postData) {
      return NextResponse.json(
        { error: "Could not parse Reddit post data. The URL may not be a valid post." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      title: postData.title || "",
      selftext: postData.selftext || "",
      subreddit: postData.subreddit || "",
      score: postData.score || 0,
      num_comments: postData.num_comments || 0,
      author: postData.author || "",
      url: postData.url || "",
    });
  } catch (error) {
    console.error("Reddit fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Reddit post. Please check the URL and try again." },
      { status: 500 }
    );
  }
}
