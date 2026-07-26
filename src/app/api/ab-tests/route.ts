import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { abTests, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { canAccessFeature, effectivePlan } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { nanoid } from "nanoid";

// GET /api/ab-tests - List all A/B tests for user
export async function GET() {
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
    const userPlan = effectivePlan(user);
    if (!canAccessFeature(userPlan, "abTesting")) {
      return NextResponse.json(
        { error: "A/B Testing requires Business plan" },
        { status: 403 }
      );
    }

    const tests = await db.query.abTests.findMany({
      where: eq(abTests.userId, user.id),
      orderBy: desc(abTests.createdAt),
    });

    return NextResponse.json({
      tests: tests.map((test) => ({
        id: test.id,
        name: test.name,
        status: test.status,
        variantAContent: test.variantAContent,
        variantBContent: test.variantBContent,
        variantAPostId: test.variantAPostId,
        variantBPostId: test.variantBPostId,
        winningVariant: test.winningVariant,
        startedAt: test.startedAt?.toISOString(),
        endedAt: test.endedAt?.toISOString(),
        createdAt: test.createdAt?.toISOString(),
      })),
    });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to fetch A/B tests" },
      { status: 500 }
    );
  }
}

// POST /api/ab-tests - Create new A/B test
export async function POST(request: NextRequest) {
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
    const userPlan = effectivePlan(user);
    if (!canAccessFeature(userPlan, "abTesting")) {
      return NextResponse.json(
        { error: "A/B Testing requires Business plan" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, variantAContent, variantBContent } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Test name is required" },
        { status: 400 }
      );
    }

    if (!variantAContent || typeof variantAContent !== "string" || variantAContent.trim().length === 0) {
      return NextResponse.json(
        { error: "Variant A content is required" },
        { status: 400 }
      );
    }

    if (!variantBContent || typeof variantBContent !== "string" || variantBContent.trim().length === 0) {
      return NextResponse.json(
        { error: "Variant B content is required" },
        { status: 400 }
      );
    }

    if (variantAContent.length > 3000 || variantBContent.length > 3000) {
      return NextResponse.json(
        { error: "Content must be 3000 characters or less" },
        { status: 400 }
      );
    }

    // Create test
    const testId = nanoid();
    await db.insert(abTests).values({
      id: testId,
      userId: user.id,
      name: name.trim(),
      variantAContent: variantAContent.trim(),
      variantBContent: variantBContent.trim(),
      status: "draft",
      createdAt: new Date(),
    });

    return NextResponse.json({
      id: testId,
      message: "A/B test created successfully",
    });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to create A/B test" },
      { status: 500 }
    );
  }
}
