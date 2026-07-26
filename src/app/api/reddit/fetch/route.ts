import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessFeature, type PlanId } from "@/lib/plans";
import { fetchRedditContent } from "@/lib/reddit";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check plan access - contentRepurposing requires Starter+
    const [user] = await db.select({ plan: users.plan }).from(users).where(eq(users.id, session.user.id));
    const userPlan = (user?.plan || "free") as PlanId;

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "Reddit URL is required" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid Reddit URL" }, { status: 400 });
    }

    if (
      parsedUrl.hostname !== "reddit.com" &&
      !parsedUrl.hostname.endsWith(".reddit.com")
    ) {
      return NextResponse.json({ error: "Invalid Reddit URL" }, { status: 400 });
    }

    const trimmedData = await fetchRedditContent(url);

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
const message = error instanceof Error ? error.message : "Failed to fetch Reddit data";
    const status = message.includes("not found") ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
