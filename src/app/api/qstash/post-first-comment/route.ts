import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { db, posts } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createLinkedInComment } from "@/lib/linkedin";
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
      console.error("QStash post-first-comment: missing upstash-signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/qstash/post-first-comment`;

    let isValid = false;
    try {
      isValid = await receiver.verify({ signature, body, url: verifyUrl });
    } catch {
      try {
        isValid = await receiver.verify({ signature, body });
      } catch {
        console.error("QStash post-first-comment: signature verification failed");
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

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Post must be published with a LinkedIn ID and have a first comment
    if (post.status !== "published" || !post.linkedinPostId || !post.firstComment) {
      return NextResponse.json({
        success: true,
        message: "Skipped - post not eligible for first comment",
      });
    }

    // Get LinkedIn credentials (handles team members via owner's credentials)
    const result = await getLinkedInUser(post.userId);

    if (!result?.linkedInUser?.linkedinAccessToken || !result?.linkedInUser?.linkedinProfileId) {
      console.error("First comment: LinkedIn not connected for user", post.userId);
      return NextResponse.json({ error: "LinkedIn not connected" }, { status: 400 });
    }

    const { linkedInUser } = result;

    // Check token expiry
    if (linkedInUser.linkedinTokenExpiry && new Date(linkedInUser.linkedinTokenExpiry) < new Date()) {
      console.error("First comment: LinkedIn token expired for user", post.userId);
      return NextResponse.json({ error: "LinkedIn token expired" }, { status: 400 });
    }

    // Determine author (profile vs organization)
    const isOrganization = linkedInUser.linkedinPostingTarget === "organization" && linkedInUser.linkedinSelectedOrgId;
    const authorId = isOrganization ? linkedInUser.linkedinSelectedOrgId! : linkedInUser.linkedinProfileId;
    const authorType: "person" | "organization" = isOrganization ? "organization" : "person";

    // Post the comment on LinkedIn
    await createLinkedInComment(
      linkedInUser.linkedinAccessToken!,
      post.linkedinPostId!,
      authorId!,
      post.firstComment!,
      authorType
    );

    // Clear firstComment after successful posting
    await db.update(posts)
      .set({ firstComment: null, updatedAt: new Date() })
      .where(eq(posts.id, postId));

    return NextResponse.json({
      success: true,
      postId,
      message: "First comment posted successfully",
    });

  } catch (error) {
    console.error("QStash first comment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to post first comment" },
      { status: 500 }
    );
  }
}
