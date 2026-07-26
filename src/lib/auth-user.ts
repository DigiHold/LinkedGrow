import { db } from "@/lib/db";
import { users, teams, teamMembers } from "@/lib/db/schema";
import { alias } from "drizzle-orm/sqlite-core";
import { eq } from "drizzle-orm";

/**
 * The one read behind every authenticated request.
 *
 * NextAuth's jwt callback runs on every session read, and auth() is called in
 * the middleware, in the dashboard layout and in every API route. The previous
 * implementation chained four queries there (user, membership, team, owner).
 * Turso is SQLite over HTTP, so those are four network round trips, and a
 * single page load that also calls three API routes paid them five times over:
 * around twenty round trips to re-read rows that had not changed.
 *
 * Two changes fix that without giving up any guarantee.
 *
 * 1. It is one query. The membership, the team and the owner hang off the user
 *    by foreign key, so they are left joins, not follow-up requests.
 *
 * 2. A two second in-process cache. The point is not to serve stale data for
 *    minutes, it is to collapse the burst of auth() calls that all happen
 *    inside one page load. Password-change invalidation and plan changes are
 *    therefore late by at most two seconds, and handlers that change either can
 *    call invalidateSessionUser to make it immediate.
 *
 * The cache is per lambda instance, like src/lib/rate-limit.ts. On a cold
 * instance the first call simply reads the database.
 */

export type SessionUser = {
  user: typeof users.$inferSelect;
  isTeamMember: boolean;
  teamId: string | null;
  teamRole: string | null;
  teamOwnerId: string | null;
  /** Team members inherit the owner's plan. Null when there is no owner. */
  ownerPlan: string | null;
};

const TTL_MS = 2_000;
const cache = new Map<string, { at: number; value: SessionUser | null }>();

/** Bound the map so a long-lived instance cannot grow without limit. */
function prune(now: number) {
  if (cache.size < 500) return;
  for (const [key, entry] of cache) {
    if (now - entry.at > TTL_MS) cache.delete(key);
  }
  if (cache.size >= 500) cache.clear();
}

export function invalidateSessionUser(userId: string) {
  cache.delete(userId);
}

export async function loadSessionUser(
  userId: string
): Promise<SessionUser | null> {
  const now = Date.now();
  const hit = cache.get(userId);
  if (hit && now - hit.at < TTL_MS) {
    return hit.value;
  }

  const owner = alias(users, "team_owner");

  const [row] = await db
    .select({
      user: users,
      teamId: teamMembers.teamId,
      teamRole: teamMembers.role,
      teamOwnerId: teams.ownerId,
      ownerPlan: owner.plan,
    })
    .from(users)
    .leftJoin(teamMembers, eq(teamMembers.userId, users.id))
    .leftJoin(teams, eq(teams.id, teamMembers.teamId))
    .leftJoin(owner, eq(owner.id, teams.ownerId))
    .where(eq(users.id, userId))
    .limit(1);

  const value: SessionUser | null = row?.user
    ? {
        user: row.user,
        // "owner" as a role means they run the team, so they are not a member
        // inheriting someone else's plan.
        isTeamMember: !!row.teamRole && row.teamRole !== "owner",
        teamId: row.teamRole && row.teamRole !== "owner" ? row.teamId : null,
        teamRole: row.teamRole && row.teamRole !== "owner" ? row.teamRole : null,
        teamOwnerId:
          row.teamRole && row.teamRole !== "owner" ? row.teamOwnerId : null,
        ownerPlan:
          row.teamRole && row.teamRole !== "owner" ? row.ownerPlan : null,
      }
    : null;

  prune(now);
  cache.set(userId, { at: now, value });
  return value;
}
