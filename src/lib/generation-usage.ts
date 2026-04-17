import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { PLANS, type PlanId } from "@/lib/plans";

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7); // "2026-04"
}

export interface GenerationCheck {
  allowed: boolean;
  used: number;
  limit: number; // -1 = unlimited
  remaining: number; // -1 = unlimited
  period: string;
}

/**
 * Check whether the user can generate another post this period.
 * Returns current usage regardless of allowed. Does NOT increment.
 */
export async function checkGenerationLimit(
  userId: string,
  plan: PlanId
): Promise<GenerationCheck> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { generationsUsed: true, generationsPeriod: true },
  });

  const period = currentPeriod();
  const sameMonth = user?.generationsPeriod === period;
  const used = sameMonth ? user?.generationsUsed ?? 0 : 0;
  const limit = PLANS[plan].limits.postsPerMonth;

  if (limit === -1) {
    return { allowed: true, used, limit, remaining: -1, period };
  }

  const remaining = Math.max(0, limit - used);
  return {
    allowed: used < limit,
    used,
    limit,
    remaining,
    period,
  };
}

/**
 * Increment the user's generation counter. Resets the counter if the stored
 * period is stale (different month from now).
 */
export async function incrementGenerationUsage(userId: string): Promise<void> {
  const period = currentPeriod();

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { generationsUsed: true, generationsPeriod: true },
  });

  const sameMonth = user?.generationsPeriod === period;
  const nextUsed = (sameMonth ? user?.generationsUsed ?? 0 : 0) + 1;

  await db
    .update(users)
    .set({
      generationsUsed: nextUsed,
      generationsPeriod: period,
    })
    .where(eq(users.id, userId));
}
