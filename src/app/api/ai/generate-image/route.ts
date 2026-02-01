import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { getAISettingsUser } from "@/lib/team-utils";
import sharp from "sharp";
import { GoogleGenAI } from "@google/genai";

// Maximum image size for LinkedIn (5MB)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Extract keywords from post content for filename (max 3 words like Blog agent)
 * Example: "AI productivity tips" -> "ai-productivity-tips"
 */
function extractKeywordsFromContent(postContent: string): string {
  if (!postContent || typeof postContent !== "string") {
    return "professional-insight";
  }

  const keywords = postContent.toLowerCase();

  // Priority keywords mapping to natural filenames (like real camera/phone photos)
  const keywordMap: Record<string, string> = {
    "ai": "ai-innovation-moment",
    "chatgpt": "tech-workspace-scene",
    "automation": "workflow-efficiency",
    "productivity": "productivity-workspace",
    "startup": "startup-office-scene",
    "entrepreneur": "founder-strategy",
    "career": "career-milestone",
    "leadership": "team-leadership",
    "marketing": "marketing-strategy",
    "sales": "sales-meeting",
    "coding": "developer-workspace",
    "design": "creative-studio",
    "remote": "remote-work-setup",
    "networking": "professional-networking",
    "interview": "career-opportunity",
    "promotion": "success-celebration",
    "mindset": "growth-mindset",
    "learning": "continuous-learning",
    "finance": "financial-analysis",
    "investment": "investment-strategy",
    "team": "team-collaboration",
    "meeting": "business-meeting",
    "success": "achievement-moment",
    "growth": "business-growth",
  };

  for (const [keyword, filename] of Object.entries(keywordMap)) {
    if (keywords.includes(keyword)) {
      return filename;
    }
  }

  // Default fallback names that look like real photo filenames
  const fallbacks = [
    "office-workspace",
    "professional-moment",
    "business-insight",
    "career-highlight",
    "workspace-scene",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/**
 * Convert image to optimized WebP using Sharp (works on Vercel)
 * Sharp strips ALL metadata when converting - LinkedIn won't detect AI-generated
 */
async function optimizeImageToWebP(base64Image: string): Promise<{ base64: string; sizeKB: number }> {
  const imageBuffer = Buffer.from(base64Image, "base64");

  // Process with sharp - auto strips metadata
  let webpBuffer = await sharp(imageBuffer)
    .webp({ quality: 85 })
    .toBuffer();

  // Check size - if too large, resize and try again
  if (webpBuffer.length > MAX_IMAGE_SIZE) {
    webpBuffer = await sharp(imageBuffer)
      .resize(1600, 900, { fit: "inside" })
      .webp({ quality: 80 })
      .toBuffer();

    if (webpBuffer.length > MAX_IMAGE_SIZE) {
      webpBuffer = await sharp(imageBuffer)
        .resize(1200, 675, { fit: "inside" })
        .webp({ quality: 75 })
        .toBuffer();

      if (webpBuffer.length > MAX_IMAGE_SIZE) {
        throw new Error("Generated image exceeds 5MB limit. Please try a simpler prompt.");
      }
    }
  }

  return {
    base64: webpBuffer.toString("base64"),
    sizeKB: Number((webpBuffer.length / 1024).toFixed(2)),
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user and AI settings (uses team owner's settings if user is a team member)
    const result = await getAISettingsUser(session.user.id);

    if (!result) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { aiSettingsUser } = result;

    // Check if owner has Pro plan for image generation (team members inherit owner's plan access)
    const hasImageAccess = ["pro", "business"].includes(aiSettingsUser.plan || "free");
    if (!hasImageAccess) {
      return NextResponse.json(
        { error: "Image generation requires Pro plan or higher" },
        { status: 403 }
      );
    }

    const imageProvider = aiSettingsUser.imageProvider || "google";

    // Get per-provider API key based on selected provider (from owner if team member)
    const providerKeyMap: Record<string, string | null> = {
      google: aiSettingsUser.googleImageApiKey,
      openai: aiSettingsUser.openaiImageApiKey,
      replicate: aiSettingsUser.replicateImageApiKey,
    };

    const encryptedApiKey = providerKeyMap[imageProvider];
    if (!encryptedApiKey) {
      return NextResponse.json(
        { error: `No API key configured for ${imageProvider}. Please add your API key in Settings.` },
        { status: 400 }
      );
    }

    // Decrypt the image API key
    const apiKey = decryptApiKey(encryptedApiKey);
    if (!apiKey) {
      return NextResponse.json(
        { error: "Failed to decrypt API key. Please re-add your API key in Settings." },
        { status: 400 }
      );
    }

    const { prompt, postContent } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    let base64Image: string;

    // Get per-provider image settings with defaults (from owner if team member)
    const getProviderSettings = (): ImageSettings => {
      switch (imageProvider) {
        case "google":
          return {
            model: aiSettingsUser.googleImageModel || "gemini-3-pro-image-preview",
            resolution: aiSettingsUser.googleImageResolution || "1K",
            aspectRatio: aiSettingsUser.googleImageAspectRatio || "16:9",
            quality: "high", // Google doesn't use quality setting
            style: "vivid", // Google doesn't use style setting
          };
        case "openai":
          return {
            model: aiSettingsUser.openaiImageModel || "gpt-image-1.5",
            resolution: aiSettingsUser.openaiImageResolution || "1792x1024",
            aspectRatio: "16:9", // OpenAI uses resolution instead of aspect ratio
            quality: aiSettingsUser.openaiImageQuality || "high",
            style: aiSettingsUser.openaiImageStyle || "vivid",
          };
        case "replicate":
          return {
            model: aiSettingsUser.replicateImageModel || "flux-2-pro",
            resolution: aiSettingsUser.replicateImageResolution || "1536x1024",
            aspectRatio: aiSettingsUser.replicateImageAspectRatio || "16:9",
            quality: "high", // Replicate doesn't use quality setting
            style: "vivid", // Replicate doesn't use style setting
          };
        default:
          // Default to Google settings
          return {
            model: aiSettingsUser.googleImageModel || "gemini-3-pro-image-preview",
            resolution: aiSettingsUser.googleImageResolution || "1K",
            aspectRatio: aiSettingsUser.googleImageAspectRatio || "16:9",
            quality: "high",
            style: "vivid",
          };
      }
    };

    const imageSettings = getProviderSettings();

    // Generate image based on provider
    switch (imageProvider) {
      case "google":
        base64Image = await generateWithGoogle(apiKey, prompt, imageSettings);
        break;
      case "openai":
        base64Image = await generateWithOpenAI(apiKey, prompt, imageSettings);
        break;
      case "replicate":
        base64Image = await generateWithReplicate(apiKey, prompt, imageSettings);
        break;
      default:
        return NextResponse.json(
          { error: `Image generation not supported for provider: ${imageProvider}. Please select a provider in Settings.` },
          { status: 400 }
        );
    }

    // Convert to optimized WebP format (strips ALL metadata, smaller file size)
    // Sharp removes EXIF, XMP, IPTC, ICC - LinkedIn won't detect it as AI-generated
    const optimized = await optimizeImageToWebP(base64Image);

    // Generate unique filename based on post content (looks like real photo)
    const keywords = extractKeywordsFromContent(postContent || prompt);
    const timestamp = Date.now().toString(36); // Short unique identifier
    const filename = `${keywords}-${timestamp}.webp`;

    console.log(`Image optimized: ${optimized.sizeKB}KB, filename: ${filename}, provider: ${imageProvider}`);

    return NextResponse.json({
      success: true,
      imageUrl: `data:image/webp;base64,${optimized.base64}`,
      filename,
      mimeType: "image/webp",
      sizeKB: optimized.sizeKB,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate image" },
      { status: 500 }
    );
  }
}

// Image settings type
interface ImageSettings {
  model: string;
  resolution: string;
  aspectRatio: string;
  quality: string;
  style: string;
}

/**
 * Generate image with Google AI (Nano Banana Pro, Nano Banana, Imagen 3)
 * Uses the @google/genai SDK
 * Cost: $0.13 per 1K/2K image, $0.24 per 4K image
 */
async function generateWithGoogle(apiKey: string, prompt: string, settings: ImageSettings): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  // Check if model supports imageSize parameter
  // Only Gemini 3 Pro Image supports imageSize (1K, 2K, 4K)
  // Gemini 2.5 Flash Image and Imagen 3 generate at fixed 1024px resolution
  const supportsImageSize = settings.model.includes("gemini-3");

  try {
    // Build imageConfig based on model capabilities
    const imageConfig: { aspectRatio: string; imageSize?: string } = {
      aspectRatio: settings.aspectRatio || "16:9",
    };

    // Only add imageSize for models that support it
    if (supportsImageSize) {
      imageConfig.imageSize = settings.resolution || "1K";
    }

    const response = await ai.models.generateContent({
      model: settings.model || "gemini-3-pro-image-preview",
      contents: prompt,
      config: {
        responseModalities: ["image", "text"],
        imageConfig,
      },
    });

    // Extract base64 image from response with error handling
    if (!response.candidates || !response.candidates[0]) {
      console.error("Google AI Response:", JSON.stringify(response, null, 2));
      throw new Error("No candidates in response - image may have been blocked by safety filters");
    }

    const candidate = response.candidates[0];

    // Check for blocked content
    const finishReason = String(candidate.finishReason || "");
    if (finishReason.includes("SAFETY") || finishReason.includes("BLOCKED")) {
      throw new Error(`Image blocked by safety filter: ${finishReason}. Try a different prompt.`);
    }

    if (!candidate.content || !candidate.content.parts) {
      console.error("Google AI Candidate:", JSON.stringify(candidate, null, 2));
      throw new Error(`No content parts in response. Finish reason: ${candidate.finishReason || "unknown"}`);
    }

    // Find the image part in the response
    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data; // Already base64
      }
    }

    throw new Error("No image data found in Google AI response");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("Invalid Google API key. Please check your API key in Settings.");
      }
      if (error.message.includes("quota") || error.message.includes("rate")) {
        throw new Error("API quota exceeded. Please check your Google Cloud billing.");
      }
      throw new Error(`Google AI image generation failed: ${error.message}`);
    }
    throw new Error("Google AI image generation failed");
  }
}

