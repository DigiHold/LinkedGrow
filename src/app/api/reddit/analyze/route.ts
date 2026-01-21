import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { decryptApiKey } from "@/lib/encryption";

// Generate hooks using AI
async function generateHooks(
  postTitle: string,
  postContent: string,
  apiKey: string,
  provider: string,
  model: string
): Promise<string[]> {
  const prompt = `You are an expert at writing viral LinkedIn posts. Based on this Reddit post, generate 5 powerful hooks (opening lines) that stop the scroll.

Reddit Post Title: ${postTitle}

Reddit Post Content: ${postContent.substring(0, 2000)}

VIRAL HOOK FORMULAS TO USE:
1. Controversial/Contrarian: "Unpopular opinion:" or "Hot take:" or challenge common beliefs
2. Personal story: "I [did something unexpected]." or "3 years ago, I [situation]."
3. Numbers/Results: "I went from X to Y in Z months." or specific metrics
4. Pattern interrupt: Start with a shocking statement or admission
5. Question hook: Rhetorical question that makes reader think

Requirements:
- Each hook is 1 short sentence only (max 10-15 words)
- NO emojis
- Create curiosity gap - make them NEED to read more
- Be specific, not generic
- Sound human, not corporate

Return ONLY a JSON array of 5 strings:
["Hook 1", "Hook 2", "Hook 3", "Hook 4", "Hook 5"]`;

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
    // Clean up the response - remove markdown code blocks if present
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

    // Accept content directly (fetched client-side to bypass Reddit IP blocking)
    const { title, content } = await request.json();

    if (!title && !content) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
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
      title || "",
      content || "",
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
