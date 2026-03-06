import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { getAISettingsUser } from "@/lib/team-utils";
import { canAccessFeature, type PlanId } from "@/lib/plans";

// Sanitize AI output: remove wrapping quotes and em dashes
function sanitizeCommentOutput(text: string): string {
  let cleaned = text.trim();

  // Remove wrapping triple quotes
  if (cleaned.startsWith('"""') && cleaned.endsWith('"""')) {
    cleaned = cleaned.slice(3, -3).trim();
  }
  // Remove wrapping single or double quotes
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Replace em dashes with regular dashes
  cleaned = cleaned.replace(/—/g, " - ");
  cleaned = cleaned.replace(/–/g, " - ");

  // Trim to 300 characters max
  if (cleaned.length > 300) {
    cleaned = cleaned.substring(0, 297) + "...";
  }

  return cleaned;
}

async function generateComment(
  postContent: string,
  apiKey: string,
  provider: string,
  model: string,
  businessDescription?: string | null,
  targetAudience?: string | null,
  writingTone?: string | null
): Promise<string> {
  let businessContext = "";
  if (businessDescription || targetAudience || writingTone) {
    businessContext = "\n\n=== AUTHOR CONTEXT ===";
    if (businessDescription) businessContext += `\nBusiness: ${businessDescription}`;
    if (targetAudience) businessContext += `\nAudience: ${targetAudience}`;
    if (writingTone) businessContext += `\nTone: ${writingTone}`;
    businessContext += "\n=== END CONTEXT ===";
  }

  const prompt = `You are a LinkedIn engagement expert. Write a first comment for the LinkedIn post below.

=== THE POST ===
${postContent}
=== END POST ===${businessContext}

=== RULES ===

1. PURPOSE: The comment should ADD VALUE to the post, not repeat it. Think of it as bonus content.

2. APPROACHES (pick the best one for this post):
   - Share an additional tip, insight, or example not covered in the post
   - Ask a thought-provoking follow-up question that invites discussion
   - Share a relevant personal angle or data point
   - Offer a practical resource, framework, or tool recommendation
   - Present a respectful counter-perspective that sparks debate

3. TONE:
   - Conversational and genuine, not promotional
   - Write like a real person, not a brand
   - Match the energy of the post

4. FORMAT:
   - 1-3 short sentences maximum (under 280 characters total)
   - No hashtags
   - No emojis at the very start of the comment
   - No self-promotional language
   - NEVER use em dashes or en dashes. Use commas or " - " instead
   - NEVER start with "Great post!", "Love this!", "So true!" or similar generic praise
   - NEVER start with "As someone who..." or "Speaking from experience..."
   - Avoid overused LinkedIn phrases like "game-changer", "deep dive", "at the end of the day"
   - Write short, punchy sentences. No long compound sentences

5. GOAL: Encourage others to reply, which tells the LinkedIn algorithm the post is engaging.

Return ONLY the comment text. No quotes, no explanations, no labels.`;

  let response;
  let comment = "";

  if (provider === "openai") {
    const openaiModel = model || "o4-mini";
    const isOSeries = openaiModel.startsWith("o3") || openaiModel.startsWith("o4");
    const isGPT5 = openaiModel.startsWith("gpt-5");

    const requestBody: Record<string, unknown> = {
      model: openaiModel,
      messages: [{ role: "user", content: prompt }],
    };
    if (!isOSeries && !isGPT5) {
      requestBody.temperature = 0.8;
    }
    if (isOSeries || isGPT5) {
      requestBody.max_completion_tokens = 500;
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
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || "Failed to generate comment with OpenAI");
    }

    const data = await response.json();
    comment = data.choices[0]?.message?.content || "";
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
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || "Failed to generate comment with Anthropic");
    }

    const data = await response.json();
    comment = data.content[0]?.text || "";
  } else if (provider === "google") {
    const googleModel = model || "gemini-3-flash-preview";
    const isProModel = googleModel.includes("-pro");

    const googleRequestBody: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: isProModel ? 1000 : 500,
      },
    };

    if (isProModel) {
      (googleRequestBody.generationConfig as Record<string, unknown>).thinkingConfig = {
        thinkingBudget: 1024,
      };
    }

    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(googleRequestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || "Failed to generate comment with Google AI");
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    comment = "";
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i]?.text) {
        comment = parts[i].text;
        break;
      }
    }
  } else if (provider === "grok") {
    response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "grok-4-1-fast-reasoning",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || "Failed to generate comment with Grok");
    }

    const data = await response.json();
    comment = data.choices[0]?.message?.content || "";
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
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || "Failed to generate comment with Perplexity");
    }

    const data = await response.json();
    comment = data.choices[0]?.message?.content || "";
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  return sanitizeCommentOutput(comment);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { postContent } = body;

    if (!postContent || typeof postContent !== "string") {
      return NextResponse.json({ error: "Post content is required" }, { status: 400 });
    }

    // Get user's AI settings (uses owner's settings for team members)
    const result = await getAISettingsUser(session.user.id);
    if (!result) {
      return NextResponse.json({ error: "User not found or team membership invalid" }, { status: 404 });
    }

    const { aiSettingsUser } = result;

    // Check plan access - advancedEditor requires Starter+
    const userPlan = (aiSettingsUser.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "advancedEditor")) {
      return NextResponse.json(
        { error: "This feature requires a Starter plan or higher." },
        { status: 403 }
      );
    }

    const provider = aiSettingsUser.aiProvider || "openai";

    // Get per-provider API key
    const providerKeyMap: Record<string, string | null> = {
      openai: aiSettingsUser.openaiApiKey,
      anthropic: aiSettingsUser.anthropicApiKey,
      google: aiSettingsUser.googleApiKey,
      grok: aiSettingsUser.grokApiKey,
      perplexity: aiSettingsUser.perplexityApiKey,
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
      openai: aiSettingsUser.openaiModel,
      anthropic: aiSettingsUser.anthropicModel,
      google: aiSettingsUser.googleModel,
      grok: aiSettingsUser.grokModel,
      perplexity: aiSettingsUser.perplexityModel,
    };

    const defaultModel = provider === "openai" ? "o4-mini" :
                         provider === "anthropic" ? "claude-sonnet-4-6" :
                         provider === "google" ? "gemini-3-flash-preview" :
                         provider === "grok" ? "grok-4-1-fast-reasoning" :
                         provider === "perplexity" ? "sonar-pro" : "o4-mini";
    const model = providerModelMap[provider] || defaultModel;

    const comment = await generateComment(
      postContent,
      apiKey,
      provider,
      model,
      aiSettingsUser.businessDescription,
      aiSettingsUser.targetAudience,
      aiSettingsUser.writingTone
    );

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Generate comment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate comment" },
      { status: 500 }
    );
  }
}
