import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { encryptApiKey, decryptApiKey } from "@/lib/encryption";
import { getAISettingsUser } from "@/lib/team-utils";

// GET - Fetch user settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get AI settings user (owner's settings for team members)
    const result = await getAISettingsUser(session.user.id);
    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use owner's settings for AI keys, but user's own settings for other things
    const { user, aiSettingsUser, isTeamMember } = result;

    // Helper to check if a provider has an API key
    const hasProviderKey = (key: string | null | undefined) => !!key;

    // Use owner's AI settings for team members
    const aiUser = aiSettingsUser;

    // Build per-provider settings for text AI (API key status + model)
    const textProviderSettings: Record<string, { hasKey: boolean; model: string | null }> = {
      openai: { hasKey: hasProviderKey(aiUser.openaiApiKey), model: aiUser.openaiModel },
      anthropic: { hasKey: hasProviderKey(aiUser.anthropicApiKey), model: aiUser.anthropicModel },
      google: { hasKey: hasProviderKey(aiUser.googleApiKey), model: aiUser.googleModel },
      grok: { hasKey: hasProviderKey(aiUser.grokApiKey), model: aiUser.grokModel },
      perplexity: { hasKey: hasProviderKey(aiUser.perplexityApiKey), model: aiUser.perplexityModel },
      kimi: { hasKey: hasProviderKey(aiUser.kimiApiKey), model: aiUser.kimiModel },
    };

    // Build per-provider settings for image AI (API key status + all settings)
    const imageProviderSettings: Record<string, {
      hasKey: boolean;
      model: string | null;
      resolution: string | null;
      aspectRatio: string | null;
      quality: string | null;
      style: string | null;
    }> = {
      google: {
        hasKey: hasProviderKey(aiUser.googleImageApiKey),
        model: aiUser.googleImageModel,
        resolution: aiUser.googleImageResolution,
        aspectRatio: aiUser.googleImageAspectRatio,
        quality: null,
        style: null,
      },
      openai: {
        hasKey: hasProviderKey(aiUser.openaiImageApiKey),
        model: aiUser.openaiImageModel,
        resolution: aiUser.openaiImageResolution,
        aspectRatio: null,
        quality: aiUser.openaiImageQuality,
        style: aiUser.openaiImageStyle,
      },
      replicate: {
        hasKey: hasProviderKey(aiUser.replicateImageApiKey),
        model: aiUser.replicateImageModel,
        resolution: aiUser.replicateImageResolution,
        aspectRatio: aiUser.replicateImageAspectRatio,
        quality: null,
        style: null,
      },
    };

    // Parse sample posts from JSON (use owner's for team members)
    let samplePosts: string[] = [];
    if (aiUser.samplePosts) {
      try {
        samplePosts = JSON.parse(aiUser.samplePosts);
      } catch {
        samplePosts = [];
      }
    }

    // Computed fields: check if the active provider has an API key configured (using owner's settings)
    const activeTextProvider = aiUser.aiProvider || "openai";
    const activeImageProvider = aiUser.imageProvider || "google";
    const hasApiKey = textProviderSettings[activeTextProvider]?.hasKey || false;
    const hasImageApiKey = imageProviderSettings[activeImageProvider]?.hasKey || false;

    return NextResponse.json({
      // Currently selected providers (from owner for team members)
      aiProvider: aiUser.aiProvider,
      imageProvider: aiUser.imageProvider,
      // Per-provider settings (API key status + model + settings)
      textProviderSettings,
      imageProviderSettings,
      // Computed fields: whether active provider has a key configured
      hasApiKey,
      hasImageApiKey,
      // Team member flag
      isTeamMember,
      // User plan (from session which handles team member inheritance)
      plan: session.user.plan || 'free',
      // Other settings (use owner's voice/business settings for team members)
      linkedinConnected: !!aiUser.linkedinAccessToken,
      linkedinProfileName: aiUser.linkedinProfileName,
      samplePosts,
      neverMention: aiUser.neverMention,
      businessDescription: aiUser.businessDescription,
      businessName: aiUser.businessName,
      businessNiche: aiUser.businessNiche,
      businessProducts: aiUser.businessProducts,
      businessTopics: aiUser.businessTopics,
      businessContext: aiUser.businessContext,
      targetAudience: aiUser.targetAudience,
      writingTone: aiUser.writingTone,
      // Branding settings
      brandLogoUrl: user.brandLogoUrl,
      brandAvatarUrl: user.image,
      brandHandle: aiUser.linkedinProfileName,
      // Timezone
      timezone: user.timezone,
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
      // Per-provider text AI keys and models
      openaiApiKey,
      openaiModel,
      anthropicApiKey,
      anthropicModel,
      googleApiKey,
      googleModel,
      grokApiKey,
      grokModel,
      perplexityApiKey,
      perplexityModel,
      kimiApiKey,
      kimiModel,
      imageProvider,
      // Per-provider image AI settings
      googleImageApiKey,
      googleImageModel,
      googleImageResolution,
      googleImageAspectRatio,
      openaiImageApiKey,
      openaiImageModel,
      openaiImageResolution,
      openaiImageQuality,
      openaiImageStyle,
      replicateImageApiKey,
      replicateImageModel,
      replicateImageResolution,
      replicateImageAspectRatio,
      samplePosts,
      neverMention,
      businessDescription,
      businessName,
      businessNiche,
      businessProducts,
      businessTopics,
      businessContext,
      targetAudience,
      writingTone,
      timezone,
    } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (aiProvider !== undefined) {
      updateData.aiProvider = aiProvider;
    }

    // Per-provider text AI keys and models
    if (openaiApiKey !== undefined) {
      updateData.openaiApiKey = openaiApiKey ? encryptApiKey(openaiApiKey) : null;
    }
    if (openaiModel !== undefined) {
      updateData.openaiModel = openaiModel || null;
    }
    if (anthropicApiKey !== undefined) {
      updateData.anthropicApiKey = anthropicApiKey ? encryptApiKey(anthropicApiKey) : null;
    }
    if (anthropicModel !== undefined) {
      updateData.anthropicModel = anthropicModel || null;
    }
    if (googleApiKey !== undefined) {
      updateData.googleApiKey = googleApiKey ? encryptApiKey(googleApiKey) : null;
    }
    if (googleModel !== undefined) {
      updateData.googleModel = googleModel || null;
    }
    if (grokApiKey !== undefined) {
      updateData.grokApiKey = grokApiKey ? encryptApiKey(grokApiKey) : null;
    }
    if (grokModel !== undefined) {
      updateData.grokModel = grokModel || null;
    }
    if (perplexityApiKey !== undefined) {
      updateData.perplexityApiKey = perplexityApiKey ? encryptApiKey(perplexityApiKey) : null;
    }
    if (perplexityModel !== undefined) {
      updateData.perplexityModel = perplexityModel || null;
    }
    if (kimiApiKey !== undefined) {
      updateData.kimiApiKey = kimiApiKey ? encryptApiKey(kimiApiKey) : null;
    }
    if (kimiModel !== undefined) {
      updateData.kimiModel = kimiModel || null;
    }

    if (imageProvider !== undefined) {
      updateData.imageProvider = imageProvider;
    }

    // Per-provider Google image settings
    if (googleImageApiKey !== undefined) {
      updateData.googleImageApiKey = googleImageApiKey ? encryptApiKey(googleImageApiKey) : null;
    }
    if (googleImageModel !== undefined) {
      updateData.googleImageModel = googleImageModel || null;
    }
    if (googleImageResolution !== undefined) {
      updateData.googleImageResolution = googleImageResolution || null;
    }
    if (googleImageAspectRatio !== undefined) {
      updateData.googleImageAspectRatio = googleImageAspectRatio || null;
    }
    // Per-provider OpenAI image settings
    if (openaiImageApiKey !== undefined) {
      updateData.openaiImageApiKey = openaiImageApiKey ? encryptApiKey(openaiImageApiKey) : null;
    }
    if (openaiImageModel !== undefined) {
      updateData.openaiImageModel = openaiImageModel || null;
    }
    if (openaiImageResolution !== undefined) {
      updateData.openaiImageResolution = openaiImageResolution || null;
    }
    if (openaiImageQuality !== undefined) {
      updateData.openaiImageQuality = openaiImageQuality || null;
    }
    if (openaiImageStyle !== undefined) {
      updateData.openaiImageStyle = openaiImageStyle || null;
    }

    // Per-provider Replicate image settings
    if (replicateImageApiKey !== undefined) {
      updateData.replicateImageApiKey = replicateImageApiKey ? encryptApiKey(replicateImageApiKey) : null;
    }
    if (replicateImageModel !== undefined) {
      updateData.replicateImageModel = replicateImageModel || null;
    }
    if (replicateImageResolution !== undefined) {
      updateData.replicateImageResolution = replicateImageResolution || null;
    }
    if (replicateImageAspectRatio !== undefined) {
      updateData.replicateImageAspectRatio = replicateImageAspectRatio || null;
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

    if (businessName !== undefined) {
      updateData.businessName = businessName || null;
    }

    if (businessNiche !== undefined) {
      updateData.businessNiche = businessNiche || null;
    }

    if (businessProducts !== undefined) {
      updateData.businessProducts = businessProducts || null;
    }

    if (businessTopics !== undefined) {
      updateData.businessTopics = businessTopics || null;
    }

    if (businessContext !== undefined) {
      updateData.businessContext = businessContext || null;
    }

    if (targetAudience !== undefined) {
      updateData.targetAudience = targetAudience || null;
    }

    if (writingTone !== undefined) {
      updateData.writingTone = writingTone || null;
    }

    if (timezone !== undefined) {
      updateData.timezone = timezone || null;
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
    const provider = searchParams.get("provider");

    // Per-provider text AI key deletion
    const textProviderKeyMap: Record<string, string> = {
      openai: "openaiApiKey",
      anthropic: "anthropicApiKey",
      google: "googleApiKey",
      grok: "grokApiKey",
      perplexity: "perplexityApiKey",
      kimi: "kimiApiKey",
    };

    // Per-provider image AI key deletion
    const imageProviderKeyMap: Record<string, string> = {
      google: "googleImageApiKey",
      openai: "openaiImageApiKey",
      replicate: "replicateImageApiKey",
    };

    // Delete specific text provider key
    if (field === "textApiKey" && provider && textProviderKeyMap[provider]) {
      await db
        .update(users)
        .set({
          [textProviderKeyMap[provider]]: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));

      return NextResponse.json({
        success: true,
        message: `${provider} API key removed successfully`,
      });
    }

    // Delete specific image provider key
    if (field === "imageApiKey" && provider && imageProviderKeyMap[provider]) {
      await db
        .update(users)
        .set({
          [imageProviderKeyMap[provider]]: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));

      return NextResponse.json({
        success: true,
        message: `${provider} image API key removed successfully`,
      });
    }

    return NextResponse.json({ error: "Invalid field or provider" }, { status: 400 });
  } catch (error) {
    console.error("Failed to delete setting:", error);
    return NextResponse.json(
      { error: "Failed to delete setting" },
      { status: 500 }
    );
  }
}
