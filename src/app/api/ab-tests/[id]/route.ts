import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { abTests, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { canAccessFeature } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

// GET /api/ab-tests/:id - Get single A/B test
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has access to A/B testing
    const userPlan = (user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "abTesting")) {
      return NextResponse.json(
        { error: "A/B Testing requires Business plan" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const test = await db.query.abTests.findFirst({
      where: and(eq(abTests.id, id), eq(abTests.userId, user.id)),
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Calculate engagement rates
    const variantAImpressions = test.variantAImpressions || 0;
    const variantAReactions = test.variantAReactions || 0;
    const variantAComments = test.variantAComments || 0;
    const variantAShares = test.variantAShares || 0;
    const variantAEngagementRate = variantAImpressions > 0
      ? ((variantAReactions + variantAComments + variantAShares) / variantAImpressions * 100)
      : 0;

    const variantBImpressions = test.variantBImpressions || 0;
    const variantBReactions = test.variantBReactions || 0;
    const variantBComments = test.variantBComments || 0;
    const variantBShares = test.variantBShares || 0;
    const variantBEngagementRate = variantBImpressions > 0
      ? ((variantBReactions + variantBComments + variantBShares) / variantBImpressions * 100)
      : 0;

    return NextResponse.json({
      id: test.id,
      name: test.name,
      status: test.status,
      variantAContent: test.variantAContent,
      variantBContent: test.variantBContent,
      variantAPostId: test.variantAPostId,
      variantBPostId: test.variantBPostId,
      variantAStats: {
        impressions: variantAImpressions,
        reactions: variantAReactions,
        comments: variantAComments,
        shares: variantAShares,
        engagementRate: variantAEngagementRate,
      },
      variantBStats: {
        impressions: variantBImpressions,
        reactions: variantBReactions,
        comments: variantBComments,
        shares: variantBShares,
        engagementRate: variantBEngagementRate,
      },
      winningVariant: test.winningVariant,
      startedAt: test.startedAt?.toISOString(),
      endedAt: test.endedAt?.toISOString(),
      createdAt: test.createdAt?.toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch A/B test:", error);
    return NextResponse.json(
      { error: "Failed to fetch A/B test" },
      { status: 500 }
    );
  }
}

// PATCH /api/ab-tests/:id - Update A/B test
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has access to A/B testing
    const userPlan = (user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "abTesting")) {
      return NextResponse.json(
        { error: "A/B Testing requires Business plan" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Find test
    const test = await db.query.abTests.findFirst({
      where: and(eq(abTests.id, id), eq(abTests.userId, user.id)),
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const body = await request.json();
    const { status, winningVariant, variantAPostId, variantBPostId, variantAStats, variantBStats } = body;

    // Build update object
    const updates: Partial<typeof abTests.$inferInsert> = {};

    if (status !== undefined) {
      const validStatuses = ["draft", "running", "paused", "completed"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }

      updates.status = status;

      // Set timestamps
      if (status === "running" && !test.startedAt) {
        updates.startedAt = new Date();
      }
      if (status === "completed" && !test.endedAt) {
        updates.endedAt = new Date();
      }
    }

    if (winningVariant !== undefined) {
      if (winningVariant !== null && winningVariant !== "a" && winningVariant !== "b") {
        return NextResponse.json(
          { error: "Invalid winning variant. Must be 'a', 'b', or null" },
          { status: 400 }
        );
      }
      updates.winningVariant = winningVariant;
    }

    if (variantAPostId !== undefined) {
      updates.variantAPostId = variantAPostId;
    }

    if (variantBPostId !== undefined) {
      updates.variantBPostId = variantBPostId;
    }

    // Handle variant A stats
    if (variantAStats !== undefined) {
      if (typeof variantAStats.impressions === "number") {
        updates.variantAImpressions = variantAStats.impressions;
      }
      if (typeof variantAStats.reactions === "number") {
        updates.variantAReactions = variantAStats.reactions;
      }
      if (typeof variantAStats.comments === "number") {
        updates.variantAComments = variantAStats.comments;
      }
      if (typeof variantAStats.shares === "number") {
        updates.variantAShares = variantAStats.shares;
      }
    }

    // Handle variant B stats
    if (variantBStats !== undefined) {
      if (typeof variantBStats.impressions === "number") {
        updates.variantBImpressions = variantBStats.impressions;
      }
      if (typeof variantBStats.reactions === "number") {
        updates.variantBReactions = variantBStats.reactions;
      }
      if (typeof variantBStats.comments === "number") {
        updates.variantBComments = variantBStats.comments;
      }
      if (typeof variantBStats.shares === "number") {
        updates.variantBShares = variantBStats.shares;
      }
    }

    // Update test
    if (Object.keys(updates).length > 0) {
      await db.update(abTests).set(updates).where(eq(abTests.id, id));
    }

    // Fetch updated test
    const updatedTest = await db.query.abTests.findFirst({
      where: eq(abTests.id, id),
    });

    return NextResponse.json({
      id: updatedTest!.id,
      status: updatedTest!.status,
      winningVariant: updatedTest!.winningVariant,
      startedAt: updatedTest!.startedAt?.toISOString(),
      endedAt: updatedTest!.endedAt?.toISOString(),
    });
  } catch (error) {
    console.error("Failed to update A/B test:", error);
    return NextResponse.json(
      { error: "Failed to update A/B test" },
      { status: 500 }
    );
  }
}

// DELETE /api/ab-tests/:id - Delete A/B test
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has access to A/B testing
    const userPlan = (user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "abTesting")) {
      return NextResponse.json(
        { error: "A/B Testing requires Business plan" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Find test
    const test = await db.query.abTests.findFirst({
      where: and(eq(abTests.id, id), eq(abTests.userId, user.id)),
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Delete test
    await db.delete(abTests).where(eq(abTests.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete A/B test:", error);
    return NextResponse.json(
      { error: "Failed to delete A/B test" },
      { status: 500 }
    );
  }
}
