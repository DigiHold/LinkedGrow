import { db } from "@/lib/db";
import {
  crossPromotionGroups,
  crossPromotionMembers,
  crossPromotionPosts,
  crossPromotionActions,
  users,
} from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { randomUUID } from "crypto";
import { sendCrossPromotionNotifyEmail } from "@/lib/email";

/**
 * Trigger cross-promotion notifications after a post is published.
 * Called from both direct publish and QStash scheduled publish routes.
 *
 * For each cross-promotion group the publisher belongs to:
 * 1. Creates a cross_promotion_posts record (snapshot)
 * 2. Creates pending actions (like + comment + repost) for each OTHER member
 * 3. Sends email notifications to each member with a review link
 */
export async function triggerCrossPromotion(
  postId: string,
  linkedinPostId: string,
  postContent: string,
  publisherUserId: string
): Promise<void> {
  try {
    // 1. Find all groups where this user is an accepted member
    const memberships = await db.query.crossPromotionMembers.findMany({
      where: and(
        eq(crossPromotionMembers.userId, publisherUserId),
        eq(crossPromotionMembers.status, "accepted")
      ),
    });

    if (memberships.length === 0) return;

    // 2. Get publisher's name
    const [publisher] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, publisherUserId))
      .limit(1);

    const publisherName =
      publisher?.name || publisher?.email || "A group member";

    // 3. For each group
    for (const membership of memberships) {
      // Get group info
      const group = await db.query.crossPromotionGroups.findFirst({
        where: eq(crossPromotionGroups.id, membership.groupId),
      });
      if (!group) continue;

      // Create cross-promotion post record
      const cpPostId = randomUUID();
      await db.insert(crossPromotionPosts).values({
        id: cpPostId,
        groupId: membership.groupId,
        postId,
        linkedinPostId,
        publishedByUserId: publisherUserId,
        postContent: postContent.substring(0, 500), // Snapshot for review
        notifiedAt: new Date(),
        createdAt: new Date(),
      });

      // Get all OTHER accepted members in this group (not the publisher)
      const otherMembers = await db.query.crossPromotionMembers.findMany({
        where: and(
          eq(crossPromotionMembers.groupId, membership.groupId),
          eq(crossPromotionMembers.status, "accepted"),
          ne(crossPromotionMembers.userId, publisherUserId)
        ),
      });

      // Create pending actions for each member (like + comment + repost all pending)
      for (const member of otherMembers) {
        if (!member.userId) continue;

        for (const actionType of ["like", "comment", "repost"] as const) {
          await db.insert(crossPromotionActions).values({
            id: randomUUID(),
            crossPromotionPostId: cpPostId,
            userId: member.userId,
            actionType,
            status: "pending",
          });
        }

        // Get member's email for notification
        const [memberUser] = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, member.userId))
          .limit(1);

        if (memberUser?.email) {
          // Send notification email
          try {
            await sendCrossPromotionNotifyEmail({
              to: memberUser.email,
              publisherName,
              groupName: group.name,
              postPreview: postContent.substring(0, 200),
              crossPromotionPostId: cpPostId,
            });
          } catch (error) {
            console.error(
              "[Cross Promotion] Failed to send notification:",
              error
            );
          }
        }
      }
    }
  } catch (error) {
    // Don't throw - cross-promotion failure should not block post publishing
    console.error("[Cross Promotion] Error:", error);
  }
}
