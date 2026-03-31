import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { db, posts } from "@/lib/db";
import { eq } from "drizzle-orm";
import { likeLinkedInPost, ensureFreshTokens } from "@/lib/linkedin";
import { getLinkedInUser } from "@/lib/team-utils";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Verify QStash signature
    const signature = request.headers.get("upstash-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/qstash/auto-like`;

    let isValid = false;
    try {
      isValid = await receiver.verify({ signature, body, url: verifyUrl });
    } catch {
      try {
        isValid = await receiver.verify({ signature, body });
      } catch {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { postId } = JSON.parse(body);

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post || post.status !== "published" || !post.linkedinPostId) {
      return NextResponse.json({ success: true, message: "Skipped - post not eligible" });
    }

    const result = await getLinkedInUser(post.userId);

    if (!result?.linkedInUser?.linkedinProfileId) {
      return NextResponse.json({ error: "LinkedIn not connected" }, { status: 400 });
    }

    const { linkedInUser } = result;

    const { token } = await ensureFreshTokens(linkedInUser.id);
    if (!token) {
      return NextResponse.json({ error: "LinkedIn token expired" }, { status: 400 });
    }

    const isOrganization = linkedInUser.linkedinPostingTarget === "organization" && linkedInUser.linkedinSelectedOrgId;
    const authorId = isOrganization ? linkedInUser.linkedinSelectedOrgId! : linkedInUser.linkedinProfileId;
    const authorType: "person" | "organization" = isOrganization ? "organization" : "person";

    await likeLinkedInPost(token, post.linkedinPostId!, authorId!, authorType);

    return NextResponse.json({ success: true, postId, message: "Auto-liked" });
  } catch (error) {
return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to auto-like" },
      { status: 500 }
    );
  }
}
