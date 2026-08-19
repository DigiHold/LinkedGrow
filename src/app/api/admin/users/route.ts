import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { linkedinAccounts } from "@/lib/db/schema";
import { inArray, like, or, sql, desc } from "drizzle-orm";

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

    const offset = (page - 1) * limit;

    // Build search condition
    const searchCondition = search
      ? or(
          like(users.email, `%${search}%`),
          like(users.name, `%${search}%`)
        )
      : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(searchCondition);
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
      })
      .from(users)
      .where(searchCondition)
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
            workspaceId: linkedinAccounts.workspaceId,
            fullName: linkedinAccounts.fullName,
            email: linkedinAccounts.email,
            profileUrl: linkedinAccounts.profileUrl,
            status: linkedinAccounts.status,
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

    return NextResponse.json({
      users: usersList.map(({ stripeSubscriptionId, ...user }) => ({
        ...user,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        // Paid means a live Stripe subscription, never the plan column: v1
        // wrote plan values (LTD holders carry business) with no card behind.
        hasSubscription: !!stripeSubscriptionId,
        accounts: (accountsByUser.get(user.id) ?? []).map((a) => ({
          name: a.fullName || a.email,
          profileUrl: a.profileUrl,
          status: a.status,
        })),
      })),
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
