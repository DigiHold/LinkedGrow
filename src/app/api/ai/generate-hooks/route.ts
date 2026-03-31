import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { getAISettingsUser } from "@/lib/team-utils";
import { canAccessFeature, type PlanId } from "@/lib/plans";
import { checkAIRateLimit } from "@/lib/rate-limit";

export const maxDuration = 120;

interface HookPair {
  firstLine: string;
  secondLine: string;
}

// Sanitize AI output: remove em dashes and clean up formatting
function sanitizeHookOutput(text: string): string {
  let cleaned = text.trim();

  // Replace em dashes with regular dashes
  cleaned = cleaned.replace(/—/g, " - ");
  cleaned = cleaned.replace(/–/g, " - ");

  // Remove wrapping quotes if present
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  return cleaned;
}

async function generateHooks(
  postIdea: string,
  count: number,
  apiKey: string,
  provider: string,
  model: string,
  samplePosts?: string[],
  businessDescription?: string,
  targetAudience?: string,
  writingTone?: string,
  neverMention?: string
): Promise<HookPair[]> {
  // Build voice instructions from sample posts
  let voiceInstructions = "";
  if (samplePosts && samplePosts.length > 0) {
    voiceInstructions = `

=== SAMPLE POSTS TO MATCH VOICE ===
Match the tone, energy, and personality of these posts. The hooks must feel like they come from the same person.
${samplePosts.map((p, i) => `
--- Sample ${i + 1} ---
${p.substring(0, 500)}`).join("\n")}
=== END SAMPLES ===`;
  }

  // Build business context
  let businessContext = "";
  if (businessDescription || targetAudience || writingTone) {
    businessContext = `

=== AUTHOR PROFILE ===`;
    if (businessDescription) {
      businessContext += `
What I do: ${businessDescription}`;
    }
    if (targetAudience) {
      businessContext += `
Target audience: ${targetAudience}`;
    }
    if (writingTone) {
      businessContext += `
Writing tone: ${writingTone}`;
    }
    businessContext += `
=== END PROFILE ===`;
  }

  // Build avoid instructions
  let avoidInstructions = "";
  if (neverMention) {
    avoidInstructions = `

NEVER MENTION OR REFERENCE: ${neverMention}`;
  }

  const prompt = `You are a viral LinkedIn ghostwriter who creates hooks that stop the scroll.

Generate ${count} hook pairs for this post topic: "${postIdea}"${businessContext}${voiceInstructions}${avoidInstructions}

=== WHAT MAKES A GREAT HOOK ===

Each hook pair has TWO lines that work together:
- Line 1: The pattern interrupt that makes someone stop scrolling
- Line 2: The curiosity amplifier that makes them click "see more"

The two lines should flow naturally together with NO empty line between them.

=== CRITICAL RULES ===

1. NEVER use em dashes or en dashes. Use commas, colons, or " - " with spaces instead.
2. NEVER use AI-sounding phrases:
   - "Here's the truth" / "Here's why" / "Here's what happened"
   - "Let me explain" / "Let me tell you"
   - "The reality is" / "The fact is" / "The thing is"
   - "Most people don't realize" / "What most people miss"
   - "Game-changer" / "Mind-blowing" / "Revolutionary"
3. Write like a real person having a conversation, not a marketer
4. Line 1 must be under 80 characters (mobile visibility)
5. Be specific - use real numbers, timeframes, outcomes
6. Create genuine curiosity, not clickbait

=== HOOK FORMULAS THAT WORK ===

Personal story: "I got fired 3 months ago. It was the best thing that happened to me."
Contrarian take: "Networking events are useless. Cold DMs work 10x better."
Vulnerable admission: "I wasted 5 years chasing the wrong goal."
Surprising outcome: "I said no to a promotion. My income doubled."
Direct challenge: "Your morning routine is killing your productivity."
Specific result: "One email got me 47 client calls in 30 days."

=== BAD VS GOOD EXAMPLES ===

BAD: "Here's the truth about success—it's not what you think."
GOOD: "Success isn't about working harder. I learned this the hard way."

BAD: "Most people don't realize that networking is overrated."
GOOD: "I stopped networking 2 years ago. My business grew 3x."

BAD: "Let me tell you why your strategy isn't working."
GOOD: "Your strategy worked in 2020. The market changed."

Return ONLY a valid JSON array with ${count} objects. Each object has "firstLine" and "secondLine" strings.

Example format:
[{"firstLine": "I rejected a $300k job offer.", "secondLine": "My wife thought I was crazy. She was right to worry."}]`;

  let response;
  let hooks: HookPair[] = [];

  if (provider === "openai") {
    const openaiModel = model || "o4-mini";
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
      requestBody.max_completion_tokens = 4000;
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
      throw new Error(error.error?.message || "Failed to generate hooks with OpenAI");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    hooks = JSON.parse(cleanContent);
  } else if (provider === "anthropic") {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate hooks with Anthropic");
    }

    const data = await response.json();
    const content = data.content[0]?.text || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    hooks = JSON.parse(cleanContent);
  } else if (provider === "google") {
    const googleModel = model || "gemini-3-flash-preview";
    const isProModel = googleModel.includes("-pro");

    // Build request body - Pro models need higher maxOutputTokens
    const requestBody: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: isProModel ? 8000 : 2000,
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
      throw new Error(error.error?.message || "Failed to generate hooks with Google AI");
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
    hooks = JSON.parse(cleanContent);
  } else if (provider === "grok") {
    // xAI Grok uses OpenAI-compatible API
    response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "grok-4-1-fast-reasoning",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate hooks with Grok");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    hooks = JSON.parse(cleanContent);
  } else if (provider === "perplexity") {
    // Perplexity uses OpenAI-compatible API
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
      throw new Error(error.error?.message || "Failed to generate hooks with Perplexity");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    hooks = JSON.parse(cleanContent);
  } else if (provider === "kimi") {
    // Kimi uses OpenAI-compatible API
    response = await fetch("https://api.moonshot.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "kimi-k2",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate hooks with Kimi");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    hooks = JSON.parse(cleanContent);
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  // Sanitize each hook to remove em dashes
  return hooks.map(hook => ({
    firstLine: sanitizeHookOutput(hook.firstLine),
    secondLine: sanitizeHookOutput(hook.secondLine),
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

    const { postIdea, count = 6 } = await request.json();

    if (!postIdea) {
      return NextResponse.json({ error: "Post idea is required" }, { status: 400 });
    }

    // Get user and AI settings (uses team owner's settings if user is a team member)
    const result = await getAISettingsUser(session.user.id);

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { user, aiSettingsUser } = result;

    // Check plan access - hooksGenerator requires Pro+
    const userPlan = (aiSettingsUser.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "hooksGenerator")) {
      return NextResponse.json(
        { error: "Hooks Generator requires a Pro plan or higher. Please upgrade to access this feature." },
        { status: 403 }
      );
    }

    const provider = aiSettingsUser.aiProvider || "openai";

    // Get per-provider API key based on selected provider (from owner if team member)
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

    // Get per-provider model based on selected provider (from owner if team member)
    const providerModelMap: Record<string, string | null> = {
      openai: aiSettingsUser.openaiModel,
      anthropic: aiSettingsUser.anthropicModel,
      google: aiSettingsUser.googleModel,
      grok: aiSettingsUser.grokModel,
      perplexity: aiSettingsUser.perplexityModel,
      kimi: aiSettingsUser.kimiModel,
    };

    const defaultModel = provider === "openai" ? "o4-mini" :
                         provider === "anthropic" ? "claude-sonnet-4-6" :
                         provider === "google" ? "gemini-3-flash-preview" :
                         provider === "grok" ? "grok-4-1-fast-reasoning" :
                         provider === "perplexity" ? "sonar-pro" :
                         provider === "kimi" ? "kimi-k2" : "o4-mini";
    const model = providerModelMap[provider] || defaultModel;

    // Parse sample posts if available (use user's own voice settings)
    let samplePosts: string[] | undefined;
    if (user.samplePosts) {
      try {
        samplePosts = JSON.parse(user.samplePosts);
      } catch {
        samplePosts = undefined;
      }
    }

    const hooks = await generateHooks(
      postIdea,
      Math.min(count, 12),
      apiKey,
      provider,
      model,
      samplePosts,
      user.businessDescription || undefined,
      user.targetAudience || undefined,
      user.writingTone || undefined,
      user.neverMention || undefined
    );

    return NextResponse.json({ hooks });
  } catch (error) {
return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate hooks" },
      { status: 500 }
    );
  }
}
