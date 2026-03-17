import { db } from "@/lib/db";
import { teams, teamMembers, teamEngagementJobs, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { scheduleTeamEngagement } from "@/lib/qstash";

interface TeamEngagementJob {
  jobId: string;
  userId: string;
  actionType: "like" | "comment" | "share";
  delaySeconds: number;
  commentText?: string;
}

/**
 * Trigger auto-engagement from team members after a company page post publishes.
 * Only runs for organization (company page) posts.
 */
export async function triggerTeamAutoEngagement(
  postId: string,
  linkedinPostId: string,
  ownerUserId: string
): Promise<void> {
  try {
    // 1. Find the owner's team
    const ownerMembership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.userId, ownerUserId),
        eq(teamMembers.role, "owner")
      ),
    });

    if (!ownerMembership) {
      console.log("[Team Engage] Owner has no team, skipping");
      return;
    }

    // 2. Get all other team members (exclude owner)
    const members = await db.query.teamMembers.findMany({
      where: eq(teamMembers.teamId, ownerMembership.teamId),
    });

    const nonOwnerMembers = members.filter((m) => m.role !== "owner");

    if (nonOwnerMembers.length === 0) {
      console.log("[Team Engage] No non-owner team members, skipping");
      return;
    }

    // 3. Fetch user data for each member to check LinkedIn connection
    const memberUserIds = nonOwnerMembers.map((m) => m.userId);
    const allMemberUsers: {
      id: string;
      linkedinAccessToken: string | null;
      linkedinProfileId: string | null;
      linkedinTokenExpiry: Date | null;
      name: string | null;
    }[] = [];

    for (const uid of memberUserIds) {
      const [u] = await db
        .select({
          id: users.id,
          linkedinAccessToken: users.linkedinAccessToken,
          linkedinProfileId: users.linkedinProfileId,
          linkedinTokenExpiry: users.linkedinTokenExpiry,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, uid))
        .limit(1);
      if (u) allMemberUsers.push(u);
    }

    // 4. Build jobs for opted-in members with valid LinkedIn tokens
    const jobs: TeamEngagementJob[] = [];
    const now = new Date();
    let likeIndex = 0;
    let commentIndex = 0;
    let shareIndex = 0;

    for (const member of nonOwnerMembers) {
      const memberUser = allMemberUsers.find((u) => u.id === member.userId);
      if (!memberUser) continue;

      // Check if member has their own LinkedIn connected and token is valid
      if (!memberUser.linkedinAccessToken || !memberUser.linkedinProfileId) {
        console.log(`[Team Engage] Member ${member.userId} has no LinkedIn connected, skipping`);
        continue;
      }

      if (memberUser.linkedinTokenExpiry && memberUser.linkedinTokenExpiry < now) {
        console.log(`[Team Engage] Member ${member.userId} LinkedIn token expired, skipping`);
        continue;
      }

      // Like: random delay 2-8 minutes, staggered per member
      if (member.autoEngageLike) {
        const baseDelay = 120 + likeIndex * 60; // 2 min + 1 min per member
        const jitter = Math.floor(Math.random() * 120); // 0-2 min random jitter
        jobs.push({
          jobId: randomUUID(),
          userId: member.userId,
          actionType: "like",
          delaySeconds: baseDelay + jitter,
        });
        likeIndex++;
      }

      // Comment: random delay 5-20 minutes, staggered
      if (member.autoEngageComment) {
        const baseDelay = 300 + commentIndex * 120; // 5 min + 2 min per member
        const jitter = Math.floor(Math.random() * 300); // 0-5 min random jitter
        jobs.push({
          jobId: randomUUID(),
          userId: member.userId,
          actionType: "comment",
          delaySeconds: baseDelay + jitter,
        });
        commentIndex++;
      }

      // Share: random delay 15-45 minutes, staggered
      if (member.autoEngageShare) {
        const baseDelay = 900 + shareIndex * 180; // 15 min + 3 min per member
        const jitter = Math.floor(Math.random() * 600); // 0-10 min random jitter
        jobs.push({
          jobId: randomUUID(),
          userId: member.userId,
          actionType: "share",
          delaySeconds: baseDelay + jitter,
        });
        shareIndex++;
      }
    }

    if (jobs.length === 0) {
      console.log("[Team Engage] No eligible jobs to schedule");
      return;
    }

    // 5. Insert job records into database
    for (const job of jobs) {
      await db.insert(teamEngagementJobs).values({
        id: job.jobId,
        postId,
        teamMemberId: nonOwnerMembers.find((m) => m.userId === job.userId)!.id,
        userId: job.userId,
        actionType: job.actionType,
        status: "pending",
        commentText: job.commentText || null,
        delaySeconds: job.delaySeconds,
        createdAt: now,
      });
    }

    // 6. Schedule via QStash
    await scheduleTeamEngagement(postId, linkedinPostId, jobs);

    console.log(`[Team Engage] Scheduled ${jobs.length} jobs for post ${postId}`);
  } catch (error) {
    console.error("[Team Engage] Failed to trigger team auto-engagement:", error);
    // Don't throw - team engagement failure should not block post publishing
  }
}
