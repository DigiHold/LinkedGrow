import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { getAISettingsUser } from "@/lib/team-utils";
import { canAccessFeature, type PlanId } from "@/lib/plans";
import { checkAIRateLimit } from "@/lib/rate-limit";
import { buildLanguageInstruction } from "@/lib/content-languages";

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
  writingTone?: string | null,
  isEngagement?: boolean,
  samplePosts?: string | null,
  neverMention?: string | null,
  contentLanguage?: string | null
): Promise<string> {
  let businessContext = "";
  if (businessDescription || targetAudience || writingTone || samplePosts || neverMention) {
    businessContext = "\n\n=== YOUR PROFILE (the person commenting) ===";
    if (businessDescription) businessContext += `\nWhat you do: ${businessDescription}`;
    if (targetAudience) businessContext += `\nYour audience: ${targetAudience}`;
    if (writingTone) businessContext += `\nYour tone: ${writingTone}`;
    if (neverMention) businessContext += `\nNEVER mention or reference: ${neverMention}`;
    if (samplePosts) {
      try {
        const samples = JSON.parse(samplePosts);
        if (Array.isArray(samples) && samples.length > 0) {
          businessContext += `\nYour writing style (match this voice):\n${samples.slice(0, 2).map((s: string) => `"${s.substring(0, 200)}"`).join("\n")}`;
        }
      } catch { /* ignore */ }
    }
    businessContext += "\n=== END PROFILE ===";
  }

  const prompt = isEngagement ? `You are commenting on someone else's LinkedIn post. Write a genuine comment as a real human would.

=== THE POST ===
${postContent}
=== END POST ===${businessContext}

=== WHAT TO DO ===

Pick ONE approach based on what fits the post naturally. Do NOT always share personal experience - most comments don't need that. Vary your approach:

- AGREE and add a short insight: "The part about X is spot on. I'd add that..."
- RESPECTFULLY CHALLENGE: "Interesting take. I've seen the opposite where..."
- ASK ONE SPECIFIC QUESTION about something they said
- SHARE A QUICK DATA POINT or fact that supports/extends their point
- GIVE A CONCRETE EXAMPLE related to their topic
- SIMPLY REACT with a specific thought: "The bit about X really stuck with me because..."

=== BANNED (AI SLOP) ===

NEVER use these words or patterns:
- "This resonates" / "resonated with me"
- "Great post" / "Love this" / "So true" / "Nailed it" / "Spot on"
- "Thanks for sharing"
- "This is a great reminder"
- "Couldn't agree more"
- "game-changer" / "dive deep" / "unpack" / "landscape" / "leverage"
- "In my experience" as the opening line
- Any question ending with "?" that sounds like an interview
- Starting with an emoji
- "As someone who..." as opener

=== FORMAT ===

- 1-3 SHORT sentences. Under 250 characters.
- No hashtags. No em dashes. No links.
- Sound like a real person typing on their phone, not a marketing AI.
- Reference something SPECIFIC from the post (a word, phrase, or idea).${buildLanguageInstruction(contentLanguage)}

Return ONLY the comment text.` :

  `You are writing a FIRST COMMENT on your OWN LinkedIn post. This is YOUR post - you are the author commenting on it yourself.

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

Get readers to reply. More replies = LinkedIn algorithm pushes the post to more people.${buildLanguageInstruction(contentLanguage)}

Return ONLY the comment text. No quotes, no explanations, no labels.`;

  let response;
  let comment = "";

  if (provider === "openai") {
    const openaiModel = model || "gpt-5.4-mini";
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
        model: model || "claude-sonnet-5",
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
        model: model || "grok-4.3",
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
        model: model || "kimi-k2.6",
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

    const aiRateLimit = checkAIRateLimit(session.user.id);
    if (!aiRateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { postContent, isEngagement } = body;

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

    const defaultModel = provider === "openai" ? "gpt-5.4-mini" :
                         provider === "anthropic" ? "claude-sonnet-5" :
                         provider === "google" ? "gemini-3-flash-preview" :
                         provider === "grok" ? "grok-4.3" :
                         provider === "perplexity" ? "sonar-pro" :
                         provider === "kimi" ? "kimi-k2.6" : "gpt-5.4-mini";
    const model = providerModelMap[provider] || defaultModel;

    const comment = await generateComment(
      postContent,
      apiKey,
      provider,
      model,
      aiSettingsUser.businessDescription,
      aiSettingsUser.targetAudience,
      aiSettingsUser.writingTone,
      isEngagement === true,
      aiSettingsUser.samplePosts,
      aiSettingsUser.neverMention,
      aiSettingsUser.contentLanguage
    );

    return NextResponse.json({ comment });
  } catch (error) {
return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate comment" },
      { status: 500 }
    );
  }
}
