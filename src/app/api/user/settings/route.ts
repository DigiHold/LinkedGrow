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

    // Parse sample posts from JSON
    let samplePosts: string[] = [];
    if (user.samplePosts) {
      try {
        samplePosts = JSON.parse(user.samplePosts);
      } catch {
        samplePosts = [];
      }
    }

    return NextResponse.json({
      aiProvider: user.aiProvider,
      aiModel: user.aiModel,
      aiApiKey: maskedApiKey,
      hasApiKey: !!user.aiApiKey,
      imageProvider: user.imageProvider,
      imageApiKey: maskedImageApiKey,
      hasImageApiKey: !!user.imageApiKey,
      linkedinConnected: !!user.linkedinAccessToken,
      linkedinProfileName: user.linkedinProfileName,
      samplePosts,
      neverMention: user.neverMention,
      businessDescription: user.businessDescription,
      targetAudience: user.targetAudience,
      writingTone: user.writingTone,
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
    const {
      aiProvider,
      aiApiKey,
      aiModel,
      imageProvider,
      imageApiKey,
      samplePosts,
      neverMention,
      businessDescription,
      targetAudience,
      writingTone,
    } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (aiProvider !== undefined) {
      updateData.aiProvider = aiProvider;
    }

    if (aiModel !== undefined) {
      updateData.aiModel = aiModel || null;
    }

    if (aiApiKey !== undefined) {
      if (!aiApiKey) {
        updateData.aiApiKey = null;
      } else {
        updateData.aiApiKey = encryptApiKey(aiApiKey);
      }
    }

    if (imageProvider !== undefined) {
      updateData.imageProvider = imageProvider;
    }

    if (imageApiKey !== undefined) {
      if (!imageApiKey) {
        updateData.imageApiKey = null;
      } else {
        updateData.imageApiKey = encryptApiKey(imageApiKey);
      }
    }

    if (samplePosts !== undefined) {
      updateData.samplePosts = Array.isArray(samplePosts) ? JSON.stringify(samplePosts) : null;
    }

    if (neverMention !== undefined) {
      updateData.neverMention = neverMention || null;
    }

    if (businessDescription !== undefined) {
      updateData.businessDescription = businessDescription || null;
    }

    if (targetAudience !== undefined) {
      updateData.targetAudience = targetAudience || null;
    }

    if (writingTone !== undefined) {
      updateData.writingTone = writingTone || null;
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
