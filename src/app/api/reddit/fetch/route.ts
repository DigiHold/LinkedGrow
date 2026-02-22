import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessFeature, type PlanId } from "@/lib/plans";

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

// This endpoint fetches Reddit data server-side (no CORS issues) and trims it
// Server-side fetch bypasses browser CORS restrictions entirely
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check plan access - contentRepurposing requires Starter+
    const [user] = await db.select({ plan: users.plan }).from(users).where(eq(users.id, session.user.id));
    const userPlan = (user?.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "contentRepurposing")) {
      return NextResponse.json(
        { error: "Content repurposing requires a Starter plan or higher. Please upgrade to access this feature." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "Reddit URL is required" }, { status: 400 });
    }

    // Validate it's a Reddit URL
    if (!url.includes("reddit.com")) {
      return NextResponse.json({ error: "Invalid Reddit URL" }, { status: 400 });
    }

    // Normalize and build JSON URL
    let jsonUrl = url
      .replace("old.reddit.com", "www.reddit.com")
      .replace(/^(https?:\/\/)reddit\.com/, "$1www.reddit.com");

    if (!jsonUrl.endsWith(".json")) {
      jsonUrl = jsonUrl.replace(/\/?$/, ".json");
    }

    // Fetch from Reddit server-side with browser-like headers to avoid bot detection
    const redditResponse = await fetch(jsonUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    });

    if (!redditResponse.ok) {
      if (redditResponse.status === 404) {
        return NextResponse.json({ error: "Reddit post not found" }, { status: 404 });
      }
      if (redditResponse.status === 403) {
        return NextResponse.json(
          { error: "Reddit blocked this request. Please try again in a few seconds." },
          { status: 403 }
        );
      }
      if (redditResponse.status === 429) {
        return NextResponse.json(
          { error: "Too many requests to Reddit. Please wait a moment and try again." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch Reddit post. Please try again." },
        { status: 502 }
      );
    }

    const rawJson = await redditResponse.json();

    // Trim the Reddit JSON to reduce token count
    const trimmedData = trimRedditData(rawJson);

    // Return the trimmed JSON structure for AI processing
    return NextResponse.json({
      title: trimmedData.post.title || "",
      selftext: trimmedData.post.selftext || "",
      subreddit: trimmedData.post.subreddit || "",
      score: trimmedData.post.score || 0,
      num_comments: trimmedData.post.num_comments || 0,
      author: trimmedData.post.author || "",
      trimmedJson: trimmedData,
    });
  } catch (error) {
    console.error("Reddit fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch Reddit data" },
      { status: 500 }
    );
  }
}
