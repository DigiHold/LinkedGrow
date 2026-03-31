import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userTemplates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  extractR2KeysFromCanvasJson,
  cleanupR2Keys,
  cleanupRemovedR2Keys,
} from "@/lib/storage/canvas-r2-cleanup";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get a specific template
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [template] = await db
      .select()
      .from(userTemplates)
      .where(
        and(
          eq(userTemplates.id, id),
          eq(userTemplates.userId, session.user.id)
        )
      );

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// PUT - Update a template
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, thumbnail, canvasJson, category } = body;

    // Check if template exists and belongs to user
    const [existingTemplate] = await db
      .select()
      .from(userTemplates)
      .where(
        and(
          eq(userTemplates.id, id),
          eq(userTemplates.userId, session.user.id)
        )
      );

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Update template
    await db
      .update(userTemplates)
      .set({
        name: name ?? existingTemplate.name,
        description: description !== undefined ? description : existingTemplate.description,
        thumbnail: thumbnail !== undefined ? thumbnail : existingTemplate.thumbnail,
        canvasJson: canvasJson ?? existingTemplate.canvasJson,
        category: category ?? existingTemplate.category,
        updatedAt: new Date(),
      })
      .where(eq(userTemplates.id, id));

    // Clean up R2 images that were removed from the canvas
    if (canvasJson && existingTemplate.canvasJson) {
      const oldKeys = extractR2KeysFromCanvasJson(existingTemplate.canvasJson);
      const newKeys = extractR2KeysFromCanvasJson(canvasJson);
      cleanupRemovedR2Keys(oldKeys, newKeys);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a template
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch template with canvas data for R2 cleanup
    const [existingTemplate] = await db
      .select()
      .from(userTemplates)
      .where(
        and(
          eq(userTemplates.id, id),
          eq(userTemplates.userId, session.user.id)
        )
      );

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Delete template from DB first
    await db
      .delete(userTemplates)
      .where(eq(userTemplates.id, id));

    // Clean up R2 images from canvas in the background
    if (existingTemplate.canvasJson) {
      const keys = extractR2KeysFromCanvasJson(existingTemplate.canvasJson);
      if (keys.length > 0) {
        cleanupR2Keys(keys);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
