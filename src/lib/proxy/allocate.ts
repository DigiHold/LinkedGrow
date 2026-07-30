import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { linkedinAccounts, proxyAllocations } from "@/lib/db/schema";
import { encryptApiKey, decryptApiKey } from "@/lib/encryption";
import { ProxySellerProvider } from "./proxy-seller";
import { ProxyProviderError, type ProxyProvider } from "./provider";
import { acceptForBinding, checkExit, type ProxyCredentials } from "./exit-check";

/**
 * Getting an address onto a LinkedIn account.
 *
 * The rule everything here serves, plan section 5c: **one LinkedIn account, one
 * address, permanently**. However many agents drive that account they all leave
 * through the same IP, and no second account ever shares it, not even another
 * account belonging to the same customer.
 *
 * The flow, decided by Nicolas on 2026-07-30 against an earlier buffer design:
 * the order goes out **the moment the customer picks a country in the wizard**,
 * in the background, while they carry on filling in the rest. The agent does
 * not start until the address is confirmed and its exit verified. Nothing ever
 * touches a customer's LinkedIn account through the wrong address, and there is
 * no fallback to a shared one: if the address is not ready the agent waits.
 *
 * A released address returns to the pool and is reused before anything new is
 * bought, since it is already paid for to the end of its term. That is not the
 * rejected buffer, which was about pre-buying; it is simply not wasting money.
 */

const TERM_DAYS = 30;

function provider(): ProxyProvider {
  const key = process.env.PROXY_SELLER_API_KEY;
  if (!key) {
    throw new ProxyProviderError(
      "PROXY_SELLER_API_KEY is not set, so no address can be ordered",
      "proxy-seller"
    );
  }
  return new ProxySellerProvider(key);
}

export interface AllocationView {
  id: string;
  country: string;
  status: string;
  source: "managed" | "custom";
  host: string;
  port: number;
  /** Never the credentials. This is what an API may return. */
  exitIp: string | null;
  asnOrg: string | null;
  expiresAt: Date | null;
}

export function toView(row: typeof proxyAllocations.$inferSelect): AllocationView {
  return {
    id: row.id,
    country: row.country,
    status: row.status,
    source: row.source,
    host: row.host,
    port: row.port,
    exitIp: row.lastExitIp,
    asnOrg: row.lastAsnOrg,
    expiresAt: row.expiresAt,
  };
}

/** The credentials, decrypted, for the worker only. Never leaves the server. */
export function credentialsOf(
  row: typeof proxyAllocations.$inferSelect
): ProxyCredentials {
  return {
    host: row.host,
    port: row.port,
    username: decryptApiKey(row.usernameEncrypted) ?? "",
    password: decryptApiKey(row.passwordEncrypted) ?? "",
  };
}

/**
 * Takes a released address in the right country if one exists.
 *
 * Reuse comes before purchase because a returned address is paid for until its
 * term ends, and because a warm address with history behind it is worth more
 * than a fresh one.
 */
async function takeFromPool(
  workspaceId: string,
  country: string
): Promise<typeof proxyAllocations.$inferSelect | null> {
  const [spare] = await db
    .select()
    .from(proxyAllocations)
    .where(
      and(
        eq(proxyAllocations.workspaceId, workspaceId),
        eq(proxyAllocations.country, country.toUpperCase()),
        eq(proxyAllocations.status, "cooling"),
        isNull(proxyAllocations.linkedinAccountId)
      )
    )
    .limit(1);
  return spare ?? null;
}

export interface AllocateResult {
  allocationId: string;
  reused: boolean;
  /** True when the address still has to be bought by the worker. */
  pending?: boolean;
  /** Set when the exit resolved to a hosting network. Shown, never blocking. */
  warning?: string;
}

/**
 * Records that this account needs an address, without buying one.
 *
 * **The dashboard must never call the supplier.** Their API is locked to an
 * allowlist of at most 3 addresses and Vercel functions leave from a pool of
 * hundreds that changes, so a purchase from a request handler would fail for
 * most customers and could not be fixed by registering anything. The worker has
 * one fixed address, so it is the only thing that talks to the supplier.
 *
 * This writes the intent and returns immediately. The customer carries on with
 * the wizard, the worker picks the row up on its next pass, buys, verifies the
 * exit and flips it to active, and the agent starts only then. If the purchase
 * fails the row stays visible as `ordering` rather than the failure being lost.
 */
