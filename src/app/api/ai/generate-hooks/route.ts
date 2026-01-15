import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { decryptApiKey } from "@/lib/encryption";

interface HookPair {
  firstLine: string;
  secondLine: string;
}

async function generateHooks(
  postIdea: string,
  count: number,
  apiKey: string,
  provider: string,
  model: string,
  businessDescription?: string,
  targetAudience?: string,
  writingTone?: string
): Promise<HookPair[]> {
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

  const prompt = `You are an expert LinkedIn content strategist specializing in viral hooks. Generate ${count} pairs of attention-grabbing hooks for the following post idea.

Post idea: "${postIdea}"${contextInstructions}

Each hook pair consists of:
- First line: The opening statement that stops the scroll (pattern interrupt, bold claim, question, or curiosity gap)
- Second line: The follow-up that builds tension or adds context

Hook writing principles:
1. First line must be under 100 characters for mobile visibility
2. Create curiosity gaps - make readers NEED to know more
3. Use pattern interrupts (unexpected statements, contrarian views)
4. Be specific with numbers when possible
5. Address pain points or desires directly
6. Second line should complement, not repeat, the first line
7. Avoid clickbait - deliver real value in the post

Hook styles to vary:
- Bold statement: "I turned down a $500k offer. Here's why."
- Question: "What if everything you knew about productivity was wrong?"
- Contrarian: "Hustle culture is a lie. I built a 7-figure business working 4 hours a day."
- Story: "3 years ago, I was fired. Today, I run a $2M company."
- Pattern interrupt: "Stop networking. Do this instead."
- Curiosity gap: "The one skill that 10x'd my income isn't what you think."

Return ONLY a JSON array of ${count} objects with "firstLine" and "secondLine" properties. Example:
[{"firstLine": "I quit my $200k job yesterday.", "secondLine": "Not because I hated it. Because I found something better."}, {"firstLine": "The best advice I ever got was wrong.", "secondLine": "Let me explain."}]`;

  let response;
  let hooks: HookPair[] = [];

  if (provider === "openai") {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate hooks with OpenAI");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    hooks = JSON.parse(content);
  } else if (provider === "anthropic") {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-3-5-sonnet-20241022",
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
    hooks = JSON.parse(content);
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
      throw new Error(error.error?.message || "Failed to generate hooks with Google AI");
    }

    const data = await response.json();
    const content = data.candidates[0]?.content?.parts[0]?.text || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    hooks = JSON.parse(cleanContent);
  } else if (provider === "groq") {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate hooks with Groq");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    hooks = JSON.parse(content);
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

    const { postIdea, count = 5 } = await request.json();

    if (!postIdea) {
      return NextResponse.json({ error: "Post idea is required" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user?.aiApiKey) {
      return NextResponse.json({ error: "No AI API key configured" }, { status: 400 });
    }

    const apiKey = decryptApiKey(user.aiApiKey);
    if (!apiKey) {
      return NextResponse.json({ error: "Failed to decrypt API key" }, { status: 500 });
    }

    const provider = user.aiProvider || "openai";
    const defaultModel = provider === "openai" ? "gpt-4o" :
                         provider === "anthropic" ? "claude-3-5-sonnet-20241022" :
                         provider === "google" ? "gemini-2.0-flash" :
                         provider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o";
    const model = user.aiModel || defaultModel;

    const hooks = await generateHooks(
      postIdea,
      Math.min(count, 10),
      apiKey,
      provider,
      model,
      user.businessDescription || undefined,
      user.targetAudience || undefined,
      user.writingTone || undefined
    );

    return NextResponse.json({ hooks });
  } catch (error) {
    console.error("Hooks generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate hooks" },
      { status: 500 }
    );
  }
}
