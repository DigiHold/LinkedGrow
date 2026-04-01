import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  crossPromotionGroups,
  crossPromotionMembers,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { canAccessFeature } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

// GET /api/cross-promotion/groups - List all groups user is a member of
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPlan = (session.user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "crossPromotion")) {
      return NextResponse.json(
        { error: "Cross Promotion requires Pro plan or higher" },
        { status: 403 }
      );
    }

    // Find all groups where user is a member with status "accepted"
    const memberships = await db
      .select({
        groupId: crossPromotionMembers.groupId,
      })
      .from(crossPromotionMembers)
      .where(
        and(
          eq(crossPromotionMembers.userId, session.user.id),
          eq(crossPromotionMembers.status, "accepted")
        )
      );

    if (memberships.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    const groupIds = memberships.map((m) => m.groupId);

    // Get group details with owner name and member count
    const groups = [];
    for (const groupId of groupIds) {
      const group = await db
        .select({
          id: crossPromotionGroups.id,
          name: crossPromotionGroups.name,
          ownerId: crossPromotionGroups.ownerId,
          createdAt: crossPromotionGroups.createdAt,
        })
        .from(crossPromotionGroups)
        .where(eq(crossPromotionGroups.id, groupId))
        .limit(1);

      if (group.length === 0) continue;

      const owner = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, group[0].ownerId))
        .limit(1);

      const memberCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(crossPromotionMembers)
        .where(
          and(
            eq(crossPromotionMembers.groupId, groupId),
            eq(crossPromotionMembers.status, "accepted")
          )
        );

      groups.push({
        ...group[0],
        ownerName: owner[0]?.name || owner[0]?.email || "Unknown",
        isOwner: group[0].ownerId === session.user.id,
        memberCount: memberCount[0]?.count || 0,
      });
    }

    return NextResponse.json({ groups });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

// POST /api/cross-promotion/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPlan = (session.user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "crossPromotion")) {
      return NextResponse.json(
        { error: "Cross Promotion requires Pro plan or higher" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = body;

    // Validate name
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 50) {
      return NextResponse.json(
        { error: "Group name must be between 1 and 50 characters" },
        { status: 400 }
      );
    }

    // Get user email for the owner membership record
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const groupId = randomUUID();
    const memberId = randomUUID();
    const now = new Date();

    // Create the group
    await db.insert(crossPromotionGroups).values({
      id: groupId,
      name: trimmedName,
      ownerId: session.user.id,
      createdAt: now,
    });

    // Create the owner as an accepted member
    await db.insert(crossPromotionMembers).values({
      id: memberId,
      groupId,
      userId: session.user.id,
      email: user.email,
      status: "accepted",
      createdAt: now,
      acceptedAt: now,
    });

    return NextResponse.json({
      group: {
        id: groupId,
        name: trimmedName,
        ownerId: session.user.id,
        createdAt: now.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
