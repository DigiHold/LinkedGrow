import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { db } from "@/lib/db";
import {
  crossPromotionActions,
  crossPromotionPosts,
  users,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  likeLinkedInPost,
  createLinkedInComment,
  reshareLinkedInPost,
  ensureFreshTokens,
} from "@/lib/linkedin";

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
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/qstash/cross-promote`;

    let isValid = false;
    try {
      isValid = await receiver.verify({ signature, body, url: verifyUrl });
    } catch {
      try {
        isValid = await receiver.verify({ signature, body });
      } catch {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const { actionId } = JSON.parse(body);

    // Get the action
    const action = await db.query.crossPromotionActions.findFirst({
      where: eq(crossPromotionActions.id, actionId),
    });

    if (!action || action.status !== "scheduled") {
      return NextResponse.json({ success: true, message: "Skipped" });
    }

    // Get the cross-promotion post for the LinkedIn post ID
    const cpPost = await db.query.crossPromotionPosts.findFirst({
      where: eq(crossPromotionPosts.id, action.crossPromotionPostId),
    });

    if (!cpPost) {
      await markFailed(actionId, "Cross-promotion post not found");
      return NextResponse.json({ error: "Post not found" });
    }

    // Get user's LinkedIn credentials
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, action.userId))
      .limit(1);

    if (!user?.linkedinAccessToken || !user?.linkedinProfileId) {
      await markFailed(actionId, "LinkedIn not connected");
      return NextResponse.json({ error: "LinkedIn not connected" });
    }

    // Ensure fresh token
    const { token } = await ensureFreshTokens(user.id);
    if (!token) {
      await markFailed(actionId, "LinkedIn token expired");
      return NextResponse.json({ error: "Token expired" });
    }

    // Execute the action
    switch (action.actionType) {
      case "like":
        await likeLinkedInPost(
          token,
          cpPost.linkedinPostId,
          user.linkedinProfileId
        );
        break;
      case "comment":
        if (action.commentText) {
          await createLinkedInComment(
            token,
            cpPost.linkedinPostId,
            user.linkedinProfileId,
            action.commentText
          );
        }
        break;
      case "repost":
        await reshareLinkedInPost(
          token,
          user.linkedinProfileId,
          cpPost.linkedinPostId,
          action.commentText || ''
        );
        break;
    }

    // Mark completed
    await db
      .update(crossPromotionActions)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(crossPromotionActions.id, actionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    // Try to extract actionId from the body to mark the action as failed
    try {
      const rawBody = await request.clone().text().catch(() => "");
      if (rawBody) {
        const parsed = JSON.parse(rawBody);
        if (parsed.actionId) {
          await markFailed(parsed.actionId, message);
        }
      }
    } catch {
      // Body already consumed or unparseable, skip
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function markFailed(actionId: string, errorMessage: string) {
  try {
    await db
      .update(crossPromotionActions)
      .set({ status: "failed", errorMessage, completedAt: new Date() })
      .where(eq(crossPromotionActions.id, actionId));
  } catch {
    // Silently fail - marking as failed is best-effort
  }
}
