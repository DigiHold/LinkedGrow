import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userTemplates } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET - List all user templates
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await db
      .select()
      .from(userTemplates)
      .where(eq(userTemplates.userId, session.user.id))
      .orderBy(desc(userTemplates.createdAt));

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Failed to fetch user templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST - Save a new template
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, thumbnail, canvasJson, category } = body;

    if (!name || !canvasJson) {
      return NextResponse.json(
        { error: "Name and canvas data are required" },
        { status: 400 }
      );
    }

    // Check template limit based on plan
    const existingTemplates = await db
      .select()
      .from(userTemplates)
      .where(eq(userTemplates.userId, session.user.id));

    const plan = session.user.plan || 'free';
    const templateLimits: Record<string, number> = {
      free: 3,
      starter: 10,
      pro: 50,
      business: 999, // Essentially unlimited
    };
    const limit = templateLimits[plan] || 3;

    if (existingTemplates.length >= limit) {
      return NextResponse.json(
        { error: `Template limit reached. Upgrade your plan to save more templates. (${existingTemplates.length}/${limit})` },
        { status: 403 }
      );
    }

    const id = nanoid();
    const now = new Date();

    await db.insert(userTemplates).values({
      id,
      userId: session.user.id,
      name,
      description: description || null,
      thumbnail: thumbnail || null,
      canvasJson,
      category: category || 'custom',
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      id,
      name,
      description,
      thumbnail,
      category,
      createdAt: now,
    });
  } catch (error) {
    console.error("Failed to save template:", error);
    return NextResponse.json(
      { error: "Failed to save template" },
      { status: 500 }
    );
  }
}
