// Posts API - CRUD operations for user posts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, media, users, teams, teamMembers, linkedinAccounts } from "@/lib/db/schema";
import { loadSessionUser } from "@/lib/auth-user";
import { eq, desc, and, inArray, or, count, gte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { PLANS, effectivePlan } from "@/lib/plans";
import { uploadToR2, isR2Configured } from "@/lib/storage/r2";
import sharp from "sharp";

// GET /api/posts - Get all posts for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Turso is SQLite over HTTP, so each await below is a network round trip.
    // The user row, the team they own and the team they belong to are three
    // independent lookups keyed off the session, so they go together instead
    // of one after another.
    const [[user], ownedTeam, ownMembership] = await Promise.all([
      db
        .select()
        .from(users)
        .where(eq(users.email, session.user.email))
        .limit(1),
      db.query.teams.findFirst({
        where: eq(teams.ownerId, session.user.id),
      }),
      db.query.teamMembers.findFirst({
        where: eq(teamMembers.userId, session.user.id),
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse query params for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status"); // draft, scheduled, published, failed
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let userIdsToFetch = [user.id];
    let isTeamOwner = false;
    let isTeamAdmin = false;

    if (ownedTeam) {
      isTeamOwner = true;
      // User is a team owner - get all team members' user IDs
      const members = await db
        .select({ userId: teamMembers.userId })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, ownedTeam.id));

      userIdsToFetch = members.map((m) => m.userId);
      // Make sure owner is included (they might not be in teamMembers if they never added themselves)
      if (!userIdsToFetch.includes(user.id)) {
        userIdsToFetch.push(user.id);
      }
    } else {
      // Already fetched above alongside the user row.
      const membership = ownMembership;

      if (membership && membership.role === "admin") {
        isTeamAdmin = true;
        // Get all members in this team with role "member" only
        const teamMembersList = await db
          .select({ userId: teamMembers.userId, role: teamMembers.role })
          .from(teamMembers)
          .where(eq(teamMembers.teamId, membership.teamId));

        // Admin sees their own posts plus member posts (not other admin posts)
        const memberUserIds = teamMembersList
          .filter((m) => m.role === "member")
          .map((m) => m.userId);

        userIdsToFetch = [user.id, ...memberUserIds];
      }
    }

    // Build query conditions - fetch posts from all relevant users
    const userCondition = userIdsToFetch.length === 1
      ? eq(posts.userId, userIdsToFetch[0])
      : inArray(posts.userId, userIdsToFetch);

    const conditions = [userCondition];

    if (status) {
      const statuses = status.split(",") as (typeof posts.status.enumValues)[number][];
      if (statuses.length === 1) {
        conditions.push(eq(posts.status, statuses[0]));
      } else {
        conditions.push(inArray(posts.status, statuses));
      }
    }

    // Get posts with their media. A post being published right now sits above
    // everything else: it is the one the user is waiting on.
    const userPosts = await db
      .select()
      .from(posts)
      .where(and(...conditions))
      .orderBy(
          sql`CASE ${posts.status}
            WHEN 'queued' THEN 0 WHEN 'publishing' THEN 0
            WHEN 'draft' THEN 1 WHEN 'scheduled' THEN 2
            WHEN 'failed' THEN 3 WHEN 'published' THEN 4 END`,
          desc(sql`CASE ${posts.status}
            WHEN 'draft' THEN COALESCE(${posts.updatedAt}, ${posts.createdAt})
            WHEN 'scheduled' THEN ${posts.scheduledAt}
            WHEN 'published' THEN COALESCE(${posts.publishedAt}, ${posts.updatedAt})
            ELSE COALESCE(${posts.updatedAt}, ${posts.createdAt})
          END`)
        )
      .limit(limit)
      .offset(offset);

    // Get media for all posts
    const postIds = userPosts.map((p) => p.id);
    const postMedia =
      postIds.length > 0
        ? await db
            .select()
            .from(media)
            .where(
              and(
                inArray(media.postId, postIds),
                eq(media.status, "ready")
              )
            )
            .orderBy(media.sortOrder)
        : [];

    // If owner or admin, get author info for all posts
    let authorMap: Map<string, { name: string | null; email: string; image: string | null }> = new Map();
    if ((isTeamOwner || isTeamAdmin) && userIdsToFetch.length > 1) {
      const authors = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        })
        .from(users)
        .where(inArray(users.id, userIdsToFetch));

      authors.forEach((author) => {
        authorMap.set(author.id, {
          name: author.name,
          email: author.email,
          image: author.image,
        });
      });
    }

    // Combine posts with their media and author info
    const postsWithMedia = userPosts.map((post) => {
      const author = authorMap.get(post.userId);
      return {
        ...post,
        metadata: post.metadata ? JSON.parse(post.metadata) : null,
        media: postMedia.filter((m) => m.postId === post.id),
        // Include author info if this is a team view (owner viewing)
        author: author ? {
          name: author.name || author.email.split("@")[0],
          email: author.email,
          image: author.image,
          isOwner: post.userId === user.id,
        } : null,
      };
    });

    // Get accurate total count and per-status counts
    const statusCounts = await db
      .select({
        status: posts.status,
        count: count(),
      })
      .from(posts)
      .where(userCondition)
      .groupBy(posts.status);

    const counts: Record<string, number> = {};
    let total = 0;
    for (const row of statusCounts) {
      const key = row.status || "unknown";
      counts[key] = row.count;
      total += row.count;
    }

    return NextResponse.json({
      posts: postsWithMedia,
      pagination: {
        limit,
        offset,
        total,
      },
      counts,
      isTeamView: (isTeamOwner || isTeamAdmin) && userIdsToFetch.length > 1,
    });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      content,
      status = "draft",
      postType = "text",
      scheduledAt,
      metadata,
      mediaInfo, // { storageUrl, storageKey, mimeType, fileSize } - image already uploaded to R2
      mediaData, // { base64, mimeType } - image to be uploaded to R2 (from Reddit/Generator pages)
      firstComment, // Auto-comment to post after publication
      linkedinAccountId, // Which connected account publishes this post
    } = body;

    // The account choice is checked against the workspace, not the user: on a
    // team, the accounts hang off the owner. An unknown or disconnected id is
    // refused rather than silently falling back to the oldest account, which
    // is how a post meant for one profile appeared on another (2026-08-22).
    let chosenAccountId: string | null = null;
    if (linkedinAccountId !== undefined && linkedinAccountId !== null) {
      if (typeof linkedinAccountId !== "string" || linkedinAccountId.length > 64) {
        return NextResponse.json({ error: "Invalid LinkedIn account" }, { status: 400 });
      }
      const data = await loadSessionUser(user.id);
      const workspaceId = data?.teamOwnerId ?? user.id;
      const [owned] = await db
        .select({ id: linkedinAccounts.id })
        .from(linkedinAccounts)
        .where(
          and(
            eq(linkedinAccounts.id, linkedinAccountId),
            eq(linkedinAccounts.workspaceId, workspaceId),
            eq(linkedinAccounts.status, "active")
          )
        )
        .limit(1);
      if (!owned) {
        return NextResponse.json(
          { error: "That LinkedIn account is not connected to this workspace" },
          { status: 400 }
        );
      }
      chosenAccountId = owned.id;
    }

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Check monthly post creation limit for Free plan
    const userPlan = effectivePlan({ plan: user.plan, isAdmin: user.isAdmin });
    const postsPerMonthLimit = PLANS[userPlan].limits.postsPerMonth;

    if (postsPerMonthLimit !== -1) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [postCount] = await db
        .select({ count: count() })
        .from(posts)
        .where(
          and(
            eq(posts.userId, user.id),
            gte(posts.createdAt, startOfMonth)
          )
        );

      if (postCount.count >= postsPerMonthLimit) {
        return NextResponse.json(
          {
            error: `You've reached your monthly limit of ${postsPerMonthLimit} posts. Upgrade to Starter for unlimited posts.`,
            limitReached: true,
            currentPlan: userPlan,
          },
          { status: 403 }
        );
      }
    }

    // Validate scheduled posts have a future date
    if (status === "scheduled") {
      if (!scheduledAt) {
        return NextResponse.json(
          { error: "Scheduled date is required for scheduled posts" },
          { status: 400 }
        );
      }
      const scheduleDate = new Date(scheduledAt);
      if (scheduleDate <= new Date()) {
        return NextResponse.json(
          { error: "Scheduled date must be in the future" },
          { status: 400 }
        );
      }

      // Check scheduled posts limit for user's plan
      const userPlan = effectivePlan({ plan: user.plan, isAdmin: user.isAdmin });
      const scheduledPostsLimit = PLANS[userPlan].limits.scheduledPosts;

      if (scheduledPostsLimit !== -1) {
        // Count current month's scheduled posts
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [scheduledCount] = await db
          .select({ count: count() })
          .from(posts)
          .where(
            and(
              eq(posts.userId, user.id),
              eq(posts.status, "scheduled"),
              gte(posts.createdAt, startOfMonth)
            )
          );

        if (scheduledCount.count >= scheduledPostsLimit) {
          return NextResponse.json(
            {
              error: `You've reached your monthly limit of ${scheduledPostsLimit} scheduled posts. Upgrade to Pro for unlimited scheduling.`,
              limitReached: true,
              currentPlan: userPlan,
            },
            { status: 403 }
          );
        }
      }
    }

    const postId = nanoid();
    const now = new Date();

    // Handle mediaData (base64) by uploading to R2 first
    // This supports Reddit/Generator pages that send base64 images directly
    let processedMediaInfo = mediaInfo;
    if (mediaData?.base64 && !mediaInfo?.storageUrl) {
      if (!(await isR2Configured())) {
        return NextResponse.json(
          { error: "Storage not configured" },
          { status: 503 }
        );
      }

      try {
        // Decode base64 and optimize
        const base64Data = mediaData.base64.replace(/^data:[^;]+;base64,/, "");
        const inputBuffer = Buffer.from(base64Data, "base64");

        // Validate size (max 10MB)
        if (inputBuffer.length > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: "Image too large (max 10MB)" },
            { status: 400 }
          );
        }

        // Optimize with sharp and convert to WebP
        const optimizedBuffer = await sharp(inputBuffer)
          .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();

        const fileName = `post-image-${nanoid()}.webp`;

        const uploadResult = await uploadToR2(optimizedBuffer, {
          fileName,
          contentType: "image/webp",
          userId: user.id,
        });

        processedMediaInfo = {
          storageUrl: uploadResult.url,
          storageKey: uploadResult.key,
          mimeType: "image/webp",
          fileSize: uploadResult.size,
        };
      } catch (uploadError) {
return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 }
        );
      }
    }

    // Determine post type based on media. PDFs are LinkedIn carousels.
    // The schema enum is text/image/carousel/video - "document" is NOT a
    // valid value and will silently break the My Posts badge.
    let actualPostType = postType;
    if (processedMediaInfo?.storageUrl) {
      if (processedMediaInfo.mimeType === "application/pdf") {
        actualPostType = "carousel";
      } else if (processedMediaInfo.mimeType?.startsWith("video/")) {
        actualPostType = "video";
      } else {
        actualPostType = "image";
      }
    }

    await db.insert(posts).values({
      id: postId,
      userId: user.id,
      content: content.trim(),
      firstComment: firstComment?.trim() || null,
      status,
      postType: actualPostType,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      linkedinAccountId: chosenAccountId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: now,
      updatedAt: now,
    });


    // Link already-uploaded R2 media to this post
    let uploadedMedia: typeof media.$inferSelect | null = null;
    if (processedMediaInfo?.storageUrl && processedMediaInfo?.storageKey) {
      const mediaId = nanoid();
      const ext = processedMediaInfo.mimeType?.split("/")[1] || "png";
      await db.insert(media).values({
        id: mediaId,
        userId: user.id,
        postId,
        storageKey: processedMediaInfo.storageKey,
        storageUrl: processedMediaInfo.storageUrl,
        fileName: `post-image-${postId}.${ext}`,
        mimeType: processedMediaInfo.mimeType || "image/png",
        fileSize: processedMediaInfo.fileSize || 0,
        status: "ready",
        createdAt: now,
      });

      const [newMedia] = await db
        .select()
        .from(media)
        .where(eq(media.id, mediaId))
        .limit(1);
      uploadedMedia = newMedia;
    }

    // Fetch the created post
    const [newPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    return NextResponse.json({
      post: {
        ...newPost,
        metadata: newPost.metadata ? JSON.parse(newPost.metadata) : null,
        media: uploadedMedia ? [uploadedMedia] : [],
      },
    });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
