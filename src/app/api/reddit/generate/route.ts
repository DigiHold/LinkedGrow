import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { decryptApiKey } from "@/lib/encryption";

async function generatePosts(
  hook: string,
  redditTitle: string,
  redditContent: string,
  count: number,
  apiKey: string,
  provider: string,
  model: string,
  samplePosts?: string[],
  neverMention?: string,
  businessDescription?: string,
  targetAudience?: string,
  writingTone?: string
): Promise<string[]> {
  let voiceInstructions = "";
  if (samplePosts && samplePosts.length > 0) {
    voiceInstructions = `\n\nIMPORTANT - Match the writing style from these sample posts:\n${samplePosts.map((p, i) => `Sample ${i + 1}: ${p.substring(0, 500)}`).join("\n\n")}`;
  }

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

  let avoidInstructions = "";
  if (neverMention) {
    avoidInstructions = `\n\nNEVER mention or reference: ${neverMention}`;
  }

  const prompt = `You are an expert at writing viral LinkedIn posts. Generate ${count} different posts based on this Reddit content.

Hook to use: "${hook}"

Reddit Post Title: ${redditTitle}

Reddit Post Content: ${redditContent.substring(0, 2000)}${contextInstructions}

VIRAL LINKEDIN POST STRUCTURE:
1. HOOK (use the provided hook exactly)
2. STORY/CONTEXT (2-3 short paragraphs, personal angle)
3. KEY INSIGHT or LESSON (what you learned)
4. ACTIONABLE TAKEAWAY (what the reader can do)
5. ENGAGEMENT CTA (question to spark comments)

FORMATTING RULES:
- Start with the hook on its own line
- Use single line breaks between thoughts
- Keep paragraphs to 1-2 sentences MAX
- Use white space generously
- Total length: 1000-1500 characters
- NO hashtags
- NO emojis (or max 1 if essential)
- Write like you're talking to a friend, not a corporate memo
- Be vulnerable and authentic
- Include specific details/numbers when possible${voiceInstructions}${avoidInstructions}

EXAMPLE FORMAT:
[Hook line]

[Short personal context - 1-2 sentences]

[What happened - be specific]

[The insight/lesson - bold statement]

[Actionable advice for reader]

[Engaging question to end]

Return ONLY a JSON array of ${count} complete post strings:
["Post 1...", "Post 2...", "Post 3..."]`;

  let response;
  let posts: string[] = [];

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
      throw new Error("Failed to generate posts with OpenAI");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    posts = JSON.parse(cleanContent);
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
      throw new Error("Failed to generate posts with Anthropic");
    }

    const data = await response.json();
    const content = data.content[0]?.text || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    posts = JSON.parse(cleanContent);
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
      throw new Error("Failed to generate posts with Google AI");
    }

    const data = await response.json();
    const content = data.candidates[0]?.content?.parts[0]?.text || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    posts = JSON.parse(cleanContent);
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  return posts;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Accept content directly (fetched client-side to bypass Reddit IP blocking)
    const { hook, title, content, count = 3 } = await request.json();

    if (!hook) {
      return NextResponse.json({ error: "Hook is required" }, { status: 400 });
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

    // Parse sample posts from JSON if stored
    let samplePosts: string[] | undefined;
    if (user.samplePosts) {
      try {
        samplePosts = JSON.parse(user.samplePosts);
      } catch {
        samplePosts = undefined;
      }
    }

    // Generate posts using AI with voice settings
    const posts = await generatePosts(
      hook,
      title || "",
      content || "",
      count,
      apiKey,
      provider,
      model,
      samplePosts,
      user.neverMention || undefined,
      user.businessDescription || undefined,
      user.targetAudience || undefined,
      user.writingTone || undefined
    );

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Reddit generate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate posts" },
      { status: 500 }
    );
  }
}
