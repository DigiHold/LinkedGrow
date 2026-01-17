import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { like, or, sql, desc } from "drizzle-orm";

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
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        linkedinProfileName: users.linkedinProfileName,
        stripeCustomerId: users.stripeCustomerId,
      })
      .from(users)
      .where(searchCondition)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      users: usersList.map((user) => ({
        ...user,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
