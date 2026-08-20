import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { linkedinAccounts, proxyAllocations } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { and, eq, gte, inArray, isNotNull, isNull, like, lt, or, sql, desc, type SQL } from "drizzle-orm";

/**
 * The admin's view of the user base.
 *
 * Filters are answered from our own columns, never from Stripe, so the list
 * stays one query however it is sliced. The nuance that matters: "paying"
 * and "trial" both hold a live subscription, the trial dates are what tell
 * them apart, mirrored onto the user row by the webhook.
 */
const FILTERS: Record<string, () => SQL | undefined> = {
  all: () => undefined,
  paying: () =>
    and(
      isNotNull(users.stripeSubscriptionId),
      or(isNull(users.trialEndedAt), lt(users.trialEndedAt, new Date()))
    ),
  trial: () =>
    and(
      isNotNull(users.stripeSubscriptionId),
      isNotNull(users.trialEndedAt),
      gte(users.trialEndedAt, new Date())
    ),
  card: () => isNotNull(users.stripeCustomerId),
  no_card: () => isNull(users.stripeCustomerId),
  ltd: () => eq(users.isLifetimeDeal, true),
  churned: () =>
    and(
      isNull(users.stripeSubscriptionId),
      eq(users.hasUsedTrial, true),
      eq(users.isLifetimeDeal, false)
    ),
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const filterKey = searchParams.get("filter") || "all";

    const offset = (page - 1) * limit;

    // Search covers name, email, and the dedicated address, so "which user
    // has 63.125.91.80" is one paste in the same box. The address lives on
    // the allocation; ownership is read through the LinkedIn account first,
    // the same way the renewal pass reads it.
    const searchCondition = search
      ? or(
          like(users.email, `%${search}%`),
          like(users.name, `%${search}%`),
          sql`EXISTS (
            SELECT 1 FROM proxy_allocations pa
            LEFT JOIN linkedin_accounts la ON la.id = pa.linkedin_account_id
            WHERE COALESCE(la.workspace_id, pa.workspace_id) = ${users.id}
              AND pa.last_exit_ip LIKE ${"%" + search + "%"}
          )`
        )
      : undefined;

    const filterCondition = (FILTERS[filterKey] ?? FILTERS.all)();
    const where = and(...[searchCondition, filterCondition].filter(Boolean));

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(where);
    const total = totalResult[0]?.count || 0;

    // Get users with pagination
    const usersList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        plan: users.plan,
        isLifetimeDeal: users.isLifetimeDeal,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        stripeCustomerId: users.stripeCustomerId,
        stripeSubscriptionId: users.stripeSubscriptionId,
        trialStartedAt: users.trialStartedAt,
        trialEndedAt: users.trialEndedAt,
        hasUsedTrial: users.hasUsedTrial,
        extraAgents: users.extraAgents,
        billingInterval: users.billingInterval,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // The connected LinkedIn accounts for this page of users, one grouped
    // query. The admin column shows the count and, in a popup, each account's
    // name linking to its LinkedIn profile.
    const ids = usersList.map((u) => u.id);
    const accountRows = ids.length
      ? await db
          .select({
            id: linkedinAccounts.id,
            workspaceId: linkedinAccounts.workspaceId,
            fullName: linkedinAccounts.fullName,
            email: linkedinAccounts.email,
            profileUrl: linkedinAccounts.profileUrl,
            status: linkedinAccounts.status,
            country: linkedinAccounts.country,
          })
          .from(linkedinAccounts)
          .where(inArray(linkedinAccounts.workspaceId, ids))
      : [];
    const accountsByUser = new Map<string, typeof accountRows>();
    for (const row of accountRows) {
      const list = accountsByUser.get(row.workspaceId) ?? [];
      list.push(row);
      accountsByUser.set(row.workspaceId, list);
    }

    // Their dedicated addresses, matched to accounts where bound and to the
    // workspace otherwise, so the popup can say "this account sends from
    // this IP" and still show a spare that is only parked on the workspace.
    const accountIds = accountRows.map((a) => a.id);
    const allocationRows = ids.length
      ? await db
          .select({
            id: proxyAllocations.id,
            workspaceId: proxyAllocations.workspaceId,
            linkedinAccountId: proxyAllocations.linkedinAccountId,
            country: proxyAllocations.country,
            exitIp: proxyAllocations.lastExitIp,
            status: proxyAllocations.status,
            source: proxyAllocations.source,
            expiresAt: proxyAllocations.expiresAt,
          })
          .from(proxyAllocations)
          .where(
            accountIds.length
              ? or(
                  inArray(proxyAllocations.workspaceId, ids),
                  inArray(proxyAllocations.linkedinAccountId, accountIds)
                )
              : inArray(proxyAllocations.workspaceId, ids)
          )
      : [];
    const allocationByAccount = new Map<string, (typeof allocationRows)[number]>();
    for (const a of allocationRows) {
      if (a.linkedinAccountId) allocationByAccount.set(a.linkedinAccountId, a);
    }

    // The billing truth for this page's subscribers, straight from Stripe:
    // trial end, scheduled cancellation, payment state. Only the few rows
    // holding a subscription id cost an API call, and a failed lookup shows
    // as no detail rather than a broken page.
    const subDetails = new Map<
      string,
      { status: string; trialEnd: number | null; cancelAt: number | null }
    >();
    await Promise.all(
      usersList
        .filter((u) => u.stripeSubscriptionId)
        .map(async (u) => {
          const sub = await stripe.subscriptions
            .retrieve(u.stripeSubscriptionId as string)
            .catch(() => null);
          if (sub) {
            subDetails.set(u.id, {
              status: sub.status,
              trialEnd: sub.trial_end ?? null,
              cancelAt: sub.cancel_at ?? null,
            });
          }
        })
    );

    return NextResponse.json({
      users: usersList.map((user) => {
        const accounts = (accountsByUser.get(user.id) ?? []).map((a) => {
          const allocation = allocationByAccount.get(a.id) ?? null;
          return {
            name: a.fullName || a.email,
            profileUrl: a.profileUrl,
            status: a.status,
            country: a.country,
            dedicatedIp: allocation?.exitIp ?? null,
            ipStatus: allocation?.status ?? null,
            ipExpiresAt: allocation?.expiresAt?.toISOString() ?? null,
          };
        });
        // Addresses paid for this workspace but bound to no account: parked
        // spares worth seeing, and worth wondering about.
        const boundIds = new Set(
          (accountsByUser.get(user.id) ?? [])
            .map((a) => allocationByAccount.get(a.id)?.id)
            .filter(Boolean)
        );
        const spareIps = allocationRows
          .filter(
            (a) =>
              a.workspaceId === user.id &&
              !a.linkedinAccountId &&
              !boundIds.has(a.id) &&
              a.status !== "released"
          )
          .map((a) => ({ ip: a.exitIp, country: a.country, status: a.status }));

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          isLifetimeDeal: user.isLifetimeDeal,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
          trialStartedAt: user.trialStartedAt?.toISOString() ?? null,
          trialEndedAt: user.trialEndedAt?.toISOString() ?? null,
          hasUsedTrial: user.hasUsedTrial,
          extraAgents: user.extraAgents ?? 0,
          billingInterval: user.billingInterval,
          // Paid means a live Stripe subscription, never the plan column: v1
          // wrote plan values (LTD holders carry business) with no card behind.
          hasSubscription: !!user.stripeSubscriptionId,
          subscription: subDetails.get(user.id) ?? null,
          accounts,
          spareIps,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
