import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

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

// This endpoint receives raw Reddit JSON from the client and trims it
// The client fetches Reddit directly (no CORS issues for .json endpoints)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rawJson } = await request.json();

    if (!rawJson) {
      return NextResponse.json({ error: "rawJson is required" }, { status: 400 });
    }

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
      { error: error instanceof Error ? error.message : "Failed to parse Reddit data" },
      { status: 500 }
    );
  }
}
