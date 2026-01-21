import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Extract post info from Reddit URL
function extractPostInfo(url: string): { subreddit: string; postId: string } | null {
  const match = url.match(/reddit\.com\/r\/([^/]+)\/comments\/([a-z0-9]+)/i);
  if (match) {
    return { subreddit: match[1], postId: match[2] };
  }
  return null;
}

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

    const postInfo = extractPostInfo(url);
    if (!postInfo) {
      return NextResponse.json(
        { error: "Could not parse Reddit URL. Make sure it's a link to a post." },
        { status: 400 }
      );
    }

    // Use Reddit's public .json endpoint - works without any API key
    const jsonUrl = `https://www.reddit.com/r/${postInfo.subreddit}/comments/${postInfo.postId}.json`;

    const response = await fetch(jsonUrl, {
      headers: {
        // Mimic a real browser request
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
      },
    });

    if (!response.ok) {
      console.error("Reddit response:", response.status, response.statusText);
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Reddit post not found." },
          { status: 404 }
        );
      }
      if (response.status === 403 || response.status === 429) {
        return NextResponse.json(
          { error: "Reddit is temporarily blocking requests. Try again in a minute." },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch Reddit post." },
        { status: response.status }
      );
    }

    const data = await response.json();
    const postData = data[0]?.data?.children?.[0]?.data;

    if (!postData) {
      return NextResponse.json(
        { error: "Could not parse Reddit post data." },
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
      { error: "Failed to fetch Reddit post." },
      { status: 500 }
    );
  }
}
