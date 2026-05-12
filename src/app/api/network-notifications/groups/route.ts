import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  networkNotificationGroups,
  networkNotificationMembers,
  networkNotificationPosts,
} from "@/lib/db/schema";
import { eq, and, sql, desc, ne } from "drizzle-orm";
import { canAccessFeature } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

// GET /api/network-notifications/groups - List all groups user is a member of
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPlan = (session.user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "networkNotifications")) {
      return NextResponse.json(
        { error: "Network Notifications requires Pro plan or higher" },
        { status: 403 }
      );
    }

    // Find all groups where user is a member with status "accepted"
    const memberships = await db
      .select({
        groupId: networkNotificationMembers.groupId,
      })
      .from(networkNotificationMembers)
      .where(
        and(
          eq(networkNotificationMembers.userId, session.user.id),
          eq(networkNotificationMembers.status, "accepted")
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
          id: networkNotificationGroups.id,
          name: networkNotificationGroups.name,
          ownerId: networkNotificationGroups.ownerId,
          createdAt: networkNotificationGroups.createdAt,
        })
        .from(networkNotificationGroups)
        .where(eq(networkNotificationGroups.id, groupId))
        .limit(1);

      if (group.length === 0) continue;

      const owner = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, group[0].ownerId))
        .limit(1);

      const memberCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(networkNotificationMembers)
        .where(
          and(
            eq(networkNotificationMembers.groupId, groupId),
            eq(networkNotificationMembers.status, "accepted")
          )
        );

      groups.push({
        ...group[0],
        ownerName: owner[0]?.name || owner[0]?.email || "Unknown",
        isOwner: group[0].ownerId === session.user.id,
        memberCount: memberCount[0]?.count || 0,
      });
    }

    const groupIdSet = groups.map((g) => g.id);
    const recentNotifications = groupIdSet.length
      ? await db
          .select({
            id: networkNotificationPosts.id,
            postContent: networkNotificationPosts.postContent,
            publishedByUserId: networkNotificationPosts.publishedByUserId,
            groupId: networkNotificationPosts.groupId,
            linkedinPostId: networkNotificationPosts.linkedinPostId,
            notifiedAt: networkNotificationPosts.notifiedAt,
          })
          .from(networkNotificationPosts)
          .where(
            and(
              ne(networkNotificationPosts.publishedByUserId, session.user.id)
            )
          )
          .orderBy(desc(networkNotificationPosts.notifiedAt))
          .limit(20)
      : [];

    const activity = [];
    for (const notif of recentNotifications) {
      if (!groupIdSet.includes(notif.groupId)) continue;

      const [publisher] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, notif.publishedByUserId))
        .limit(1);

      const groupName = groups.find((g) => g.id === notif.groupId)?.name || "";

      activity.push({
        id: notif.id,
        publisherName: publisher?.name || publisher?.email || "Someone",
        postPreview: notif.postContent?.substring(0, 120) || "",
        linkedinPostId: notif.linkedinPostId,
        notifiedAt: notif.notifiedAt,
        groupName,
      });
    }

    return NextResponse.json({ groups, activity });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

// POST /api/network-notifications/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPlan = (session.user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "networkNotifications")) {
      return NextResponse.json(
        { error: "Network Notifications requires Pro plan or higher" },
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
    await db.insert(networkNotificationGroups).values({
      id: groupId,
      name: trimmedName,
      ownerId: session.user.id,
      createdAt: now,
    });

    // Create the owner as an accepted member
    await db.insert(networkNotificationMembers).values({
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
