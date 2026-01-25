import { db, users, teamMembers, teams, teamInvites } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * Get the user whose AI settings should be used.
 * For team members (admin/member), returns the team owner's settings.
 * For owners or standalone users, returns their own settings.
 */
export async function getAISettingsUser(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return null;
  }

  // Check if user is a team member (not owner)
  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (membership && membership.role !== "owner") {
    // Get team to find owner
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, membership.teamId),
    });

    if (team) {
      const owner = await db.query.users.findFirst({
        where: eq(users.id, team.ownerId),
      });

      if (owner) {
        return { user, aiSettingsUser: owner, isTeamMember: true };
      }
    }
  }

  return { user, aiSettingsUser: user, isTeamMember: false };
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
 * Get the user whose LinkedIn credentials should be used.
 * For team members (admin/member), returns the team owner's credentials.
 * For owners or standalone users, returns their own credentials.
 */
export async function getLinkedInUser(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return null;
  }

  // Check if user is a team member (not owner)
  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
  });

  if (membership && membership.role !== "owner") {
    // Get team to find owner
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, membership.teamId),
    });

    if (team) {
      const owner = await db.query.users.findFirst({
        where: eq(users.id, team.ownerId),
      });

      if (owner) {
        return { user, linkedInUser: owner, isTeamMember: true };
      }
    }
  }

  return { user, linkedInUser: user, isTeamMember: false };
}
