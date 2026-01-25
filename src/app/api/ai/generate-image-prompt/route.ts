import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { getAISettingsUser } from "@/lib/team-utils";

// System prompt for generating detailed image prompts (like Blog agent's claude-prompt-generator.js)
const SYSTEM_PROMPT = `You are an expert at creating highly detailed image generation prompts for Gemini 3 Pro Image and DALL-E 3.

Your task: Given a LinkedIn post content, create ONE perfect image prompt that visually represents the post's message.

CRITICAL REQUIREMENTS:

1. **LENGTH**: Your prompt must be 300-450 words, extremely detailed
2. **PHOTOREALISTIC**: Always specify "Professional editorial photograph, photorealistic documentary style, landscape 16:9 format"
3. **SPECIFIC MEASUREMENTS**: Include exact dimensions (8 feet wide, 3x3 inch objects, 2 feet away, etc.)
4. **PRECISE AGES**: Specify exact age ranges (late twenties, early 30s, 25-35 years old)
5. **EXACT PRODUCTS**: Name specific brands/models when relevant (MacBook Pro, iPhone, etc.)
6. **DETAILED CLOTHING**: Describe exact clothing items (chambray shirt, charcoal blazer, etc.)
7. **CAMERA SPECS**: Full technical details (35mm lens at f/2.0, positioned 5 feet away, eye level)
8. **LIGHTING SETUP**: Complete description (window light from left at 45 degrees, warm golden hour, etc.)
9. **SPATIAL RELATIONSHIPS**: Exact positioning (standing 2 feet from wall, desk 4 feet in front)
10. **COLOR SPECIFICS**: Exact colors for each element
11. **TEXTURE DETAILS**: Material descriptions (matte ceramic, brushed aluminum, cotton fabric)
12. **BACKGROUND DETAILS**: Fully describe environment
13. **COMPOSITION RULES**: Technical composition (rule of thirds, leading lines, negative space)
14. **ATMOSPHERE**: Emotional and aesthetic qualities
15. **RESOLUTION**: Always specify 4K quality with sharp focus areas

UNIQUENESS REQUIREMENT:
- The image must be SPECIFIC to THIS post's content
- Someone should be able to guess what the post is about just from the image
- NEVER use generic business/tech scenes
- Create a visual that ONLY makes sense for this specific post topic

STYLE:
- Professional editorial quality (Forbes, Wired, Harvard Business Review aesthetic)
- Authentic workplace/lifestyle documentary feel
- Modern, contemporary, aspirational but realistic

OUTPUT:
Return ONLY the image prompt text, nothing else. No explanations, no "Here's the prompt:", just the prompt itself.`;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user whose AI settings should be used (owner for team members)
    const result = await getAISettingsUser(session.user.id);
    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { aiSettingsUser } = result;
    const provider = aiSettingsUser.aiProvider || "openai";

    // Get per-provider API key based on selected provider (from owner for team members)
    const providerKeyMap: Record<string, string | null> = {
      openai: aiSettingsUser.openaiApiKey,
      anthropic: aiSettingsUser.anthropicApiKey,
      google: aiSettingsUser.googleApiKey,
      grok: aiSettingsUser.grokApiKey,
      perplexity: aiSettingsUser.perplexityApiKey,
    };

    const encryptedApiKey = providerKeyMap[provider];
    if (!encryptedApiKey) {
      return NextResponse.json(
        { error: `No API key configured for ${provider}. Please add your API key in Settings.` },
        { status: 400 }
      );
    }

    const apiKey = decryptApiKey(encryptedApiKey);
    if (!apiKey) {
      return NextResponse.json(
        { error: "Failed to decrypt API key. Please re-add your API key in Settings." },
        { status: 400 }
      );
    }

    const { postContent } = await request.json();

    if (!postContent || typeof postContent !== "string") {
      return NextResponse.json({ error: "Post content is required" }, { status: 400 });
    }

    let generatedPrompt: string;

    // Generate prompt using user's configured AI provider
    switch (provider) {
      case "openai":
        generatedPrompt = await generateWithOpenAI(apiKey, postContent);
        break;
      case "anthropic":
        generatedPrompt = await generateWithAnthropic(apiKey, postContent);
        break;
      case "google":
        generatedPrompt = await generateWithGoogle(apiKey, postContent);
        break;
      case "grok":
        generatedPrompt = await generateWithGrok(apiKey, postContent);
        break;
      case "perplexity":
        generatedPrompt = await generateWithPerplexity(apiKey, postContent);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported AI provider: ${provider}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      prompt: generatedPrompt,
    });
  } catch (error) {
    console.error("Image prompt generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate image prompt" },
      { status: 500 }
    );
  }
}

async function generateWithOpenAI(apiKey: string, postContent: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Create a detailed image prompt for this LinkedIn post:\n\n${postContent}` },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "OpenAI request failed");
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function generateWithAnthropic(apiKey: string, postContent: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: `Create a detailed image prompt for this LinkedIn post:\n\n${postContent}` },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Anthropic request failed");
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

async function generateWithGoogle(apiKey: string, postContent: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${SYSTEM_PROMPT}\n\nCreate a detailed image prompt for this LinkedIn post:\n\n${postContent}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Google AI request failed");
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}

async function generateWithGrok(apiKey: string, postContent: string): Promise<string> {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-3-mini-beta",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Create a detailed image prompt for this LinkedIn post:\n\n${postContent}` },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Grok request failed");
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function generateWithPerplexity(apiKey: string, postContent: string): Promise<string> {
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Create a detailed image prompt for this LinkedIn post:\n\n${postContent}` },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Perplexity request failed");
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}
