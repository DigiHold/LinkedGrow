import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { getAISettingsUser } from "@/lib/team-utils";
import { canAccessFeature, type PlanId } from "@/lib/plans";
import { checkAIRateLimit } from "@/lib/rate-limit";

export const maxDuration = 120;

// System prompt for generating detailed image prompts (like Blog agent's claude-prompt-generator.js)
const SYSTEM_PROMPT = `You are an expert at creating highly detailed image generation prompts for Gemini 3 Pro Image and GPT Image 1.5.

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

    const aiRateLimit = checkAIRateLimit(session.user.id);
    if (!aiRateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    // Get the user whose AI settings should be used (owner for team members)
    const result = await getAISettingsUser(session.user.id);
    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { aiSettingsUser } = result;

    // Check plan access - imageGeneration requires Pro+
    const userPlan = (aiSettingsUser.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "imageGeneration")) {
      return NextResponse.json(
        { error: "Image generation requires a Pro plan or higher. Please upgrade to access this feature." },
        { status: 403 }
      );
    }

    const provider = aiSettingsUser.aiProvider || "openai";

    // Get per-provider API key based on selected provider (from owner for team members)
    const providerKeyMap: Record<string, string | null> = {
      openai: aiSettingsUser.openaiApiKey,
      anthropic: aiSettingsUser.anthropicApiKey,
      google: aiSettingsUser.googleApiKey,
      grok: aiSettingsUser.grokApiKey,
      perplexity: aiSettingsUser.perplexityApiKey,
      kimi: aiSettingsUser.kimiApiKey,
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

    // Get per-provider model (from owner for team members)
    const providerModelMap: Record<string, string | null> = {
      openai: aiSettingsUser.openaiModel,
      anthropic: aiSettingsUser.anthropicModel,
      google: aiSettingsUser.googleModel,
      grok: aiSettingsUser.grokModel,
      perplexity: aiSettingsUser.perplexityModel,
      kimi: aiSettingsUser.kimiModel,
    };

    const defaultModel = provider === "openai" ? "gpt-5.4-mini" :
                         provider === "anthropic" ? "claude-sonnet-5" :
                         provider === "google" ? "gemini-3-flash-preview" :
                         provider === "grok" ? "grok-4.3" :
                         provider === "perplexity" ? "sonar-pro" :
                         provider === "kimi" ? "kimi-k2.6" : "gpt-5.4-mini";
    const model = providerModelMap[provider] || defaultModel;

    let generatedPrompt: string;

    // Generate prompt using user's configured AI provider and model
    switch (provider) {
      case "openai":
        generatedPrompt = await generateWithOpenAI(apiKey, postContent, model);
        break;
      case "anthropic":
        generatedPrompt = await generateWithAnthropic(apiKey, postContent, model);
        break;
      case "google":
        generatedPrompt = await generateWithGoogle(apiKey, postContent, model);
        break;
      case "grok":
        generatedPrompt = await generateWithGrok(apiKey, postContent, model);
        break;
      case "perplexity":
        generatedPrompt = await generateWithPerplexity(apiKey, postContent, model);
        break;
      case "kimi":
        generatedPrompt = await generateWithKimi(apiKey, postContent, model);
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate image prompt" },
      { status: 500 }
    );
  }
}

async function generateWithOpenAI(apiKey: string, postContent: string, model: string): Promise<string> {
  const isOSeries = model.startsWith("o3") || model.startsWith("o4");
  const isGPT5 = model.startsWith("gpt-5");

  // O-series and GPT-5 models don't support temperature parameter
  // GPT-5 models use max_completion_tokens instead of max_tokens
  // GPT-5 models need reasoning_effort set to low to ensure they return content
  const requestBody: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Create a detailed image prompt for this LinkedIn post:\n\n${postContent}` },
    ],
  };
  if (!isOSeries && !isGPT5) {
    requestBody.temperature = 0.7;
    requestBody.max_tokens = 1500;
  }
  // O-series and GPT-5 require max_completion_tokens instead of max_tokens
  if (isOSeries || isGPT5) {
    requestBody.max_completion_tokens = 4000;
  }
  if (isGPT5) {
    // GPT-5 models need reasoning_effort set to low to ensure they return content
    // rather than spending tokens on internal reasoning that doesn't produce output
    requestBody.reasoning_effort = "low";
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || "OpenAI request failed");
  }

  const data = await response.json();

  // Handle different response formats
  if (!data.choices || !data.choices[0]) {
    throw new Error("No choices in OpenAI response");
  }

  const message = data.choices[0].message;
  if (!message || !message.content) {
    throw new Error("No content in OpenAI response message");
  }

  return message.content.trim();
}

