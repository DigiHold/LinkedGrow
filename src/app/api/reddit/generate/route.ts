import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { getAISettingsUser } from "@/lib/team-utils";

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

// Sanitize AI output: remove wrapping quotes
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

  return cleaned;
}

async function generatePosts(
  hook: string,
  trimmedJson: TrimmedRedditJson,
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
  // Build voice instructions from sample posts
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

  // Build Reddit context from trimmed JSON including top comments
  const topCommentsPainPoints = trimmedJson.comments
    .slice(0, 15)
    .map(c => c.body)
    .join(" | ")
    .substring(0, 1500);

  const prompt = `Act like a LinkedIn ghostwriter who writes posts that get saved and shared.

Goal: Create ${count} compelling LinkedIn posts based on this Reddit content, using the provided hook.

Hook to use (MUST be the first 2 lines):
"${hook}"

Reddit Context:
Title: ${trimmedJson.post.title}
Post: ${trimmedJson.post.selftext}
Subreddit: r/${trimmedJson.post.subreddit} (Score: ${trimmedJson.post.score}, ${trimmedJson.post.num_comments} comments)

Top Comments Pain Points:
${topCommentsPainPoints}${businessContext}

=== CRITICAL RULES ===

1. HOOK (First 2 lines - use the provided hook EXACTLY):
   - Start with the provided hook word for word
   - These are the first 2 lines visible before "See more"

2. FORMATTING (LinkedIn-native):
   - NEVER use markdown formatting like **bold** or *italic* - LinkedIn doesn't support it
   - USE Unicode bold characters for section headers (like 𝗧𝗵𝗶𝘀 𝗶𝘀 𝗯𝗼𝗹𝗱)
   - USE emojis strategically: ✅ for list items, ✨ for highlights, 📌 for save CTA, ♻️ for repost CTA, 🔔 for follow CTA
   - USE → arrows for bullet points when listing steps or features
   - Keep lines SHORT (5-10 words max per line)
   - Add whitespace between sections for skimmability
   - NEVER use em dashes or en dashes. Use commas or " - " with spaces instead.

3. STRUCTURE:
   - Start with the provided 2-line hook exactly
   - Keep it skimmable with short lines and whitespace
   - Include 1 clear takeaway + 1 framework (steps)
   - End with a CTA like "📌 Save this for later" or "♻️ Repost if this helped"
   - 800-1500 characters total
   - NO hashtags

4. CONTENT:
   - Extract insights and pain points from the Reddit content
   - No fluff, no generic advice
   - Be specific and actionable
   - Professional but conversational tone
   - Focus on genuine value
   - Make it feel like a personal story/experience${voiceInstructions}${avoidInstructions}

Return ONLY a JSON array of ${count} complete post strings (no explanations):
["Post 1 full text...", "Post 2 full text...", "Post 3 full text..."]`;

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
      throw new Error("Failed to generate posts with Grok");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    posts = JSON.parse(cleanContent);
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
      throw new Error("Failed to generate posts with Perplexity");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    posts = JSON.parse(cleanContent);
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  // Sanitize each post
  return posts.map(post => sanitizeAIOutput(post));
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hook, trimmedJson, count = 3 } = await request.json();

    if (!hook) {
      return NextResponse.json({ error: "Hook is required" }, { status: 400 });
    }

    if (!trimmedJson || !trimmedJson.post) {
      return NextResponse.json({ error: "Reddit data is required" }, { status: 400 });
    }

    // Get user's AI settings (uses owner's settings for team members)
    const result = await getAISettingsUser(session.user.id);
    if (!result) {
      return NextResponse.json({ error: "User not found or team membership invalid" }, { status: 404 });
    }

    const { aiSettingsUser } = result;

    const provider = aiSettingsUser.aiProvider || "openai";

    // Get per-provider API key (from owner for team members)
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

    // Decrypt the API key
    const apiKey = decryptApiKey(encryptedApiKey);
    if (!apiKey) {
      return NextResponse.json({ error: "Failed to decrypt API key" }, { status: 500 });
    }

    // Get per-provider model (from owner for team members)
    const providerModelMap: Record<string, string | null> = {
      openai: aiSettingsUser.openaiModel,
      anthropic: aiSettingsUser.anthropicModel,
      google: aiSettingsUser.googleModel,
      grok: aiSettingsUser.grokModel,
      perplexity: aiSettingsUser.perplexityModel,
    };

    const defaultModel = provider === "openai" ? "gpt-5-mini" :
                         provider === "anthropic" ? "claude-sonnet-4-5-20250929" :
                         provider === "google" ? "gemini-3-flash-preview" :
                         provider === "grok" ? "grok-3-mini-beta" :
                         provider === "perplexity" ? "sonar-pro" : "gpt-5-mini";
    const model = providerModelMap[provider] || defaultModel;

    // Parse sample posts from JSON if stored (from owner for team members)
    let samplePosts: string[] | undefined;
    if (aiSettingsUser.samplePosts) {
      try {
        samplePosts = JSON.parse(aiSettingsUser.samplePosts);
      } catch {
        samplePosts = undefined;
      }
    }

    // Generate posts using AI with voice settings (from owner for team members)
    const posts = await generatePosts(
      hook,
      trimmedJson,
      count,
      apiKey,
      provider,
      model,
      samplePosts,
      aiSettingsUser.neverMention || undefined,
      aiSettingsUser.businessDescription || undefined,
      aiSettingsUser.targetAudience || undefined,
      aiSettingsUser.writingTone || undefined
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
