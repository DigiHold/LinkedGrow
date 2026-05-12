import { db } from "@/lib/db";
import {
  networkNotificationGroups,
  networkNotificationMembers,
  networkNotificationPosts,
  users,
} from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { randomUUID } from "crypto";
import { sendNetworkNotificationNotifyEmail } from "@/lib/email";

export async function triggerNetworkNotifications(
  postId: string,
  linkedinPostId: string,
  postContent: string,
  publisherUserId: string
): Promise<void> {
  try {
    const memberships = await db.query.networkNotificationMembers.findMany({
      where: and(
        eq(networkNotificationMembers.userId, publisherUserId),
        eq(networkNotificationMembers.status, "accepted")
      ),
    });

    if (memberships.length === 0) return;

    const [publisher] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, publisherUserId))
      .limit(1);

    const publisherName =
      publisher?.name || publisher?.email || "A group member";

    const linkedinUrl = `https://www.linkedin.com/feed/update/${linkedinPostId}`;

    for (const membership of memberships) {
      const existing = await db.query.networkNotificationPosts.findFirst({
        where: and(
          eq(networkNotificationPosts.postId, postId),
          eq(networkNotificationPosts.groupId, membership.groupId)
        ),
      });
      if (existing) continue;

      const group = await db.query.networkNotificationGroups.findFirst({
        where: eq(networkNotificationGroups.id, membership.groupId),
      });
      if (!group) continue;

      await db.insert(networkNotificationPosts).values({
        id: randomUUID(),
        groupId: membership.groupId,
        postId,
        linkedinPostId,
        publishedByUserId: publisherUserId,
        postContent: postContent.substring(0, 500),
        notifiedAt: new Date(),
        createdAt: new Date(),
      });

      const otherMembers = await db.query.networkNotificationMembers.findMany({
        where: and(
          eq(networkNotificationMembers.groupId, membership.groupId),
          eq(networkNotificationMembers.status, "accepted"),
          ne(networkNotificationMembers.userId, publisherUserId)
        ),
      });

      for (const member of otherMembers) {
        if (!member.userId) continue;

        const [memberUser] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, member.userId))
          .limit(1);

        if (memberUser?.email) {
          try {
            await sendNetworkNotificationNotifyEmail({
              to: memberUser.email,
              publisherName,
              groupName: group.name,
              postPreview: postContent.substring(0, 200),
              linkedinUrl,
            });
          } catch (error) {
            console.error(
              "[Network Notifications] Failed to send notification:",
              error
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("[Network Notifications] Error:", error);
  }
}

export async function triggerTeamNotifications(
  postId: string,
  linkedinPostId: string,
  ownerUserId: string,
  postContent: string
): Promise<void> {
  try {
    const { teams, teamMembers } = await import("@/lib/db/schema");

    const ownerMembership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.userId, ownerUserId),
        eq(teamMembers.role, "owner")
      ),
    });

    if (!ownerMembership) return;

    const [team] = await db
      .select({ name: teams.name })
      .from(teams)
      .where(eq(teams.id, ownerMembership.teamId))
      .limit(1);

    const [owner] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, ownerUserId))
      .limit(1);

    const ownerName = owner?.name || owner?.email || "Your team owner";

    const otherMembers = await db.query.teamMembers.findMany({
      where: and(
        eq(teamMembers.teamId, ownerMembership.teamId),
        ne(teamMembers.role, "owner")
      ),
    });

    const linkedinUrl = `https://www.linkedin.com/feed/update/${linkedinPostId}`;

    for (const member of otherMembers) {
      const [memberUser] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, member.userId))
        .limit(1);

      if (!memberUser?.email) continue;

      try {
        await sendNetworkNotificationNotifyEmail({
          to: memberUser.email,
          publisherName: ownerName,
          groupName: team?.name || "your team",
          postPreview: postContent.substring(0, 200),
          linkedinUrl,
        });
      } catch (error) {
        console.error(
          "[Team Notifications] Failed to send notification:",
          error
        );
      }
    }

    void postId;
  } catch (error) {
    console.error("[Team Notifications] Error:", error);
  }
}
