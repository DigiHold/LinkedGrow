import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Server-side Reddit fetch to bypass CORS restrictions
// Reddit blocks client-side fetches from browsers due to CORS policy

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

    // Fetch from Reddit's JSON API server-side (no CORS issues)
    const response = await fetch(jsonUrl, {
      headers: {
        // Use a browser-like User-Agent to avoid being blocked
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        return NextResponse.json(
          { error: "Reddit blocked this request. The post may be private or Reddit is rate limiting." },
          { status: 403 }
        );
      }
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Reddit post not found. Check that the URL is correct." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch Reddit post. Please try again." },
        { status: response.status }
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
