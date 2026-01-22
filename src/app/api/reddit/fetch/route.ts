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

// Trim Reddit JSON to reduce token count for AI processing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function trimRedditData(rawJson: any[]): { post: any; comments: any[] } {
  // rawJson is an array: [0] = post data, [1] = comments
  const postData = rawJson[0]?.data?.children?.[0]?.data;
  const commentsData = rawJson[1]?.data?.children || [];

  if (!postData) {
    throw new Error("Invalid Reddit JSON structure");
  }

  // Extract only essential post fields
  const post = {
    title: postData.title,
    selftext: postData.selftext ? postData.selftext.substring(0, 2000) : "",
    score: postData.score,
    upvote_ratio: postData.upvote_ratio,
    num_comments: postData.num_comments,
    subreddit: postData.subreddit,
    author: postData.author,
  };

  // Extract top 60 comments by score, only keep essential fields
  const comments = commentsData
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((c: any) => c.kind === "t1" && c.data?.body)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => (b.data?.score || 0) - (a.data?.score || 0))
    .slice(0, 60)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((c: any) => ({
      body: c.data.body.substring(0, 500),
      score: c.data.score,
    }));

  return { post, comments };
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

    const rawJson = await response.json();

    // Trim the Reddit JSON to reduce token count
    const trimmedData = trimRedditData(rawJson);

    // Return the trimmed JSON structure for AI processing
    return NextResponse.json({
      // Legacy fields for backward compatibility with existing UI
      title: trimmedData.post.title || "",
      selftext: trimmedData.post.selftext || "",
      subreddit: trimmedData.post.subreddit || "",
      score: trimmedData.post.score || 0,
      num_comments: trimmedData.post.num_comments || 0,
      author: trimmedData.post.author || "",
      // New trimmed JSON structure for AI
      trimmedJson: trimmedData,
    });
  } catch (error) {
    console.error("Reddit fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Reddit post." },
      { status: 500 }
    );
  }
}
