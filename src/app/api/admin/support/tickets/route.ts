// Admin: list all tickets with filtering. Used by /dashboard/admin/support.
import { NextRequest, NextResponse } from "next/server";
import { db, supportTickets, users } from "@/lib/db";
import { eq, desc, and, like, or, sql } from "drizzle-orm";
import { getSupportSession } from "@/lib/support";

const VALID_STATUS = ["open", "in_progress", "resolved", "closed"] as const;

export async function GET(request: NextRequest) {
  const session = await getSupportSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const conditions = [];
  if (status && (VALID_STATUS as readonly string[]).includes(status)) {
    conditions.push(eq(supportTickets.status, status as typeof VALID_STATUS[number]));
  }
  if (q) {
    conditions.push(
      or(
        like(supportTickets.subject, `%${q}%`),
        like(users.email, `%${q}%`),
        like(users.name, `%${q}%`),
        eq(supportTickets.id, q)
      )!
    );
  }

  const rows = await db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      category: supportTickets.category,
      status: supportTickets.status,
      priority: supportTickets.priority,
      source: supportTickets.source,
      hasUnreadForAdmin: supportTickets.hasUnreadForAdmin,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
      lastUserReplyAt: supportTickets.lastUserReplyAt,
      lastAdminReplyAt: supportTickets.lastAdminReplyAt,
      userId: supportTickets.userId,
      userEmail: users.email,
      userName: users.name,
      userImage: users.image,
      userPlan: users.plan,
    })
    .from(supportTickets)
    .leftJoin(users, eq(supportTickets.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(supportTickets.updatedAt))
    .limit(limit);

  // Status counts for tab badges
  const counts = await db
    .select({ status: supportTickets.status, count: sql<number>`count(*)` })
    .from(supportTickets)
    .groupBy(supportTickets.status);
  const countMap: Record<string, number> = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
  for (const row of counts) countMap[row.status] = Number(row.count);

  return NextResponse.json({ tickets: rows, counts: countMap });
}