/**
 * Generate image with OpenAI (GPT Image 1.5, GPT Image 1, DALL-E 3)
 * GPT Image: quality (high/medium/low), size (1024x1024, 1536x1024, 1024x1536)
 * DALL-E 3: quality (standard/hd), style (vivid/natural), size (1024x1024, 1792x1024, 1024x1792)
 */
async function generateWithOpenAI(apiKey: string, prompt: string, settings: ImageSettings): Promise<string> {
  const isGptImage = settings.model.startsWith("gpt-image");
  const isDallE3 = settings.model === "dall-e-3";
  const model = settings.model || "gpt-image-1.5";

  // Map resolution based on model type
  // GPT Image supports: 1024x1024, 1536x1024, 1024x1536
  // DALL-E 3 supports: 1024x1024, 1792x1024, 1024x1792
  let size: string;
  if (isDallE3) {
    const dalleSizeMap: Record<string, string> = {
      "1024x1024": "1024x1024",
      "1792x1024": "1792x1024",
      "1024x1792": "1024x1792",
      "1536x1024": "1792x1024", // Map to closest DALL-E 3 size
      "1024x1536": "1024x1792", // Map to closest DALL-E 3 size
    };
    size = dalleSizeMap[settings.resolution] || "1792x1024";
  } else {
    const gptImageSizeMap: Record<string, string> = {
      "1024x1024": "1024x1024",
      "1536x1024": "1536x1024",
      "1024x1536": "1024x1536",
      "1792x1024": "1536x1024", // Map to closest GPT Image size
      "1024x1792": "1024x1536", // Map to closest GPT Image size
    };
    size = gptImageSizeMap[settings.resolution] || "1536x1024";
  }

  const requestBody: Record<string, unknown> = {
    model: model,
    prompt: prompt,
    n: 1,
    size: size,
  };

  if (isDallE3) {
    // DALL-E 3 specific parameters
    requestBody.response_format = "b64_json";
    requestBody.quality = settings.quality === "high" ? "hd" : "standard";
    requestBody.style = settings.style || "vivid";
  } else if (isGptImage) {
    // GPT Image specific parameters
    // GPT Image uses "high", "medium", "low" for quality (NOT style parameter)
    requestBody.quality = settings.quality || "high";
    // Note: GPT Image does NOT support style parameter
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "OpenAI image generation failed");
  }

  const data = await response.json();
  // Both GPT Image and DALL-E 3 return b64_json when requested
  return data.data[0].b64_json;
}

