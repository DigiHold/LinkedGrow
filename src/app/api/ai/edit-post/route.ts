import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { getAISettingsUser } from "@/lib/team-utils";
import { canAccessFeature, type PlanId } from "@/lib/plans";

// Sanitize AI output: remove wrapping quotes and em dashes
function sanitizeAIOutput(text: string): string {
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

  return cleaned;
}

interface EditPostRequest {
  content: string;
  instruction: string;
}

async function editPost(
  content: string,
  instruction: string,
  apiKey: string,
  provider: string,
  model: string
): Promise<string> {
  // Map common quick actions to detailed instructions (handle all variations)
  const instructionMap: Record<string, string> = {
    // Shorter variations
    "Make Shorter": "Shorten the post significantly while keeping the key message and impact. Remove filler words, redundant phrases, and unnecessary details. Combine similar points. Keep the hook (first 2 lines) powerful. Target 30-40% shorter.",
    "Make it shorter": "Shorten the post significantly while keeping the key message and impact. Remove filler words, redundant phrases, and unnecessary details. Combine similar points. Keep the hook (first 2 lines) powerful. Target 30-40% shorter.",

    // Emoji variations
    "Add Emojis": "Add relevant emojis to make the post more engaging and scannable. Place them at the start of key bullet points or sections to create visual breaks. Use 4-6 emojis total, spread throughout. Match emoji to content meaning.",
    "Add emojis": "Add relevant emojis to make the post more engaging and scannable. Place them at the start of key bullet points or sections to create visual breaks. Use 4-6 emojis total, spread throughout. Match emoji to content meaning.",

    // Hook variations
    "Stronger Hook": "Rewrite ONLY the first 2 lines (the hook) to be dramatically more attention-grabbing. Use one of these patterns: 1) Bold controversial statement, 2) Surprising number/statistic, 3) Personal vulnerable admission, 4) Direct challenge to reader. The hook must make people STOP scrolling. Keep the rest of the post exactly the same.",
    "Stronger hook": "Rewrite ONLY the first 2 lines (the hook) to be dramatically more attention-grabbing. Use one of these patterns: 1) Bold controversial statement, 2) Surprising number/statistic, 3) Personal vulnerable admission, 4) Direct challenge to reader. The hook must make people STOP scrolling. Keep the rest of the post exactly the same.",

    // CTA variations
    "Add CTA": "Add a compelling call-to-action at the end that drives engagement. Use one of these: 1) A specific question that invites comments, 2) Ask for opinions/experiences, 3) Challenge readers to take action, 4) Invite DMs for specific help. Make it feel natural and relevant to the post content.",
    "Better CTA": "Improve or add a compelling call-to-action at the end that drives engagement. Use one of these: 1) A specific question that invites comments, 2) Ask for opinions/experiences, 3) Challenge readers to take action, 4) Invite DMs for specific help. Make it feel natural and relevant to the post content.",

    // Tone variations
    "More Casual": "Make the tone more conversational and relatable. Use contractions (I'm, you're, don't). Add personal touches and informal language. Remove corporate jargon. Write like you're talking to a friend over coffee. Keep it professional but warm.",
    "More Formal": "Make the tone more professional and polished. Remove slang and overly casual phrases. Use complete sentences. Add authority and credibility. Keep it warm but business-appropriate. Good for B2B or executive audiences.",
  };

  // Normalize instruction to handle case variations
  const normalizedInstruction = instruction.trim();
  const detailedInstruction = instructionMap[normalizedInstruction] || instruction;

  const prompt = `You are editing a LinkedIn post. Apply the following instruction to improve the post.

ORIGINAL POST:
${content}

INSTRUCTION: ${detailedInstruction}

LinkedIn post structure reminder:
- First 2 lines = the HOOK (most important - this is what shows before "see more")
- Short paragraphs with line breaks between them
- Easy to scan and read on mobile

Requirements:
- Keep the same overall message unless the instruction says otherwise
- Maintain LinkedIn best practices (short paragraphs, line breaks for readability)
- NO emojis unless the instruction specifically asks for them
- NEVER use em dashes or en dashes. Use regular dashes with spaces " - " instead
- Return ONLY the edited post text, nothing else - no explanations, no quotes around it

Return the edited post:`;

  let response;
  let editedContent = "";

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
      requestBody.temperature = 0.7;
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
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || "Failed to edit post with OpenAI");
    }

    const data = await response.json();
    editedContent = data.choices[0]?.message?.content || "";
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
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || "Failed to edit post with Anthropic");
    }

    const data = await response.json();
    editedContent = data.content[0]?.text || "";
  } else if (provider === "google") {
    const googleModel = model || "gemini-3-flash-preview";
    const isProModel = googleModel.includes("-pro");

    // Build request body - Pro models need higher maxOutputTokens
    const googleRequestBody: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: isProModel ? 8000 : 2000,
      },
    };

    // For Pro models, set minimal thinking budget to reduce reasoning overhead
    // Pro models require thinking mode, so we use the minimum budget (1024 tokens)
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
      throw new Error(error.error?.message || "Failed to edit post with Google AI");
    }

    const data = await response.json();
    // For Pro models with thinking enabled, find the last text part (thinking parts come first)
    const parts = data.candidates?.[0]?.content?.parts || [];
    editedContent = "";
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i]?.text) {
        editedContent = parts[i].text;
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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || "Failed to edit post with Grok");
    }

    const data = await response.json();
    editedContent = data.choices[0]?.message?.content || "";
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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || "Failed to edit post with Perplexity");
    }

    const data = await response.json();
    editedContent = data.choices[0]?.message?.content || "";
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
      throw new Error(error.error?.message || "Failed to edit post with Kimi");
    }

    const data = await response.json();
    editedContent = data.choices[0]?.message?.content || "";
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  return sanitizeAIOutput(editedContent);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: EditPostRequest = await request.json();
    const { content, instruction } = body;

    if (!content || !instruction) {
      return NextResponse.json({ error: "Content and instruction are required" }, { status: 400 });
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
        { error: "Advanced editor requires a Starter plan or higher. Please upgrade to access this feature." },
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

    // Decrypt the API key
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

    const editedContent = await editPost(content, instruction, apiKey, provider, model);

    return NextResponse.json({ content: editedContent });
  } catch (error) {
    console.error("Edit post error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to edit post" },
      { status: 500 }
    );
  }
}
