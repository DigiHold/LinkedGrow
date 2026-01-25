// Posts API - CRUD operations for user posts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, media, users, teams, teamMembers } from "@/lib/db/schema";
import { eq, desc, and, inArray, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { schedulePost } from "@/lib/qstash";
import { uploadBase64ToR2, isR2Configured } from "@/lib/storage/r2";

// GET /api/posts - Get all posts for current user
export async function GET(request: NextRequest) {
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

    // Parse query params for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status"); // draft, scheduled, published, failed
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Check if user is a team owner - if so, fetch posts from all team members
    const ownedTeam = await db.query.teams.findFirst({
      where: eq(teams.ownerId, user.id),
    });

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
      // Check if user is a team admin - if so, fetch posts from members (not admins)
      const membership = await db.query.teamMembers.findFirst({
        where: eq(teamMembers.userId, user.id),
      });

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
      const statuses = status.split(",") as ("draft" | "scheduled" | "published" | "failed")[];
      if (statuses.length === 1) {
        conditions.push(eq(posts.status, statuses[0]));
      } else {
        conditions.push(inArray(posts.status, statuses));
      }
    }

    // Get posts with their media
    const userPosts = await db
      .select()
      .from(posts)
      .where(and(...conditions))
      .orderBy(desc(posts.updatedAt))
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

    return NextResponse.json({
      posts: postsWithMedia,
      pagination: {
        limit,
        offset,
        total: userPosts.length, // Would need COUNT query for accurate total
      },
      isTeamView: (isTeamOwner || isTeamAdmin) && userIdsToFetch.length > 1,
    });
  } catch (error) {
    console.error("Get posts error:", error);
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
      mediaData, // { base64: string, mimeType: string }
    } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
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
    }

    const postId = nanoid();
    const now = new Date();
    let qstashMessageId: string | null = null;

    // If scheduling, create QStash job for exact-time delivery
    if (status === "scheduled" && scheduledAt) {
      const scheduleDate = new Date(scheduledAt);
      qstashMessageId = await schedulePost(postId, scheduleDate);
    }

    // Determine post type based on media
    const actualPostType = mediaData?.base64 ? "image" : postType;

    await db.insert(posts).values({
      id: postId,
      userId: user.id,
      content: content.trim(),
      status,
      postType: actualPostType,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      qstashMessageId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: now,
      updatedAt: now,
    });

    // Handle image upload if provided
    let uploadedMedia: typeof media.$inferSelect | null = null;
    if (mediaData?.base64 && mediaData?.mimeType && isR2Configured()) {
      try {
        // Generate filename from mimeType
        const ext = mediaData.mimeType.split("/")[1] || "png";
        const fileName = `post-image-${postId}.${ext}`;

        // Upload to R2
        const uploadResult = await uploadBase64ToR2(mediaData.base64, {
          fileName,
          contentType: mediaData.mimeType,
          userId: user.id,
          postId,
        });

        // Create media record
        const mediaId = nanoid();
        await db.insert(media).values({
          id: mediaId,
          userId: user.id,
          postId,
          storageKey: uploadResult.key,
          storageUrl: uploadResult.url,
          fileName,
          mimeType: mediaData.mimeType,
          fileSize: uploadResult.size,
          status: "ready",
          createdAt: now,
        });

        // Fetch the created media
        const [newMedia] = await db
          .select()
          .from(media)
          .where(eq(media.id, mediaId))
          .limit(1);
        uploadedMedia = newMedia;
      } catch (uploadError) {
        console.error("Failed to upload image:", uploadError);
        // Continue without image - don't fail the post creation
      }
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
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
