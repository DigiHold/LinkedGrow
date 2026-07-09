import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { getAISettingsUser } from "@/lib/team-utils";
import { checkAIRateLimit } from "@/lib/rate-limit";
import { buildLanguageInstruction } from "@/lib/content-languages";
import { canAccessFeature, type PlanId } from "@/lib/plans";

export const maxDuration = 120;

interface Idea {
  hook: string;
  type: string;
  category: string;
  engagement: string;
}

async function generateIdeas(
  theme: string,
  count: number,
  apiKey: string,
  provider: string,
  model: string,
  businessDescription?: string,
  targetAudience?: string,
  writingTone?: string,
  contentLanguage?: string
): Promise<Idea[]> {
  let contextInstructions = "";
  if (businessDescription) {
    contextInstructions += `\n\nAbout the author: ${businessDescription}`;
  }
  if (targetAudience) {
    contextInstructions += `\nTarget audience: ${targetAudience}`;
  }
  if (writingTone) {
    contextInstructions += `\nWriting tone: ${writingTone}`;
  }

  // Get current year for accurate data
  const currentYear = new Date().getFullYear();

  const prompt = `Generate ${count} unique LinkedIn post ideas on the theme: "${theme}"${contextInstructions}

IMPORTANT: Current year is ${currentYear}. Never reference outdated tools, models, or data. If mentioning AI models, use YOUR OWN current knowledge to cite accurate latest model names - never use old names like GPT-4, Claude 3, etc.

For each idea, provide:
1. hook: A 2-line viral hook (line 1 stops the scroll, line 2 builds curiosity). Separate lines with \\n
2. type: Post type (Story, Listicle, Opinion, How-to, Question, Insight, Case Study, Myth Buster)
3. category: Content category (Career, Leadership, Productivity, Tech, Marketing, etc.)
4. engagement: Expected engagement (Very High, High, Medium)

CRITICAL RULES:
- NEVER use em dashes or en dashes. Use regular dashes with spaces " - " instead
- NEVER sound like AI. No "game-changer", "elevate", "unlock", "landscape", "leverage", "delve", "tapestry"
- Write like a real human sharing raw, honest experiences
- Line 1 of hook: max 8 words, punchy, stops the scroll
- Line 2 of hook: max 15 words, builds curiosity

Example hooks that work:
"3 seconds.\\nThat's all it takes to lose half your visitors."
"Stop collecting compliments.\\nYour testimonials are useless. And I can prove it."
"I mass-applied to 200 jobs.\\nHere's what actually got me interviews - it wasn't my resume."

Return ONLY a JSON array:
[
  {
    "hook": "Line 1\\nLine 2",
    "type": "Story",
    "category": "Career",
    "engagement": "Very High"
  }
]${buildLanguageInstruction(contentLanguage)}`;

  let response;
  let ideas: Idea[] = [];

  if (provider === "openai") {
    const openaiModel = model || "gpt-5.4-mini";
    const isOSeries = openaiModel.startsWith("o3") || openaiModel.startsWith("o4");
    const isGPT5 = openaiModel.startsWith("gpt-5");

    // O-series and GPT-5 models don't support temperature parameter
    // GPT-5 models use max_completion_tokens instead of max_tokens
    // GPT-5 models need reasoning_effort set to low to ensure they return content
    const requestBody: Record<string, unknown> = {
      model: openaiModel,
      messages: [{ role: "user", content: prompt }],
    };
    if (!isOSeries && !isGPT5) {
      requestBody.temperature = 0.9;
    }
    // O-series and GPT-5 require max_completion_tokens
    if (isOSeries || isGPT5) {
      requestBody.max_completion_tokens = 8000;
    }
    if (isGPT5) {
      requestBody.reasoning_effort = "low";
    }

    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate ideas with OpenAI");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    ideas = JSON.parse(cleanContent);
  } else if (provider === "anthropic") {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-5",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate ideas with Anthropic");
    }

    const data = await response.json();
    const content = data.content[0]?.text || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    ideas = JSON.parse(cleanContent);
  } else if (provider === "google") {
    const googleModel = model || "gemini-3-flash-preview";
    const isProModel = googleModel.includes("-pro");

    // Build request body - Pro models need higher maxOutputTokens
    const requestBody: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: isProModel ? 16000 : 4000,
      },
    };

    // For Pro models, set minimal thinking budget to reduce reasoning overhead
    // Pro models require thinking mode, so we use the minimum budget (1024 tokens)
    if (isProModel) {
      (requestBody.generationConfig as Record<string, unknown>).thinkingConfig = {
        thinkingBudget: 1024,
      };
    }

    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate ideas with Google AI");
    }

    const data = await response.json();
    // For Pro models with thinking enabled, find the last text part (thinking parts come first)
    const parts = data.candidates?.[0]?.content?.parts || [];
    let content = "[]";
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i]?.text) {
        content = parts[i].text;
        break;
      }
    }
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    ideas = JSON.parse(cleanContent);
  } else if (provider === "grok") {
    response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "grok-4.3",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate ideas with Grok");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    ideas = JSON.parse(cleanContent);
  } else if (provider === "perplexity") {
    response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "sonar-pro",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate ideas with Perplexity");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    ideas = JSON.parse(cleanContent);
  } else if (provider === "kimi") {
    // Kimi uses OpenAI-compatible API
    response = await fetch("https://api.moonshot.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "kimi-k2.6",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || "Failed to generate ideas with Kimi");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    ideas = JSON.parse(cleanContent);
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  // Sanitize em dashes from all hook texts
  return ideas.map(idea => ({
    ...idea,
    hook: idea.hook.replace(/—/g, " - ").replace(/–/g, " - ")
  }));
}

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

    // Standalone Ideas feature is gated to Starter+ plans.
    const userPlan = (session.user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "ideas")) {
      return NextResponse.json(
        { error: "The Ideas generator is available on Starter and higher plans. Upgrade to unlock it.", upgradeRequired: true },
        { status: 403 }
      );
    }

    const { theme, count = 10 } = await request.json();

    if (!theme) {
      return NextResponse.json({ error: "Theme is required" }, { status: 400 });
    }

    // Get user's AI settings (uses owner's settings for team members)
    const result = await getAISettingsUser(session.user.id);
    if (!result) {
      return NextResponse.json({ error: "User not found or team membership invalid" }, { status: 404 });
    }

    const { aiSettingsUser } = result;

    const provider = aiSettingsUser.aiProvider || "openai";

    // Get per-provider API key (from owner for team members)
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
      return NextResponse.json({ error: `No API key configured for ${provider}. Please add your API key in Settings.` }, { status: 400 });
    }

    const apiKey = decryptApiKey(encryptedApiKey);
    if (!apiKey) {
      return NextResponse.json({ error: "Failed to decrypt API key" }, { status: 500 });
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

    // Generate ideas using AI with voice settings (from owner for team members)
    const ideas = await generateIdeas(
      theme,
      Math.min(count, 20),
      apiKey,
      provider,
      model,
      aiSettingsUser.businessDescription || undefined,
      aiSettingsUser.targetAudience || undefined,
      aiSettingsUser.writingTone || undefined,
      aiSettingsUser.contentLanguage || undefined
    );

    return NextResponse.json({ ideas });
  } catch (error) {
return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate ideas" },
      { status: 500 }
    );
  }
}