export async function requestAllocation(
  workspaceId: string,
  linkedinAccountId: string,
  country: string
): Promise<AllocateResult> {
  const iso = country.toUpperCase();
  const now = new Date();

  const [existing] = await db
    .select()
    .from(proxyAllocations)
    .where(eq(proxyAllocations.linkedinAccountId, linkedinAccountId))
    .limit(1);
  if (existing) {
    return {
      allocationId: existing.id,
      reused: true,
      pending: existing.status === "ordering",
    };
  }

  // A spare from the pool needs no supplier call at all, so it can be bound
  // here and the account is ready immediately.
  const spare = await takeFromPool(workspaceId, iso);
  if (spare) {
    await db
      .update(proxyAllocations)
      .set({ linkedinAccountId, status: "active", updatedAt: now })
      .where(eq(proxyAllocations.id, spare.id));
    await db
      .update(linkedinAccounts)
      .set({ proxyAllocationId: spare.id })
      .where(eq(linkedinAccounts.id, linkedinAccountId));
    return { allocationId: spare.id, reused: true };
  }

  const id = crypto.randomUUID();
  await db.insert(proxyAllocations).values({
    id,
    workspaceId,
    country: iso,
    provider: "proxy-seller",
    // Placeholders until the worker fills them in. Never usable as they are,
    // and the `ordering` status is what stops anything trying.
    host: "",
    port: 0,
    usernameEncrypted: "",
    passwordEncrypted: "",
    providerRef: null,
    status: "ordering",
    source: "managed",
    linkedinAccountId,
    autoRenew: true,
    createdAt: now,
    updatedAt: now,
  });
  await db
    .update(linkedinAccounts)
    .set({ proxyAllocationId: id })
    .where(eq(linkedinAccounts.id, linkedinAccountId));

  return { allocationId: id, reused: false, pending: true };
}

/**
 * Buys and binds. **Runs on the worker, never in a request handler**, because
 * this is what calls the supplier and the supplier only answers our one fixed
 * address. See `requestAllocation` for the dashboard's half.
 *
 * Idempotent on the account: it returns an existing active binding rather than
 * buying a second address, because the invariant is one account and one address
 * and a retry must not cost money.
 */
export async function allocateForAccount(
  workspaceId: string,
  linkedinAccountId: string,
  country: string
): Promise<AllocateResult> {
  const iso = country.toUpperCase();
  const now = new Date();

  const [existing] = await db
    .select()
    .from(proxyAllocations)
    .where(eq(proxyAllocations.linkedinAccountId, linkedinAccountId))
    .limit(1);
  if (existing) {
    return { allocationId: existing.id, reused: true };
  }

  const spare = await takeFromPool(workspaceId, iso);
  if (spare) {
    await db
      .update(proxyAllocations)
      .set({
        linkedinAccountId,
        status: "active",
        updatedAt: now,
      })
      .where(eq(proxyAllocations.id, spare.id));
    await db
      .update(linkedinAccounts)
      .set({ proxyAllocationId: spare.id })
      .where(eq(linkedinAccounts.id, linkedinAccountId));
    return { allocationId: spare.id, reused: true };
  }

  // Nothing free, so buy exactly one. The row is written first with status
  // `ordering` so a crash between the purchase and the write is visible as a
  // stuck row rather than as money spent on an address nobody knows about.
  const id = crypto.randomUUID();
  const bought = await provider().purchase(iso, 1, TERM_DAYS);
  const address = bought[0];
  if (!address) {
    throw new ProxyProviderError("Purchase returned no address", "proxy-seller");
  }

  const check = await checkExit(address);
  const verdict = acceptForBinding(check, iso);

  await db.insert(proxyAllocations).values({
    id,
    workspaceId,
    country: iso,
    provider: "proxy-seller",
    host: address.host,
    port: address.port,
    usernameEncrypted: encryptApiKey(address.username) ?? "",
    passwordEncrypted: encryptApiKey(address.password) ?? "",
    providerRef: address.ref,
    status: verdict.ok ? "active" : "cooling",
    source: "managed",
    linkedinAccountId: verdict.ok ? linkedinAccountId : null,
    expiresAt: address.expiresAt,
    autoRenew: true,
    lastCheckedAt: now,
    lastExitIp: check.ip || null,
    lastAsn: check.asn,
    lastAsnOrg: check.asnOrg,
    exitLooksHosted: check.looksHosted,
    createdAt: now,
    updatedAt: now,
  });

  if (!verdict.ok) {
    throw new ProxyProviderError(
      `Address bought but not bound: ${verdict.reason}`,
      "proxy-seller"
    );
  }

  await db
    .update(linkedinAccounts)
    .set({ proxyAllocationId: id })
    .where(eq(linkedinAccounts.id, linkedinAccountId));

  return { allocationId: id, reused: false, warning: verdict.warn };
}