async function generateWithAnthropic(apiKey: string, postContent: string, model: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
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

async function generateWithGoogle(apiKey: string, postContent: string, model: string): Promise<string> {
  // Create a strong, explicit prompt that forces the model to follow instructions
  const userPrompt = `You MUST follow these instructions EXACTLY. This is MANDATORY.

INSTRUCTIONS:
${SYSTEM_PROMPT}

NOW CREATE THE IMAGE PROMPT FOR THIS LINKEDIN POST:

${postContent}

REMEMBER: Your response must be 300-450 words, extremely detailed with specific measurements, ages, camera specs, lighting, colors, textures, and composition. Return ONLY the image prompt, nothing else.`;

  // Check if this is a "Pro" model that has thinking enabled by default
  // Pro models (gemini-2.5-pro, gemini-3-pro) need thinking mode with minimal budget
  const isProModel = model.includes("-pro");

  // Build the request body
  // Pro models need higher maxOutputTokens because thinkingBudget is separate from output
  const requestBody: Record<string, unknown> = {
    contents: [
      {
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: isProModel ? 8000 : 2000,
    },
  };

  // For Pro models, set minimal thinking budget to reduce reasoning overhead
  // Pro models require thinking mode, so we use the minimum budget (1024 tokens)
  // This ensures the model focuses more on following instructions rather than extensive reasoning
  if (isProModel) {
    (requestBody.generationConfig as Record<string, unknown>).thinkingConfig = {
      thinkingBudget: 1024,
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || "Google AI request failed");
  }

  const data = await response.json();

  // Handle missing candidates (Gemini 2.5 Pro and other models may have different response structure)
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error("No valid response from Gemini. The model may have blocked the request or returned an empty response.");
  }

  const parts = data.candidates[0].content.parts;
  if (!parts || parts.length === 0) {
    throw new Error("No text content in Gemini response.");
  }

  // For Pro models with thinking enabled, response has thinking parts (thought: true)
  // and actual output parts. Find the first non-thinking text part.
  let responseText = "";
  for (const part of parts) {
    if (part?.text && !part.thought) {
      responseText = part.text;
      break;
    }
  }

  // Fallback: if no non-thinking part found, take the last text part
  if (!responseText) {
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i]?.text) {
        responseText = parts[i].text;
        break;
      }
    }
  }

  if (!responseText) {
    throw new Error("No text content in Gemini response.");
  }

  return responseText.trim();
}

async function generateWithGrok(apiKey: string, postContent: string, model: string): Promise<string> {
  // xAI Grok API - Chat Completions endpoint (still works despite deprecation notice)
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Create a detailed image prompt for this LinkedIn post:\n\n${postContent}` },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const error = JSON.parse(errorText);
      throw new Error(error.error?.message || error.message || `Grok request failed with status ${response.status}`);
    } catch {
      throw new Error(`Grok request failed with status ${response.status}: ${errorText.substring(0, 200)}`);
    }
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("No choices in Grok response");
  }

  return data.choices[0].message.content.trim();
}

async function generateWithPerplexity(apiKey: string, postContent: string, model: string): Promise<string> {
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
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

async function generateWithKimi(apiKey: string, postContent: string, model: string): Promise<string> {
  // Kimi uses OpenAI-compatible API
  const response = await fetch("https://api.moonshot.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Create a detailed image prompt for this LinkedIn post:\n\n${postContent}` },
      ],
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || "Kimi request failed");
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}
