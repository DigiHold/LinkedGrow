import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { db } from "@/lib/db";
import { users, posts, teamEngagementJobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  likeLinkedInPost,
  createLinkedInComment,
  reshareLinkedInPost,
} from "@/lib/linkedin";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function POST(request: NextRequest) {
  console.log("[Team Engage Webhook] Received request");

  try {
    const body = await request.text();

    // Verify QStash signature
    const signature = request.headers.get("upstash-signature");
    if (!signature) {
      console.error("[Team Engage Webhook] Missing upstash-signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/qstash/team-engage`;

    let isValid = false;
    try {
      isValid = await receiver.verify({ signature, body, url: verifyUrl });
    } catch {
      try {
        isValid = await receiver.verify({ signature, body });
      } catch {
        console.error("[Team Engage Webhook] Signature verification failed");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = JSON.parse(body);
    const { jobId, postId, linkedinPostId, userId, actionType, commentText } = data;

    console.log("[Team Engage Webhook] Processing:", { jobId, actionType, userId });

    // Get the team member's OWN LinkedIn credentials
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.linkedinAccessToken || !user.linkedinProfileId) {
      await markJobFailed(jobId, "User LinkedIn not connected");
      return NextResponse.json({ error: "LinkedIn not connected" });
    }

    // Check token expiry
    if (user.linkedinTokenExpiry && user.linkedinTokenExpiry < new Date()) {
      await markJobFailed(jobId, "LinkedIn token expired");
      return NextResponse.json({ error: "Token expired" });
    }

    // Execute the engagement action
    switch (actionType) {
      case "like": {
        await likeLinkedInPost(
          user.linkedinAccessToken,
          linkedinPostId,
          user.linkedinProfileId
        );
        break;
      }

      case "comment": {
        let finalComment = commentText;

        // Generate AI comment if none provided
        if (!finalComment) {
          const [post] = await db
            .select({ content: posts.content, userId: posts.userId })
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1);

          if (post?.content) {
            finalComment = await generateTeamComment(post.content, post.userId);
          }
        }

        if (!finalComment) {
          finalComment = "Great update!";
        }

        await createLinkedInComment(
          user.linkedinAccessToken,
          linkedinPostId,
          user.linkedinProfileId,
          finalComment
        );

        // Store the comment text in the job record
        await db
          .update(teamEngagementJobs)
          .set({ commentText: finalComment })
          .where(eq(teamEngagementJobs.id, jobId));
        break;
      }

      case "share": {
        await reshareLinkedInPost(
          user.linkedinAccessToken,
          user.linkedinProfileId,
          linkedinPostId
        );
        break;
      }

      default:
        await markJobFailed(jobId, `Unknown action type: ${actionType}`);
        return NextResponse.json({ error: "Unknown action" });
    }

    // Mark job as completed
    await db
      .update(teamEngagementJobs)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(teamEngagementJobs.id, jobId));

    console.log("[Team Engage Webhook] Success:", { jobId, actionType });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Team Engage Webhook] Failed:", message);
    console.error("[Team Engage Webhook] Stack:", error instanceof Error ? error.stack : "no stack");

    // Try to extract jobId from the body to mark the job as failed
    try {
      const rawBody = await request.clone().text().catch(() => "");
      if (rawBody) {
        const parsed = JSON.parse(rawBody);
        if (parsed.jobId) {
          await markJobFailed(parsed.jobId, message);
        }
      }
    } catch {
      // Body already consumed or unparseable, skip
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

async function markJobFailed(jobId: string, errorMessage: string) {
  try {
    await db
      .update(teamEngagementJobs)
      .set({
        status: "failed",
        errorMessage,
        completedAt: new Date(),
      })
      .where(eq(teamEngagementJobs.id, jobId));
  } catch (err) {
    console.error("[Team Engage Webhook] Failed to mark job as failed:", err);
  }
}

/**
 * Generate an AI comment as a team member reacting to a company post.
 * Uses the post owner's AI API keys via internal API call.
 */
async function generateTeamComment(
  postContent: string,
  ownerUserId: string
): Promise<string> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://linkedgrow.ai";
    const res = await fetch(`${appUrl}/api/ai/generate-comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Call": process.env.CRON_SECRET || "",
      },
      body: JSON.stringify({
        postContent,
        userId: ownerUserId,
        teamMode: true,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.comment || "";
    }
  } catch (error) {
    console.error("[Team Engage] AI comment generation failed:", error);
  }
  return "";
}
