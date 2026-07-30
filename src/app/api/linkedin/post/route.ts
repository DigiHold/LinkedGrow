import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, linkedinAccounts } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";
import { canUserAccessPost } from "@/lib/post-access";
import { rateLimit } from "@/lib/rate-limit";
import { getPublicUrl } from "@/lib/storage/r2";

/**
 * Hands a post to the worker, and returns before it is published.
 *
 * v1 called LinkedIn's Share API from here and answered "published" in the same
 * request. v2 has no Share API: the post is typed into the real composer by a
 * browser the worker drives, on the customer's own address, which takes a
 * minute or two and cannot happen inside an HTTP request on Vercel.
 *
 * So this route only writes the intent. The posts row is the queue (see the
 * comment on `status` in the schema), the worker claims it, and the dashboard
 * watches the same row until it says published or failed. Callers must never
 * report success from a 200 here; a 200 means queued.
 *
 * The proxy allowlists /api/linkedin/ so the OAuth callback can land without a
 * session, so this route cannot lean on the middleware for authentication and
 * checks the session itself. The paywall in src/proxy.ts still applies, which
 * is what keeps an expired trial from publishing.
 */

/** LinkedIn refuses anything longer, and finding out in the browser wastes a session. */
const MAX_POST_CHARS = 3000;

interface PublishBody {
  postId?: unknown;
  text?: unknown;
  videoUrl?: unknown;
  videoMimeType?: unknown;
  videoStorageKey?: unknown;
  linkedinAccountId?: unknown;
}

/**
 * Videos never reach the media table: they live in R2 as a transient pipe and
 * arrive here as a URL. The worker downloads whatever this says, so it is only
 * ever allowed to be our own bucket.
 */
function isOwnStorageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const base = new URL(getPublicUrl("probe"));
    return url.hostname === base.hostname;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Each attempt costs the worker a browser session, so this is limited per
    // user rather than per address: the expensive part is behind the account.
    const limit = rateLimit(`linkedin-publish:${session.user.id}`, {
      maxRequests: 20,
      windowMs: 60 * 1000,
    });
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many publish requests. Wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = (await request.json().catch(() => null)) as PublishBody | null;
    const postId = typeof body?.postId === "string" ? body.postId.trim() : "";
    if (!postId || postId.length > 64) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const text = typeof body?.text === "string" ? body.text : null;
    if (text !== null && text.trim().length === 0) {
      return NextResponse.json({ error: "A post cannot be empty" }, { status: 400 });
    }
    if (text !== null && text.length > MAX_POST_CHARS) {
      return NextResponse.json(
        { error: `LinkedIn posts stop at ${MAX_POST_CHARS} characters` },
        { status: 400 }
      );
    }

    const data = await loadSessionUser(session.user.id);
    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const workspaceId = data.teamOwnerId ?? data.user.id;

    const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (!(await canUserAccessPost(data.user.id, post.userId))) {
      // Same answer as a missing post: which posts exist is not this user's business.
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.status === "published") {
      return NextResponse.json({ error: "This post is already published" }, { status: 409 });
    }
    if (post.status === "queued" || post.status === "publishing") {
      return NextResponse.json({ error: "This post is already on its way" }, { status: 409 });
    }

    const connected = await db
      .select({
        id: linkedinAccounts.id,
        fullName: linkedinAccounts.fullName,
        email: linkedinAccounts.email,
      })
      .from(linkedinAccounts)
      .where(
        and(
          eq(linkedinAccounts.workspaceId, workspaceId),
          eq(linkedinAccounts.status, "connected")
        )
      )
      .orderBy(asc(linkedinAccounts.createdAt));

    if (connected.length === 0) {
      return NextResponse.json(
        {
          error:
            "No LinkedIn account is connected. Connect one in Settings and publish again.",
        },
        { status: 400 }
      );
    }

    const asked = typeof body?.linkedinAccountId === "string" ? body.linkedinAccountId : null;
    // The oldest connected account is the default, and it is stored on the post
    // so the answer to "where did this appear" survives a disconnection later.
    const account = asked ? connected.find((a) => a.id === asked) : connected[0];
    if (!account) {
      return NextResponse.json(
        { error: "That LinkedIn account is not connected to this workspace" },
        { status: 400 }
      );
    }

    const videoUrl = typeof body?.videoUrl === "string" ? body.videoUrl : null;
    if (videoUrl && !isOwnStorageUrl(videoUrl)) {
      return NextResponse.json({ error: "That video is not one of ours" }, { status: 400 });
    }

    // Everything the post already carried stays; the video is the one thing the
    // media table never holds, so it rides along in metadata for the worker.
    const existingMetadata: Record<string, unknown> = post.metadata
      ? (JSON.parse(post.metadata) as Record<string, unknown>)
      : {};
    const metadata = videoUrl
      ? {
          ...existingMetadata,
          video: {
            url: videoUrl,
            mimeType:
              typeof body?.videoMimeType === "string" ? body.videoMimeType : "video/mp4",
            storageKey:
              typeof body?.videoStorageKey === "string" ? body.videoStorageKey : null,
          },
        }
      : existingMetadata;

    const now = new Date();
    await db
      .update(posts)
      .set({
        ...(text !== null ? { content: text.trim() } : {}),
        status: "queued",
        // The worker's due query reads this for both kinds of post, so a
        // publish-now is simply one whose slot is already in the past.
        scheduledAt: now,
        linkedinAccountId: account.id,
        publishAttempts: 0,
        publishClaimedAt: null,
        errorMessage: null,
        metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
        updatedAt: now,
      })
      .where(eq(posts.id, postId));

    return NextResponse.json({
      queued: true,
      postId,
      account: { id: account.id, name: account.fullName ?? account.email },
    });
  } catch (error) {
return NextResponse.json({ error: "Failed to queue this post" }, { status: 500 });
  }
}
