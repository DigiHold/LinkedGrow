import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Reddit OAuth2 credentials (app-only / script type)
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;

// Cache for Reddit access token (expires after 1 hour)
let cachedToken: { token: string; expiresAt: number } | null = null;

// Get Reddit OAuth2 access token using client credentials grant
async function getRedditAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 300000) {
    return cachedToken.token;
  }

  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
    throw new Error("Reddit API credentials not configured");
  }

  // Reddit requires Basic Auth with client_id:client_secret
  const credentials = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString("base64");

  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "LinkedGrow/1.0 (https://linkedgrow.ai)",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Reddit token error:", text);
    throw new Error("Failed to get Reddit access token");
  }

  const data = await response.json();

  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };

  return data.access_token;
}

// Extract post ID from Reddit URL
function extractPostInfo(url: string): { subreddit: string; postId: string } | null {
  // Handle various Reddit URL formats:
  // https://www.reddit.com/r/subreddit/comments/abc123/title/
  // https://reddit.com/r/subreddit/comments/abc123/
  // https://old.reddit.com/r/subreddit/comments/abc123/title/

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

    // Extract subreddit and post ID from URL
    const postInfo = extractPostInfo(url);
    if (!postInfo) {
      return NextResponse.json(
        { error: "Could not parse Reddit URL. Make sure it's a link to a post." },
        { status: 400 }
      );
    }

    // Get OAuth access token
    const accessToken = await getRedditAccessToken();

    // Fetch post data using Reddit OAuth API
    const apiUrl = `https://oauth.reddit.com/r/${postInfo.subreddit}/comments/${postInfo.postId}?limit=1`;

    const response = await fetch(apiUrl, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "User-Agent": "LinkedGrow/1.0 (https://linkedgrow.ai)",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Reddit post not found. Check that the URL is correct." },
          { status: 404 }
        );
      }
      if (response.status === 403) {
        return NextResponse.json(
          { error: "This Reddit post is private or restricted." },
          { status: 403 }
        );
      }
      const text = await response.text();
      console.error("Reddit API error:", response.status, text);
      return NextResponse.json(
        { error: "Failed to fetch Reddit post. Please try again." },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Reddit API returns [post listing, comments listing]
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

    // Check if it's a credentials error
    if (error instanceof Error && error.message.includes("credentials")) {
      return NextResponse.json(
        { error: "Reddit API is not configured. Please contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch Reddit post. Please check the URL and try again." },
      { status: 500 }
    );
  }
}
