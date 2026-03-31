import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { engagementLists, engagementListProfiles, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { canAccessFeature, type PlanId } from "@/lib/plans";

// GET /api/engagement/lists - Get all lists with their profiles
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, session.user.id));
    if (!canAccessFeature((user?.plan || "free") as PlanId, "engagement")) {
      return NextResponse.json({ error: "Requires Pro plan" }, { status: 403 });
    }

    const lists = await db
      .select()
      .from(engagementLists)
      .where(eq(engagementLists.userId, session.user.id))
      .orderBy(engagementLists.createdAt);

    // Get profiles for each list
    const listsWithProfiles = await Promise.all(
      lists.map(async (list) => {
        const profiles = await db
          .select()
          .from(engagementListProfiles)
          .where(eq(engagementListProfiles.listId, list.id));
        return { ...list, profiles };
      })
    );

    return NextResponse.json({ lists: listsWithProfiles });
  } catch (error) {
return NextResponse.json({ error: "Failed to load lists" }, { status: 500 });
  }
}

// POST /api/engagement/lists - Create a new list
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, session.user.id));
    if (!canAccessFeature((user?.plan || "free") as PlanId, "engagement")) {
      return NextResponse.json({ error: "Requires Pro plan" }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "List name is required" }, { status: 400 });
    }

    // Max 20 lists per user
    const existingLists = await db
      .select()
      .from(engagementLists)
      .where(eq(engagementLists.userId, session.user.id));
    if (existingLists.length >= 20) {
      return NextResponse.json({ error: "Maximum 20 lists allowed" }, { status: 400 });
    }

    const id = nanoid();
    await db.insert(engagementLists).values({
      id,
      userId: session.user.id,
      name: name.trim(),
      createdAt: new Date(),
    });

    return NextResponse.json({
      list: { id, userId: session.user.id, name: name.trim(), profiles: [] },
    });
  } catch (error) {
return NextResponse.json({ error: "Failed to create list" }, { status: 500 });
  }
}
