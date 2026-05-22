import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { getAISettingsUser } from "@/lib/team-utils";
import { canAccessFeature, type PlanId } from "@/lib/plans";
import { checkAIRateLimit } from "@/lib/rate-limit";
import { buildLanguageInstruction } from "@/lib/content-languages";
import { fetchAIWithRetry } from "@/lib/ai-fetch";

export const maxDuration = 120;

// Generic content input
interface ContentInput {
  source: "reddit" | "youtube" | "webpage" | "blog";
  title: string;
  content: string;
  metadata?: {
    subreddit?: string;
    score?: number;
    commentCount?: number;
    duration?: number;
    excerpt?: string;
    comments?: Array<{ body: string; score: number }>;
  };
}

// Sanitize AI output: remove wrapping quotes
function sanitizeAIOutput(text: string): string {
  let cleaned = text.trim();

  if (cleaned.startsWith('"""') && cleaned.endsWith('"""')) {
    cleaned = cleaned.slice(3, -3).trim();
  }
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  return cleaned;
}

function buildPrompt(
  hook: string,
  input: ContentInput,
  count: number,
  samplePosts?: string[],
  neverMention?: string,
  businessDescription?: string,
  targetAudience?: string,
  writingTone?: string,
  contentLanguage?: string
): string {
  // Build voice instructions
  let voiceInstructions = "";
  if (samplePosts && samplePosts.length > 0) {
    voiceInstructions = `

=== SAMPLE POSTS TO MATCH ===
Match the structure, pacing, formatting, and voice of these posts. The ideas and wording must be NEW - do NOT copy phrases.
${samplePosts.map((p, i) => `
--- Sample ${i + 1} ---
${p.substring(0, 800)}`).join("\n")}
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

  // Truncate content to avoid exceeding AI model context limits and timeouts
  const maxContentLength = 15000;
  const truncatedContent = input.content.length > maxContentLength
    ? input.content.substring(0, maxContentLength) + "\n\n[Content truncated for length]"
    : input.content;

  // Build source-specific content context
  let sourceContext = "";
  if (input.source === "reddit") {
    const topCommentsPainPoints = input.metadata?.comments
      ? input.metadata.comments.slice(0, 15).map(c => c.body).join(" | ").substring(0, 1500)
      : "";
    sourceContext = `Reddit Context:
Title: ${input.title}
Post: ${truncatedContent}
Subreddit: r/${input.metadata?.subreddit || "unknown"} (Score: ${input.metadata?.score || 0}, ${input.metadata?.commentCount || 0} comments)

Top Comments Pain Points:
${topCommentsPainPoints}`;
  } else if (input.source === "youtube") {
    const durationMin = input.metadata?.duration ? Math.round(input.metadata.duration / 60) : 0;
    sourceContext = `YouTube Video Context:
Title: ${input.title}${durationMin ? `\nApproximate length: ${durationMin} minutes` : ""}
Transcript: ${truncatedContent}

Focus on the most insightful, surprising, or actionable content from the video. Pick ONE angle and go deep.`;
  } else {
    const label = input.source === "blog" ? "Blog Article" : "Web Page";
    sourceContext = `${label} Context:
Title: ${input.title}
Content: ${truncatedContent}

Focus on the most compelling insight from this ${label.toLowerCase()}. Find the ONE insight that would make someone stop scrolling on LinkedIn and engage.`;
  }

  return `Act like a LinkedIn ghostwriter who writes posts that get saved and shared.

Goal: Create ${count} compelling LinkedIn posts based on this content, using the provided hook.

Hook to use (MUST be the first 2 lines):
"${hook}"

${sourceContext}${businessContext}

=== CRITICAL RULES ===

1. HOOK (First 2 lines - use the provided hook EXACTLY):
   - Start with the provided hook word for word
   - These are the first 2 lines visible before "See more"

2. FORMATTING (LinkedIn-native):
   - NEVER use markdown formatting like **bold** or *italic* - LinkedIn doesn't support it
   - USE Unicode bold characters for section headers (like \u{1D5E7}\u{1D5F5}\u{1D5F6}\u{1D600} \u{1D5F6}\u{1D600} \u{1D5EE}\u{1D5FC}\u{1D5F9}\u{1D5F1})
   - USE emojis strategically: \u2705 for list items, \u2728 for highlights, \uD83D\uDCCC for save CTA, \u267B\uFE0F for repost CTA, \uD83D\uDD14 for follow CTA
   - USE \u2192 arrows for bullet points when listing steps or features
   - Write COMPLETE sentences on a single line. Do NOT split a sentence across multiple lines.
   - Separate PARAGRAPHS with blank lines for readability, but keep each sentence intact on one line.
   - NEVER use em dashes or en dashes. Use commas or " - " with spaces instead.

3. STRUCTURE:
   - Start with the provided 2-line hook exactly
   - Separate sections with blank lines for skimmability
   - Include 1 clear takeaway + 1 framework (steps)
   - End with a CTA like "\uD83D\uDCCC Save this for later" or "\u267B\uFE0F Repost if this helped"
   - 800-1500 characters total
   - NO hashtags

4. CONTENT:
   - Extract insights and ${input.source === "reddit" ? "pain points from the Reddit content" : input.source === "youtube" ? "key takeaways from the video transcript" : "key insights from the article"}
   - No fluff, no generic advice
   - Be specific and actionable
   - Professional but conversational tone
   - Focus on genuine value
   - Make it feel like a personal story/experience${voiceInstructions}${avoidInstructions}${buildLanguageInstruction(contentLanguage)}

Return ONLY a JSON array of ${count} complete post strings (no explanations):
["Post 1 full text...", "Post 2 full text...", "Post 3 full text..."]`;
}

async function generatePosts(
  prompt: string,
  apiKey: string,
  provider: string,
  model: string
): Promise<string[]> {
  let response;
  let posts: string[] = [];

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
      requestBody.max_completion_tokens = 8000;
    }
    if (isGPT5) {
      requestBody.reasoning_effort = "low";
    }

    response = await fetchAIWithRetry("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error("Failed to generate posts with OpenAI");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    posts = JSON.parse(cleanContent);
  } else if (provider === "anthropic") {
    response = await fetchAIWithRetry("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-4-6",
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
    const googleModel = model || "gemini-3-flash-preview";
    const isProModel = googleModel.includes("-pro");

    const googleRequestBody: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: isProModel ? 16000 : 4000,
      },
    };

    if (isProModel) {
      (googleRequestBody.generationConfig as Record<string, unknown>).thinkingConfig = {
        thinkingBudget: 1024,
      };
    }

    response = await fetchAIWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(googleRequestBody),
    });

    if (!response.ok) {
      throw new Error("Failed to generate posts with Google AI");
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    let content = "[]";
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i]?.text) {
        content = parts[i].text;
        break;
      }
    }
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    posts = JSON.parse(cleanContent);
  } else if (provider === "grok") {
    response = await fetchAIWithRetry("https://api.x.ai/v1/chat/completions", {
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
      throw new Error("Failed to generate posts with Grok");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    posts = JSON.parse(cleanContent);
  } else if (provider === "perplexity") {
    response = await fetchAIWithRetry("https://api.perplexity.ai/chat/completions", {
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
      throw new Error("Failed to generate posts with Perplexity");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    posts = JSON.parse(cleanContent);
  } else if (provider === "kimi") {
    // Kimi uses OpenAI-compatible API
    response = await fetchAIWithRetry("https://api.moonshot.ai/v1/chat/completions", {
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || "Failed to generate posts with Kimi");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    posts = JSON.parse(cleanContent);
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  return posts.map(post => sanitizeAIOutput(post));
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

    const { hook, content: contentInput, count = 3 } = await request.json();

    if (!hook) {
      return NextResponse.json({ error: "Hook is required" }, { status: 400 });
    }

    if (!contentInput || !contentInput.source) {
      return NextResponse.json({ error: "Content data is required" }, { status: 400 });
    }

    // Get user's AI settings
    const result = await getAISettingsUser(session.user.id);
    if (!result) {
      return NextResponse.json({ error: "User not found or team membership invalid" }, { status: 404 });
    }

    const { aiSettingsUser } = result;

    // Check plan access
    const userPlan = (aiSettingsUser.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "contentRepurposing")) {
      return NextResponse.json(
        { error: "Content repurposing requires a Starter plan or higher. Please upgrade to access this feature." },
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

    // Parse sample posts
    let samplePosts: string[] | undefined;
    if (aiSettingsUser.samplePosts) {
      try {
        samplePosts = JSON.parse(aiSettingsUser.samplePosts);
      } catch {
        samplePosts = undefined;
      }
    }

    const prompt = buildPrompt(
      hook,
      contentInput as ContentInput,
      count,
      samplePosts,
      aiSettingsUser.neverMention || undefined,
      aiSettingsUser.businessDescription || undefined,
      aiSettingsUser.targetAudience || undefined,
      aiSettingsUser.writingTone || undefined,
      aiSettingsUser.contentLanguage || undefined
    );

    const posts = await generatePosts(prompt, apiKey, provider, model);

    return NextResponse.json({ posts });
  } catch (error) {
return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate posts" },
      { status: 500 }
    );
  }
}
