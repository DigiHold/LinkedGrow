import { db, teamInvites, teams, teamMembers, users } from "@/lib/db";
import { and, eq, isNotNull, ne } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";

/**
 * Get the user whose AI settings should be used.
 * For team members (admin/member), returns the team owner's settings.
 * For owners or standalone users, returns their own settings.
 */
export async function getAISettingsUser(userId: string) {
  // Delegates to the same cached, single-query read auth() just performed for
  // this request, so in practice this costs zero additional round trips.
  const data = await loadSessionUser(userId);
  if (!data) return null;
  return {
    user: data.user,
    aiSettingsUser: data.owner ?? data.user,
    isTeamMember: data.isTeamMember,
  };
}

/**
 * Get the user whose LinkedIn connection should be used.
 * Team members post through the owner's connected account.
 */
export async function getLinkedInUser(userId: string) {
  const data = await loadSessionUser(userId);
  if (!data) return null;
  return {
    user: data.user,
    linkedInUser: data.owner ?? data.user,
    isTeamMember: data.isTeamMember,
  };
}

/**
 * Check if an email has a pending team invite.
 * Used to skip welcome emails for team members during registration.
 */
export async function hasPendingTeamInvite(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();

  const invite = await db.query.teamInvites.findFirst({
    where: eq(teamInvites.email, normalizedEmail),
  });

  // Check if invite exists and is not expired
  if (invite && invite.expiresAt && new Date() < invite.expiresAt) {
    return true;
  }

  return false;
}


/**
 * Everybody who can be handed a conversation in this workspace.
 *
 * The owner first, then the members who actually accepted their invitation: a
 * pending invite is an email address, not somebody who can answer a prospect.
 * One person comes back on a solo workspace, which is how the Replies page
 * knows to show no assignment control at all.
 */
export async function workspaceMembers(workspaceId: string) {
  const owner = await db.query.users.findFirst({
    where: eq(users.id, workspaceId),
    columns: { id: true, name: true, email: true, image: true },
  });

  const team = await db.query.teams.findFirst({
    where: eq(teams.ownerId, workspaceId),
    columns: { id: true },
  });

  const others = team
    ? await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        })
        .from(teamMembers)
        .innerJoin(users, eq(users.id, teamMembers.userId))
        .where(
          and(
            eq(teamMembers.teamId, team.id),
            isNotNull(teamMembers.acceptedAt),
            ne(teamMembers.userId, workspaceId)
          )
        )
    : [];

  return [
    ...(owner ? [{ ...owner, isOwner: true }] : []),
    ...others.map((m) => ({ ...m, isOwner: false })),
  ];
}
