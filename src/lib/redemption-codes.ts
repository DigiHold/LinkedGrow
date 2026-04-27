import { randomInt } from "crypto";
import { db } from "./db";
import { redemptionCodes, users } from "./db/schema";
import { eq, and, sql } from "drizzle-orm";
import { addToLtdList, removeFromLtdList } from "./newsletter";

export type RedemptionSource = "dealify" | "dealmirror" | "dealfuel";

export const SOURCE_PREFIX: Record<RedemptionSource, string> = {
  dealify: "DLFY",
  dealmirror: "DLMR",
  dealfuel: "DLFL",
};

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomSegment(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return out;
}

export function generateCode(source: RedemptionSource): string {
  return `${SOURCE_PREFIX[source]}-${randomSegment(4)}-${randomSegment(4)}-${randomSegment(4)}`;
}

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidCodeFormat(code: string, source: RedemptionSource): boolean {
  const prefix = SOURCE_PREFIX[source];
  const pattern = new RegExp(`^${prefix}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$`);
  return pattern.test(code);
}

export async function generateBatch(
  source: RedemptionSource,
  count: number,
  batch: string
): Promise<string[]> {
  if (count <= 0 || count > 100000) {
    throw new Error("count must be between 1 and 100000");
  }
  const now = new Date();
  const codes: string[] = [];
  const rows = [];
  const seen = new Set<string>();
  while (codes.length < count) {
    const code = generateCode(source);
    if (seen.has(code)) continue;
    seen.add(code);
    codes.push(code);
    rows.push({
      code,
      batch,
      source,
      plan: "business" as const,
      status: "unused" as const,
      createdAt: now,
    });
  }
  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await db.insert(redemptionCodes).values(rows.slice(i, i + chunkSize));
  }
  return codes;
}

export type RedeemResult =
  | { ok: true }
  | { ok: false; reason: "invalid_format" | "not_found" | "already_redeemed" | "revoked" | "wrong_source" };

export async function redeemCode(
  rawCode: string,
  userId: string,
  expectedSource: RedemptionSource
): Promise<RedeemResult> {
  const code = normalizeCode(rawCode);
  if (!isValidCodeFormat(code, expectedSource)) {
    return { ok: false, reason: "invalid_format" };
  }
  const existing = await db
    .select()
    .from(redemptionCodes)
    .where(eq(redemptionCodes.code, code))
    .limit(1);
  const row = existing[0];
  if (!row) return { ok: false, reason: "not_found" };
  if (row.source !== expectedSource) return { ok: false, reason: "wrong_source" };
  if (row.status === "revoked") return { ok: false, reason: "revoked" };
  if (row.status === "redeemed") return { ok: false, reason: "already_redeemed" };

  // Atomic claim: only flip if still unused.
  const now = new Date();
  const result = await db
    .update(redemptionCodes)
    .set({ status: "redeemed", redeemedBy: userId, redeemedAt: now })
    .where(and(eq(redemptionCodes.code, code), eq(redemptionCodes.status, "unused")))
    .returning({ code: redemptionCodes.code });

  if (result.length === 0) {
    // Lost the race to another redeem in flight.
    return { ok: false, reason: "already_redeemed" };
  }

  await db
    .update(users)
    .set({
      plan: "business",
      isLifetimeDeal: true,
      ltdSource: expectedSource,
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  return { ok: true };
}

export type RevokeResult = {
  code: string;
  status: "revoked" | "not_found" | "already_revoked" | "still_unused";
  userId?: string;
};

export async function revokeCode(rawCode: string): Promise<RevokeResult> {
  const code = normalizeCode(rawCode);
  const rows = await db
    .select()
    .from(redemptionCodes)
    .where(eq(redemptionCodes.code, code))
    .limit(1);
  const row = rows[0];
  if (!row) return { code, status: "not_found" };
  if (row.status === "revoked") return { code, status: "already_revoked", userId: row.redeemedBy ?? undefined };

  const now = new Date();

  // If still unused: flip to revoked (blacklists a leaked or abused code).
  if (row.status === "unused") {
    await db
      .update(redemptionCodes)
      .set({ status: "revoked", revokedAt: now })
      .where(eq(redemptionCodes.code, code));
    return { code, status: "still_unused" };
  }

  // Redeemed: downgrade user, clear lifetime, revoke code.
  await db
    .update(redemptionCodes)
    .set({ status: "revoked", revokedAt: now })
    .where(eq(redemptionCodes.code, code));

  if (row.redeemedBy) {
    const userRow = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, row.redeemedBy))
      .limit(1);

    await db
      .update(users)
      .set({
        plan: "free",
        isLifetimeDeal: false,
        ltdSource: null,
        updatedAt: now,
      })
      .where(eq(users.id, row.redeemedBy));

    if (userRow[0]?.email) {
      try { await removeFromLtdList(userRow[0].email); } catch {}
    }
  }

  return { code, status: "revoked", userId: row.redeemedBy ?? undefined };
}

export async function getStats() {
  const rows = await db
    .select({
      source: redemptionCodes.source,
      batch: redemptionCodes.batch,
      status: redemptionCodes.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(redemptionCodes)
    .groupBy(redemptionCodes.source, redemptionCodes.batch, redemptionCodes.status);

  const bySource: Record<string, Record<string, { unused: number; redeemed: number; revoked: number }>> = {};
  for (const r of rows) {
    const src = r.source;
    const batch = r.batch;
    if (!bySource[src]) bySource[src] = {};
    if (!bySource[src][batch]) bySource[src][batch] = { unused: 0, redeemed: 0, revoked: 0 };
    bySource[src][batch][r.status as "unused" | "redeemed" | "revoked"] = Number(r.count);
  }

  return bySource;
}

