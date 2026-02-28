import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { db, docsFeedback } from "@/lib/db";
import { desc, sql, eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleSlug, categorySlug, helpful, reason } = body;

    if (!articleSlug || !categorySlug || typeof helpful !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await db.insert(docsFeedback).values({
      id: nanoid(),
      articleSlug,
      categorySlug,
      helpful,
      reason: reason || null,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving docs feedback:", error);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const filter = searchParams.get("filter"); // "helpful", "not-helpful", or null for all
    const offset = (page - 1) * limit;

    const filterCondition =
      filter === "helpful"
        ? eq(docsFeedback.helpful, true)
        : filter === "not-helpful"
          ? eq(docsFeedback.helpful, false)
          : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(docsFeedback)
      .where(filterCondition);
    const total = totalResult[0]?.count || 0;

    // Get feedback entries
    const entries = await db
      .select()
      .from(docsFeedback)
      .where(filterCondition)
      .orderBy(desc(docsFeedback.createdAt))
      .limit(limit)
      .offset(offset);

    // Get article-level stats
    const stats = await db
      .select({
        articleSlug: docsFeedback.articleSlug,
        categorySlug: docsFeedback.categorySlug,
        totalVotes: sql<number>`count(*)`,
        helpfulVotes: sql<number>`sum(case when ${docsFeedback.helpful} = 1 then 1 else 0 end)`,
        notHelpfulVotes: sql<number>`sum(case when ${docsFeedback.helpful} = 0 then 1 else 0 end)`,
      })
      .from(docsFeedback)
      .groupBy(docsFeedback.articleSlug, docsFeedback.categorySlug)
      .orderBy(desc(sql`count(*)`));

    // Overall summary
    const summaryResult = await db
      .select({
        totalFeedback: sql<number>`count(*)`,
        totalHelpful: sql<number>`sum(case when ${docsFeedback.helpful} = 1 then 1 else 0 end)`,
        totalNotHelpful: sql<number>`sum(case when ${docsFeedback.helpful} = 0 then 1 else 0 end)`,
      })
      .from(docsFeedback);

    return NextResponse.json({
      entries,
      stats,
      summary: summaryResult[0] || { totalFeedback: 0, totalHelpful: 0, totalNotHelpful: 0 },
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching docs feedback:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}
