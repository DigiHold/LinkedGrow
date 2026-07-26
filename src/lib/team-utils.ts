import { db, users, teamMembers, teams, teamInvites } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * Get the user whose AI settings should be used.
 * For team members (admin/member), returns the team owner's settings.
 * For owners or standalone users, returns their own settings.
 */
export async function getAISettingsUser(userId: string) {
  // This runs on nearly every authenticated request, and Turso is SQLite over
  // HTTP: every await here is a network round trip, not a local read. It used
  // to chain four of them (user, membership, team, owner) even for a solo user
  // who has no team at all.
  //
  // The user lookup and the membership lookup are independent, so they go
  // together. That alone makes the common case one round trip instead of two.
  const [user, membership] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    db.query.teamMembers.findFirst({ where: eq(teamMembers.userId, userId) }),
  ]);

  if (!user) {
    return null;
  }

  if (membership && membership.role !== "owner") {
    // The team exists only to name its owner, so join through it rather than
    // fetching the team and then the owner as two more trips.
    const [row] = await db
      .select({ owner: users })
      .from(teams)
      .innerJoin(users, eq(users.id, teams.ownerId))
      .where(eq(teams.id, membership.teamId))
      .limit(1);

    if (row?.owner) {
      return { user, aiSettingsUser: row.owner, isTeamMember: true };
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
  // Same shape and the same reasoning as getAISettingsUser above: two
  // independent lookups in parallel, then one join instead of two more trips.
  const [user, membership] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    db.query.teamMembers.findFirst({ where: eq(teamMembers.userId, userId) }),
  ]);

  if (!user) {
    return null;
  }

  if (membership && membership.role !== "owner") {
    const [row] = await db
      .select({ owner: users })
      .from(teams)
      .innerJoin(users, eq(users.id, teams.ownerId))
      .where(eq(teams.id, membership.teamId))
      .limit(1);

    if (row?.owner) {
      return { user, linkedInUser: row.owner, isTeamMember: true };
    }
  }

  return { user, linkedInUser: user, isTeamMember: false };
}
