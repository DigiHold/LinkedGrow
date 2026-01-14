import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { decryptApiKey } from "@/lib/encryption";
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

    // Get user's AI API key from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has Pro plan for image generation
    const hasImageAccess = ["pro", "business"].includes(user.plan || "free");
    if (!hasImageAccess) {
      return NextResponse.json(
        { error: "Image generation requires Pro plan or higher" },
        { status: 403 }
      );
    }

    // Check if user has Image API key configured
    if (!user.imageApiKey || !user.imageProvider) {
      return NextResponse.json(
        { error: "No Image API key configured. Please add your API key in Settings." },
        { status: 400 }
      );
    }

    // Decrypt the image API key
    const apiKey = decryptApiKey(user.imageApiKey);
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

    // Generate image based on provider
    switch (user.imageProvider) {
      case "gemini-image":
        base64Image = await generateWithGemini3ProImage(apiKey, prompt);
        break;
      case "openai-dalle":
        base64Image = await generateWithOpenAI(apiKey, prompt);
        break;
      default:
        return NextResponse.json(
          { error: `Image generation not supported for provider: ${user.imageProvider}. Please use Gemini 3 Pro Image or DALL-E 3.` },
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

    console.log(`Image optimized: ${optimized.sizeKB}KB, filename: ${filename}, provider: ${user.imageProvider}`);

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

/**
 * Generate image with Gemini 3 Pro Image (gemini-3-pro-image-preview)
 * Uses the new @google/genai SDK - same as Blog agent
 * Cost: ~$0.13 per image, billed to user's Google account
 */
async function generateWithGemini3ProImage(apiKey: string, prompt: string): Promise<string> {
  // Initialize Google GenAI client with user's API key
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: prompt,
      config: {
        responseModalities: ["image", "text"],
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K", // ~1376x768px
        },
      },
    });

    // Extract base64 image from response with error handling
    if (!response.candidates || !response.candidates[0]) {
      console.error("Gemini API Response:", JSON.stringify(response, null, 2));
      throw new Error("No candidates in response - image may have been blocked by safety filters");
    }

    const candidate = response.candidates[0];

    // Check for blocked content
    const finishReason = String(candidate.finishReason || "");
    if (finishReason.includes("SAFETY") || finishReason.includes("BLOCKED")) {
      throw new Error(`Image blocked by safety filter: ${finishReason}. Try a different prompt.`);
    }

    if (!candidate.content || !candidate.content.parts) {
      console.error("Gemini Candidate:", JSON.stringify(candidate, null, 2));
      throw new Error(`No content parts in response. Finish reason: ${candidate.finishReason || "unknown"}`);
    }

    // Find the image part in the response
    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data; // Already base64
      }
    }

    throw new Error("No image data found in Gemini response");
  } catch (error) {
    if (error instanceof Error) {
      // Add more context to common errors
      if (error.message.includes("API key")) {
        throw new Error("Invalid Google API key. Please check your API key in Settings.");
      }
      if (error.message.includes("quota") || error.message.includes("rate")) {
        throw new Error("API quota exceeded. Please check your Google Cloud billing.");
      }
      throw new Error(`Gemini 3 Pro Image failed: ${error.message}`);
    }
    throw new Error("Gemini 3 Pro Image generation failed");
  }
}

/**
 * Generate image with OpenAI DALL-E 3 (returns raw base64)
 * Cost: ~$0.04-0.08 per image depending on resolution
 */
async function generateWithOpenAI(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1792x1024", // 16:9 aspect ratio
      quality: "standard",
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "OpenAI image generation failed");
  }

  const data = await response.json();
  return data.data[0].b64_json;
}