/**
 * Generate image with Replicate (FLUX.2 models)
 * FLUX 2 Pro/Flex/Dev use aspect_ratio and resolution (megapixels) parameters
 * Cost: $0.015 + $0.015 per megapixel
 */
async function generateWithReplicate(apiKey: string, prompt: string, settings: ImageSettings): Promise<string> {
  // Map model names to Replicate model versions
  // Note: FLUX Kontext Pro is for image editing, not text-to-image generation
  const modelMap: Record<string, string> = {
    "flux-2-pro": "black-forest-labs/flux-2-pro",
    "flux-2-flex": "black-forest-labs/flux-2-flex",
    "flux-2-dev": "black-forest-labs/flux-2-dev",
  };

  const modelName = modelMap[settings.model] || "black-forest-labs/flux-2-pro";

  // FLUX 2 models use aspect_ratio (e.g., "16:9", "1:1") and resolution in megapixels
  // Map pixel resolution to aspect ratio if not provided
  const resolutionToAspectRatio: Record<string, string> = {
    "1024x1024": "1:1",
    "1536x1024": "3:2",
    "1024x1536": "2:3",
    "2048x2048": "1:1",
  };
  const aspectRatio = settings.aspectRatio || resolutionToAspectRatio[settings.resolution] || "16:9";

  // Map pixel resolution to megapixels for FLUX 2 API
  // FLUX 2 supports: 0.5 MP, 1 MP, 2 MP, 4 MP
  const resolutionToMegapixels: Record<string, string> = {
    "1024x1024": "1 MP",    // ~1 megapixel
    "1536x1024": "2 MP",    // ~1.5 megapixels, round up to 2 MP for better quality
    "1024x1536": "2 MP",    // ~1.5 megapixels, round up to 2 MP for better quality
    "2048x2048": "4 MP",    // ~4 megapixels
  };
  const megapixelResolution = resolutionToMegapixels[settings.resolution] || "1 MP";

  // Create prediction with FLUX 2 parameters
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelName,
      input: {
        prompt: prompt,
        aspect_ratio: aspectRatio,
        resolution: megapixelResolution,
        output_format: "webp",
        output_quality: 90,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Replicate API error");
  }

  const prediction = await response.json();

  // Poll for completion
  let result = prediction;
  while (result.status === "starting" || result.status === "processing") {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    result = await pollResponse.json();
  }

  if (result.status === "failed") {
    throw new Error(result.error || "FLUX.2 generation failed");
  }

  // Get the output URL and fetch the image
  const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
  if (!imageUrl) {
    throw new Error("No image URL in Replicate response");
  }

  // Fetch and convert to base64
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  return Buffer.from(imageBuffer).toString("base64");
}
