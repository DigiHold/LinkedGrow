import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { savedCarousels, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { canAccessFeature, type PlanId } from "@/lib/plans";

// GET - List user's saved carousels
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const carousels = await db
      .select({
        id: savedCarousels.id,
        name: savedCarousels.name,
        description: savedCarousels.description,
        thumbnail: savedCarousels.thumbnail,
        slideCount: savedCarousels.slideCount,
        createdAt: savedCarousels.createdAt,
        updatedAt: savedCarousels.updatedAt,
      })
      .from(savedCarousels)
      .where(eq(savedCarousels.userId, session.user.id))
      .orderBy(desc(savedCarousels.updatedAt));

    return NextResponse.json({ carousels });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to fetch carousels" },
      { status: 500 }
    );
  }
}

// POST - Create a new saved carousel
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check plan access - carouselGenerator requires Business
    const [user] = await db.select({ plan: users.plan }).from(users).where(eq(users.id, session.user.id));
    const userPlan = (user?.plan || "free") as PlanId;

    const body = await request.json();
    const { name, description, thumbnail, slidesJson, slideCount } = body;

    if (!name || !slidesJson) {
      return NextResponse.json(
        { error: "Name and slides data are required" },
        { status: 400 }
      );
    }

    const id = nanoid();
    const now = new Date();

    await db.insert(savedCarousels).values({
      id,
      userId: session.user.id,
      name,
      description: description || null,
      thumbnail: thumbnail || null,
      slidesJson: typeof slidesJson === "string" ? slidesJson : JSON.stringify(slidesJson),
      slideCount: slideCount || 1,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      id,
      message: "Carousel saved successfully",
    });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to save carousel" },
      { status: 500 }
    );
  }
}
