import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { decryptApiKey } from "@/lib/encryption";

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
  writingTone?: string
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

  const prompt = `You are an expert LinkedIn content strategist. Generate ${count} unique post ideas on the theme: "${theme}"${contextInstructions}

For each idea, provide:
1. hook: A compelling one-line hook (the first line of the post that grabs attention)
2. type: The post type (Story, Listicle, Opinion, How-to, Question, Insight, Case Study, Myth Buster)
3. category: The content category (e.g., Career, Leadership, Productivity, Tech, Marketing, etc.)
4. engagement: Expected engagement level (Very High, High, Medium)

Post idea principles:
- Hooks should stop the scroll - be bold, specific, or curiosity-inducing
- Mix different post types for variety
- Focus on actionable insights and real experiences
- Avoid generic advice - be specific and authentic
- Consider what would make people comment and share

Return ONLY a JSON array of ${count} objects. Example format:
[
  {
    "hook": "I turned down a $300k job offer. Here's why it was the best decision I ever made.",
    "type": "Story",
    "category": "Career",
    "engagement": "Very High"
  }
]`;

  let response;
  let ideas: Idea[] = [];

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
        temperature: 0.9,
      }),
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
        model: model || "claude-sonnet-4-5-20250929",
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
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate ideas with Google AI");
    }

    const data = await response.json();
    const content = data.candidates[0]?.content?.parts[0]?.text || "[]";
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
        model: model || "grok-3-mini-beta",
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
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  return ideas;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { theme, count = 10 } = await request.json();

    if (!theme) {
      return NextResponse.json({ error: "Theme is required" }, { status: 400 });
    }

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

    const ideas = await generateIdeas(
      theme,
      Math.min(count, 20),
      apiKey,
      provider,
      model,
      user.businessDescription || undefined,
      user.targetAudience || undefined,
      user.writingTone || undefined
    );

    return NextResponse.json({ ideas });
  } catch (error) {
    console.error("Ideas generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate ideas" },
      { status: 500 }
    );
  }
}
