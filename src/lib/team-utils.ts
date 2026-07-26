import { db, teamInvites } from "@/lib/db";
import { eq } from "drizzle-orm";
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