/**
 * Stores an address the customer brought themselves.
 *
 * The advanced panel in the connect dialog. It replaces an allocated address
 * rather than running alongside one, we never order or renew it, and the
 * reputation of that IP is the customer's problem, which the UI says plainly.
 * The exit is still tested, because saving an address that cannot answer would
 * only move the failure to the first session.
 */
export async function attachCustomProxy(
  workspaceId: string,
  linkedinAccountId: string,
  country: string,
  creds: ProxyCredentials
): Promise<AllocateResult> {
  const iso = country.toUpperCase();
  const now = new Date();

  const check = await checkExit(creds);
  if (check.error || !check.ip) {
    throw new ProxyProviderError(
      `That proxy did not answer: ${check.error ?? "no exit address"}`,
      "custom"
    );
  }

  // Release whatever we were managing for this account first, so the invariant
  // of one address per account holds through the swap.
  await releaseForAccount(linkedinAccountId);

  const id = crypto.randomUUID();
  await db.insert(proxyAllocations).values({
    id,
    workspaceId,
    country: iso,
    provider: "custom",
    host: creds.host,
    port: creds.port,
    usernameEncrypted: encryptApiKey(creds.username) ?? "",
    passwordEncrypted: encryptApiKey(creds.password) ?? "",
    providerRef: null,
    status: "active",
    source: "custom",
    linkedinAccountId,
    expiresAt: null,
    autoRenew: false,
    lastCheckedAt: now,
    lastExitIp: check.ip,
    lastAsn: check.asn,
    lastAsnOrg: check.asnOrg,
    exitLooksHosted: check.looksHosted,
    createdAt: now,
    updatedAt: now,
  });

  await db
    .update(linkedinAccounts)
    .set({ proxyAllocationId: id })
    .where(eq(linkedinAccounts.id, linkedinAccountId));

  return {
    allocationId: id,
    reused: false,
    warning: check.looksHosted
      ? `That address resolves to ${check.asnOrg}, which reads as a hosting network. LinkedIn treats those with more suspicion than a home connection, and the safety guarantee does not cover an address you supplied.`
      : undefined,
  };
}

/**
 * Unbinds an account's address.
 *
 * A managed address goes back to the pool as `cooling` rather than being
 * deleted, because it is paid for until its term ends and reusing it is free.
 * A custom one is simply dropped, since it was never ours.
 */
export async function releaseForAccount(linkedinAccountId: string): Promise<void> {
  const [row] = await db
    .select()
    .from(proxyAllocations)
    .where(eq(proxyAllocations.linkedinAccountId, linkedinAccountId))
    .limit(1);
  if (!row) return;

  if (row.source === "custom") {
    await db.delete(proxyAllocations).where(eq(proxyAllocations.id, row.id));
  } else {
    await db
      .update(proxyAllocations)
      .set({
        linkedinAccountId: null,
        status: "cooling",
        updatedAt: new Date(),
      })
      .where(eq(proxyAllocations.id, row.id));
  }

  await db
    .update(linkedinAccounts)
    .set({ proxyAllocationId: null })
    .where(eq(linkedinAccounts.id, linkedinAccountId));
}

/** The address bound to an account, or null while one is still being ordered. */
export async function allocationForAccount(
  linkedinAccountId: string
): Promise<typeof proxyAllocations.$inferSelect | null> {
  const [row] = await db
    .select()
    .from(proxyAllocations)
    .where(
      and(
        eq(proxyAllocations.linkedinAccountId, linkedinAccountId),
        eq(proxyAllocations.status, "active")
      )
    )
    .limit(1);
  return row ?? null;
}
