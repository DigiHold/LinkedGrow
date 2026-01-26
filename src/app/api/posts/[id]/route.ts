// Single Post API - Get, Update, Delete a specific post
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, media, users, teams, teamMembers } from "@/lib/db/schema";
import { eq, and, inArray, count, gte } from "drizzle-orm";
import { deleteMultipleFromR2, uploadBase64ToR2, isR2Configured } from "@/lib/storage/r2";
import { schedulePost, cancelScheduledPost, reschedulePost } from "@/lib/qstash";
import { nanoid } from "nanoid";
import { PLANS, PlanId } from "@/lib/plans";

// Helper function to check if user can access a post (owner, team owner, or team admin)
async function canUserAccessPost(userId: string, postUserId: string): Promise<boolean> {
  // User owns the post
  if (userId === postUserId) return true;

  // Check if user is a team owner and the post belongs to one of their team members
  const ownedTeam = await db.query.teams.findFirst({
    where: eq(teams.ownerId, userId),
  });

  if (ownedTeam) {
    // Get all team member user IDs
    const members = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, ownedTeam.id));

    const teamMemberIds = members.map((m) => m.userId);
    if (teamMemberIds.includes(postUserId)) return true;
  }

  // Check if user is a team admin and the post belongs to a member of the same team
  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, userId),
  });

  if (membership && membership.role === "admin") {
    // Get all members in this team (admins can manage member posts, not other admin posts)
    const teamMembersList = await db
      .select({ userId: teamMembers.userId, role: teamMembers.role })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, membership.teamId));

    // Find the post owner in the team members
    const postOwnerMembership = teamMembersList.find((m) => m.userId === postUserId);
    // Admin can only edit member posts (not admin or owner posts)
    if (postOwnerMembership && postOwnerMembership.role === "member") {
      return true;
    }
  }

  return false;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/posts/[id] - Get a single post
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get post
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user can access this post (owns it or is team owner)
    const canAccess = await canUserAccessPost(user.id, post.userId);
    if (!canAccess) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get media for this post
    const postMedia = await db
      .select()
      .from(media)
      .where(and(eq(media.postId, postId), eq(media.status, "ready")))
      .orderBy(media.sortOrder);

    return NextResponse.json({
      post: {
        ...post,
        metadata: post.metadata ? JSON.parse(post.metadata) : null,
        media: postMedia,
      },
    });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// PATCH /api/posts/[id] - Update a post
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get existing post
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user can access this post (owns it or is team owner)
    const canAccess = await canUserAccessPost(user.id, existingPost.userId);
    if (!canAccess) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Can't edit published posts
    if (existingPost.status === "published") {
      return NextResponse.json(
        { error: "Cannot edit published posts" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content, status, postType, scheduledAt, metadata, mediaData, removeMedia } = body;

    // Validate scheduled posts have a future date
    if (status === "scheduled") {
      const scheduleDate = scheduledAt
        ? new Date(scheduledAt)
        : existingPost.scheduledAt;
      if (!scheduleDate || scheduleDate <= new Date()) {
        return NextResponse.json(
          { error: "Scheduled date must be in the future" },
          { status: 400 }
        );
      }

      // Check scheduled posts limit if changing from non-scheduled to scheduled
      if (existingPost.status !== "scheduled") {
        const userPlan = (user.plan || "free") as PlanId;
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
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (content !== undefined) updateData.content = content.trim();
    if (status !== undefined) updateData.status = status;
    if (postType !== undefined) updateData.postType = postType;
    if (scheduledAt !== undefined)
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (metadata !== undefined)
      updateData.metadata = metadata ? JSON.stringify(metadata) : null;

    // Handle QStash scheduling changes
    const wasScheduled = existingPost.status === "scheduled";
    const willBeScheduled = (status ?? existingPost.status) === "scheduled";
    const newScheduleDate = scheduledAt ? new Date(scheduledAt) : existingPost.scheduledAt;

    let qstashMessageId = existingPost.qstashMessageId;

    if (wasScheduled && !willBeScheduled) {
      // Post is being unscheduled (changed to draft or other status)
      if (existingPost.qstashMessageId) {
        await cancelScheduledPost(existingPost.qstashMessageId);
        qstashMessageId = null;
      }
    } else if (!wasScheduled && willBeScheduled && newScheduleDate) {
      // Post is being scheduled for the first time
      qstashMessageId = await schedulePost(postId, newScheduleDate);
    } else if (wasScheduled && willBeScheduled && scheduledAt) {
      // Post is being rescheduled to a different time
      const oldScheduleTime = existingPost.scheduledAt?.getTime();
      const newScheduleTime = new Date(scheduledAt).getTime();
      if (oldScheduleTime !== newScheduleTime && existingPost.qstashMessageId) {
        qstashMessageId = await reschedulePost(
          existingPost.qstashMessageId,
          postId,
          new Date(scheduledAt)
        );
      }
    }

    updateData.qstashMessageId = qstashMessageId;

    // Handle media removal if requested
    if (removeMedia === true) {
      const existingMedia = await db
        .select()
        .from(media)
        .where(eq(media.postId, postId));

      if (existingMedia.length > 0) {
        // Delete media from R2
        const oldKeys = existingMedia.map((m) => m.storageKey);
        try {
          await deleteMultipleFromR2(oldKeys);
        } catch (e) {
          console.error("Failed to delete media from R2:", e);
        }
        // Delete media records
        await db.delete(media).where(eq(media.postId, postId));
      }

      // Update post type to text
      updateData.postType = "text";
    }

    // Handle image upload if provided
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

        // Check if post already has media
        const existingMedia = await db
          .select()
          .from(media)
          .where(eq(media.postId, postId));

        if (existingMedia.length > 0) {
          // Delete old media from R2
          const oldKeys = existingMedia.map((m) => m.storageKey);
          try {
            await deleteMultipleFromR2(oldKeys);
          } catch (e) {
            console.error("Failed to delete old media from R2:", e);
          }
          // Delete old media records
          await db.delete(media).where(eq(media.postId, postId));
        }

        // Create new media record
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
          createdAt: new Date(),
        });

        // Update post type to image
        updateData.postType = "image";
      } catch (uploadError) {
        console.error("Failed to upload image:", uploadError);
        // Continue without image - don't fail the update
      }
    }

    await db.update(posts).set(updateData).where(eq(posts.id, postId));

    // Fetch updated post
    const [updatedPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    // Get media
    const postMedia = await db
      .select()
      .from(media)
      .where(and(eq(media.postId, postId), eq(media.status, "ready")))
      .orderBy(media.sortOrder);

    return NextResponse.json({
      post: {
        ...updatedPost,
        metadata: updatedPost.metadata ? JSON.parse(updatedPost.metadata) : null,
        media: postMedia,
      },
    });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get existing post
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user can access this post (owns it or is team owner)
    const canAccess = await canUserAccessPost(user.id, existingPost.userId);
    if (!canAccess) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Cancel QStash scheduled message if post was scheduled
    if (existingPost.status === "scheduled" && existingPost.qstashMessageId) {
      try {
        await cancelScheduledPost(existingPost.qstashMessageId);
      } catch (e) {
        console.error("Failed to cancel QStash message:", e);
        // Continue with deletion even if QStash cancel fails
      }
    }

    // Get associated media to delete from R2
    const postMedia = await db
      .select()
      .from(media)
      .where(eq(media.postId, postId));

    // Delete media files from R2
    if (postMedia.length > 0) {
      const storageKeys = postMedia.map((m) => m.storageKey);
      try {
        await deleteMultipleFromR2(storageKeys);
      } catch (e) {
        console.error("Failed to delete media from R2:", e);
        // Continue with database deletion even if R2 fails
      }
    }

    // Delete media records (cascade will handle this, but being explicit)
    await db.delete(media).where(eq(media.postId, postId));

    // Delete post
    await db.delete(posts).where(eq(posts.id, postId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
