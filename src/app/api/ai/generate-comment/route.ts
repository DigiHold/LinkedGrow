import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { getAISettingsUser } from "@/lib/team-utils";
import { canAccessFeature, type PlanId } from "@/lib/plans";

export const maxDuration = 120;

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

  const prompt = `You are writing a FIRST COMMENT on your OWN LinkedIn post. This is YOUR post - you are the author commenting on it yourself.

=== YOUR POST ===
${postContent}
=== END POST ===${businessContext}

=== WHAT A FIRST COMMENT IS ===

The first comment is a strategic self-reply posted by the author 1-5 minutes after publishing. It serves as a CTA, bonus resource, or conversation starter directed at READERS. You are talking TO your audience, not asking yourself questions.

=== APPROACHES (pick the best one) ===

1. CALL TO ACTION - Ask readers to engage:
   - "Drop a comment if you've tried this"
   - "Who else has seen this in their industry?"
   - "Tag someone who needs to hear this"
   - "What's your experience with this?"

2. BONUS VALUE - Add something extra for readers:
   - Share a quick extra tip not in the post
   - Mention a free resource, tool, or link
   - Add a stat or data point that supports your post
   - Give a quick summary or TLDR

3. PERSONAL TOUCH - Make it relatable:
   - Share a quick personal anecdote related to the post
   - Mention what made you write this
   - Share what you learned the hard way about this topic

=== STRICT RULES ===

- You are the POST AUTHOR commenting on YOUR OWN post
- Talk TO readers, not to yourself
- 1-3 short sentences max (under 280 characters)
- No hashtags
- NEVER use em dashes or en dashes. Use commas or " - " instead
- NEVER start with generic filler like "Great question!", "Curious to hear..."
- NEVER ask yourself a question as if you're a stranger reading the post
- No self-promotional language or links to your products
- Write casually and naturally, like a real person
- Short punchy sentences, no long compound sentences
- Can start with an emoji but not required

=== GOAL ===

Get readers to reply. More replies = LinkedIn algorithm pushes the post to more people.

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
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || "Failed to generate comment with Kimi");
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

    // Check plan access - firstComment requires Pro+
    const userPlan = (aiSettingsUser.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "firstComment")) {
      return NextResponse.json(
        { error: "First Comment requires a Pro plan or higher." },
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

    // Get per-provider model
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
