import { db } from "@/lib/db";
import { teams, teamMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Whether this user is allowed to act on a post somebody else owns.
 *
 * A team owner reaches every post in their team. A team admin reaches the
 * members' posts but not the other admins' and not the owner's, which is the
 * rule the dashboard has always applied. It lived twice in the posts routes and
 * a third copy was about to be written for publishing, so it lives here now.
 */
export async function canUserAccessPost(userId: string, postUserId: string): Promise<boolean> {
  if (userId === postUserId) return true;

  const ownedTeam = await db.query.teams.findFirst({
    where: eq(teams.ownerId, userId),
  });

  if (ownedTeam) {
    const members = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, ownedTeam.id));

    if (members.some((m) => m.userId === postUserId)) return true;
  }

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, userId),
  });

  if (membership && membership.role === "admin") {
    const sameTeam = await db
      .select({ userId: teamMembers.userId, role: teamMembers.role })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, membership.teamId));

    const owner = sameTeam.find((m) => m.userId === postUserId);
    if (owner && owner.role === "member") return true;
  }

  return false;
}
