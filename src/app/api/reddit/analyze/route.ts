import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { decryptApiKey } from "@/lib/encryption";

// Define trimmed JSON type
interface TrimmedRedditJson {
  post: {
    title: string;
    selftext: string;
    score: number;
    upvote_ratio?: number;
    num_comments: number;
    subreddit: string;
    author?: string;
  };
  comments: Array<{
    body: string;
    score: number;
  }>;
}

// Generate hooks from Reddit post using AI
async function generateHooks(
  trimmedJson: TrimmedRedditJson,
  apiKey: string,
  provider: string,
  model: string
): Promise<string[]> {
  // Get current year for accurate data
  const currentYear = new Date().getFullYear();

  const prompt = `I will give you JSON metadata from Reddit like this:
TITLE: ${trimmedJson.post.title}
JSON: ${JSON.stringify(trimmedJson, null, 2)}

IMPORTANT: Current year is ${currentYear}. Never reference outdated tools, models, statistics, or data. If mentioning AI, use only current models (GPT-5, Claude Opus 4.5, Gemini 3). Don't guess version numbers.

You'll extract the pain points from both the post and top comments, make 5 viral hooks (2 lines in one hook) on the same.

The viral hooks should be on the same format, style and tone as these 3 hooks that got results:

Hook 1:
"3 seconds.
That's all it takes to lose half your visitors."

Hook 2:
"Stop collecting compliments.
Your testimonials are useless. And I can prove it."

Hook 3:
"It's ${currentYear}. STOP using page builders!
I've seen 500,000+ sites. The pattern is always the same."

Requirements:
- Each hook is EXACTLY 2 lines
- Line 1: Short, punchy, stops the scroll (max 8 words)
- Line 2: Builds curiosity, makes them click "see more" (max 15 words)
- NO emojis
- NEVER use em dashes or en dashes. Use regular dashes with spaces " - " instead
- Be specific to the Reddit content pain points
- Sound human, raw, authentic
- Controversial or contrarian angles work best

Return ONLY a JSON array of 5 strings (each string has 2 lines separated by \\n):
["Line1\\nLine2", "Line1\\nLine2", "Line1\\nLine2", "Line1\\nLine2", "Line1\\nLine2"]`;

  let response;
  let hooks: string[] = [];

  if (provider === "openai") {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "gpt-5-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate hooks with OpenAI");
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
        model: model || "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate hooks with Anthropic");
    }

    const data = await response.json();
    const content = data.content[0]?.text || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    hooks = JSON.parse(cleanContent);
  } else if (provider === "google") {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-2.0-flash"}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate hooks with Google AI");
    }

    const data = await response.json();
    const content = data.candidates[0]?.content?.parts[0]?.text || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    hooks = JSON.parse(cleanContent);
  } else if (provider === "grok") {
    response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "grok-3-mini-beta",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate hooks with Grok");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    hooks = JSON.parse(cleanContent);
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
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate hooks with Perplexity");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    hooks = JSON.parse(cleanContent);
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  return hooks;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Accept trimmed Reddit JSON data
    const { trimmedJson } = await request.json();

    if (!trimmedJson || !trimmedJson.post) {
      return NextResponse.json({ error: "No Reddit data provided" }, { status: 400 });
    }

    // Get user's AI settings
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const provider = user.aiProvider || "openai";

    // Get per-provider API key
    const providerKeyMap: Record<string, string | null> = {
      openai: user.openaiApiKey,
      anthropic: user.anthropicApiKey,
      google: user.googleApiKey,
      grok: user.grokApiKey,
      perplexity: user.perplexityApiKey,
    };

    const encryptedApiKey = providerKeyMap[provider];
    if (!encryptedApiKey) {
      return NextResponse.json({ error: `No API key configured for ${provider}. Please add your API key in Settings.` }, { status: 400 });
    }

    // Decrypt the API key
    const apiKey = decryptApiKey(encryptedApiKey);
    if (!apiKey) {
      return NextResponse.json({ error: "Failed to decrypt API key" }, { status: 500 });
    }

    // Get per-provider model
    const providerModelMap: Record<string, string | null> = {
      openai: user.openaiModel,
      anthropic: user.anthropicModel,
      google: user.googleModel,
      grok: user.grokModel,
      perplexity: user.perplexityModel,
    };

    const defaultModel = provider === "openai" ? "gpt-5-mini" :
                         provider === "anthropic" ? "claude-sonnet-4-5-20250929" :
                         provider === "google" ? "gemini-3-flash-preview" :
                         provider === "grok" ? "grok-3-mini-beta" :
                         provider === "perplexity" ? "sonar-pro" : "gpt-5-mini";
    const model = providerModelMap[provider] || defaultModel;

    const hooks = await generateHooks(
      trimmedJson,
      apiKey,
      provider,
      model
    );

    return NextResponse.json({ hooks });
  } catch (error) {
    console.error("Reddit analyze error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze Reddit post" },
      { status: 500 }
    );
  }
}
