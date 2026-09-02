import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessFeature, effectivePlan, type PlanId } from "@/lib/plans";
import { checkAIRateLimit } from "@/lib/rate-limit";
import { getCaptionTrack } from "@/lib/youtube-captions";

function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const aiRateLimit = checkAIRateLimit(session.user.id);
    if (!aiRateLimit.success) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }

    const [user] = await db.select({ plan: users.plan }).from(users).where(eq(users.id, session.user.id));
    const userPlan = effectivePlan(user ?? {});

    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 });

    const videoId = extractVideoId(url);
    if (!videoId) return NextResponse.json({ error: "Please enter a valid YouTube URL" }, { status: 400 });

    // The caption track: the edge worker when one is configured, YouTube
    // itself otherwise. The browser downloads the transcript from its own
    // address, which YouTube never blocks.
    try {
      const result = await getCaptionTrack(videoId);
      return NextResponse.json({ videoId, title: result.title, trackUrl: result.trackUrl, lang: result.lang });
    } catch (e) {
      const debugStr = e instanceof Error ? e.message : "unknown";
      const isAdmin = session.user.isAdmin;
      return NextResponse.json({
        error: isAdmin
          ? `YouTube failed: ${debugStr}`
          : "Could not get transcript for this video. Please try again.",
      }, { status: 400 });
    }
  } catch (error) {
return NextResponse.json({ error: "Failed to get YouTube video info" }, { status: 500 });
  }
}
