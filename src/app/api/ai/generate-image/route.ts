import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import sharp from "sharp";

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

    // Check if user has AI API key configured
    if (!user.aiApiKey || !user.aiProvider) {
      return NextResponse.json(
        { error: "No AI API key configured. Please add your API key in Settings." },
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
    switch (user.aiProvider) {
      case "openai":
        base64Image = await generateWithOpenAI(user.aiApiKey, prompt);
        break;
      case "google":
        base64Image = await generateWithGoogle(user.aiApiKey, prompt);
        break;
      default:
        return NextResponse.json(
          { error: `Image generation not supported for provider: ${user.aiProvider}. Please use OpenAI or Google.` },
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

    console.log(`Image optimized: ${optimized.sizeKB}KB, filename: ${filename}`);

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

// Generate image with OpenAI DALL-E (returns raw base64)
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

// Generate image with Google Imagen (returns raw base64)
async function generateWithGoogle(apiKey: string, prompt: string): Promise<string> {
  // Using Google's Imagen 3 via Generative AI API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        sampleCount: 1,
        aspectRatio: "16:9",
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Google image generation failed");
  }

  const data = await response.json();
  const base64 = data.images?.[0]?.bytesBase64Encoded;

  if (!base64) {
    throw new Error("No image generated");
  }

  return base64;
}
