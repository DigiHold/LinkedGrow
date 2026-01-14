import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { encryptApiKey, decryptApiKey } from "@/lib/encryption";

// GET - Fetch user settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Decrypt API key for display (masked)
    const decryptedApiKey = decryptApiKey(user.aiApiKey);
    const maskedApiKey = decryptedApiKey
      ? `${decryptedApiKey.slice(0, 8)}${"*".repeat(20)}${decryptedApiKey.slice(-4)}`
      : null;

    // Decrypt image API key for display (masked)
    const decryptedImageApiKey = decryptApiKey(user.imageApiKey);
    const maskedImageApiKey = decryptedImageApiKey
      ? `${decryptedImageApiKey.slice(0, 8)}${"*".repeat(20)}${decryptedImageApiKey.slice(-4)}`
      : null;

    return NextResponse.json({
      aiProvider: user.aiProvider,
      aiApiKey: maskedApiKey, // Return masked key only
      hasApiKey: !!user.aiApiKey, // Boolean to indicate if key exists
      imageProvider: user.imageProvider,
      imageApiKey: maskedImageApiKey, // Return masked key only
      hasImageApiKey: !!user.imageApiKey, // Boolean to indicate if image key exists
      linkedinConnected: !!user.linkedinAccessToken,
      linkedinProfileName: user.linkedinProfileName,
    });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { aiProvider, aiApiKey, imageProvider, imageApiKey } = body;

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Update AI provider if provided
    if (aiProvider !== undefined) {
      updateData.aiProvider = aiProvider;
    }

    // Update AI API key if provided (encrypt it)
    if (aiApiKey !== undefined) {
      // If empty string or null, remove the key
      if (!aiApiKey) {
        updateData.aiApiKey = null;
      } else {
        // Encrypt the new API key
        updateData.aiApiKey = encryptApiKey(aiApiKey);
      }
    }

    // Update image provider if provided
    if (imageProvider !== undefined) {
      updateData.imageProvider = imageProvider;
    }

    // Update image API key if provided (encrypt it)
    if (imageApiKey !== undefined) {
      // If empty string or null, remove the key
      if (!imageApiKey) {
        updateData.imageApiKey = null;
      } else {
        // Encrypt the new image API key
        updateData.imageApiKey = encryptApiKey(imageApiKey);
      }
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

// DELETE - Remove API key
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const field = searchParams.get("field");

    if (field === "aiApiKey") {
      await db
        .update(users)
        .set({
          aiApiKey: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));

      return NextResponse.json({
        success: true,
        message: "API key removed successfully",
      });
    }

    if (field === "imageApiKey") {
      await db
        .update(users)
        .set({
          imageApiKey: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));

      return NextResponse.json({
        success: true,
        message: "Image API key removed successfully",
      });
    }

    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  } catch (error) {
    console.error("Failed to delete setting:", error);
    return NextResponse.json(
      { error: "Failed to delete setting" },
      { status: 500 }
    );
  }
}
