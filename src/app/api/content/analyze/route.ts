import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { getAISettingsUser } from "@/lib/team-utils";
import { canAccessFeature, type PlanId } from "@/lib/plans";

export const maxDuration = 120;

// Generic content input (replaces Reddit-specific trimmedJson)
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

function buildPrompt(input: ContentInput): string {
  // Truncate content to avoid exceeding AI model context limits and timeouts
  const maxContentLength = 15000;
  const truncatedContent = input.content.length > maxContentLength
    ? input.content.substring(0, maxContentLength) + "\n\n[Content truncated for length]"
    : input.content;

  let sourceContext = "";
  let contentBlock = "";

  if (input.source === "reddit") {
    sourceContext = `Source: Viral Reddit post from r/${input.metadata?.subreddit || "unknown"} (Score: ${input.metadata?.score || 0}, ${input.metadata?.commentCount || 0} comments)`;
    contentBlock = `TITLE: ${input.title}\n\nCONTENT: ${truncatedContent}`;
    if (input.metadata?.comments && input.metadata.comments.length > 0) {
      contentBlock += `\n\nTOP COMMENTS: ${input.metadata.comments.slice(0, 10).map(c => c.body).join('\n---\n')}`;
    }
  } else if (input.source === "youtube") {
    const durationMin = input.metadata?.duration ? Math.round(input.metadata.duration / 60) : 0;
    sourceContext = `Source: YouTube video transcript${durationMin ? ` (~${durationMin} minutes)` : ""}`;
    contentBlock = `VIDEO TITLE: ${input.title}\n\nTRANSCRIPT: ${truncatedContent}`;
  } else {
    // blog or webpage
    const label = input.source === "blog" ? "blog article" : "web page";
    sourceContext = `Source: ${label}`;
    contentBlock = `ARTICLE TITLE: ${input.title}\n\nCONTENT: ${truncatedContent}`;
  }

  return `I will give you content from a ${input.source === "reddit" ? "viral Reddit post" : input.source === "youtube" ? "YouTube video" : input.source === "blog" ? "blog article" : "web page"}:

${sourceContext}

${contentBlock}

Your task: Create 5 viral LinkedIn hooks based on THIS SPECIFIC CONTENT.

CRITICAL: The hooks must be about the ACTUAL content. Extract the key insight, story, advice, or controversial take from the content. Use specific details (numbers, names, timeframes, job titles, etc.) from the content. DO NOT generate generic hooks.

Adapt to the content type:
${input.source === "reddit" ? `- Personal story? Capture the journey, transformation, specific numbers
- Advice post? Extract the contrarian or surprising insight
- Question/Discussion? Turn the most interesting angle into a hook
- Tutorial/How-to? Lead with the surprising result or counterintuitive method` :
input.source === "youtube" ? `- Focus on the speaker's most counterintuitive or surprising claim
- Extract specific data points, numbers, or frameworks mentioned
- Find actionable advice that LinkedIn professionals can apply immediately
- Personal stories or anecdotes that resonate with a professional audience` :
`- Focus on the author's most original or contrarian point
- Extract statistics, data, or research findings
- Find frameworks or methodologies that readers can apply
- Surprising conclusions or counterintuitive advice`}

Hook format (EXACTLY 2 lines each):

"I woke up at 4am to bake bread.
After work, I taught myself to code. Here's what happened."

"Everyone told me to charge $59.
I gave it away free. Then 500,000 websites chose me."

"3 seconds.
That's all it takes to lose half your visitors."

"Stop optimizing your LinkedIn profile.
The algorithm rewards something completely different now."

Requirements:
- Each hook is EXACTLY 2 lines
- Line 1: Short, punchy, stops the scroll (max 8 words)
- Line 2: Builds curiosity, makes them want to read more (max 15 words)
- NO emojis
- NEVER use em dashes or en dashes. Use regular dashes with spaces " - " instead
- Be SPECIFIC - use actual details, numbers, facts from the content
- Sound human and authentic
- If the content has a personal element, write hooks in first person

Return ONLY a JSON array of 5 strings (each string has 2 lines separated by \\n):
["Line1\\nLine2", "Line1\\nLine2", "Line1\\nLine2", "Line1\\nLine2", "Line1\\nLine2"]`;
}

async function generateHooks(
  prompt: string,
  apiKey: string,
  provider: string,
  model: string
): Promise<string[]> {
  let response;
  let hooks: string[] = [];

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
      requestBody.max_completion_tokens = 2048;
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
      hooks = JSON.parse(cleanContent);
    } catch {
      throw new Error("AI returned invalid JSON. Please try again.");
    }
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
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
      hooks = JSON.parse(cleanContent);
    } catch {
      throw new Error("AI returned invalid JSON. Please try again.");
    }
  } else if (provider === "google") {
    const googleModel = model || "gemini-3-flash-preview";
    const isProModel = googleModel.includes("-pro");

    const googleRequestBody: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: isProModel ? 8000 : 2000,
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Google AI API error: ${response.status}`);
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
    try {
      hooks = JSON.parse(cleanContent);
    } catch {
      throw new Error("AI returned invalid JSON. Please try again.");
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Grok API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
      hooks = JSON.parse(cleanContent);
    } catch {
      throw new Error("AI returned invalid JSON. Please try again.");
    }
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
      hooks = JSON.parse(cleanContent);
    } catch {
      throw new Error("AI returned invalid JSON. Please try again.");
    }
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Kimi API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
      hooks = JSON.parse(cleanContent);
    } catch {
      throw new Error("AI returned invalid JSON. Please try again.");
    }
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

    const body: ContentInput = await request.json();

    if (!body.content || !body.source) {
      return NextResponse.json({ error: "Content and source are required" }, { status: 400 });
    }

    // Get user's AI settings (uses owner's settings for team members)
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

    const prompt = buildPrompt(body);
    const hooks = await generateHooks(prompt, apiKey, provider, model);

    return NextResponse.json({ hooks });
  } catch (error) {
    console.error("Content analyze error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze content" },
      { status: 500 }
    );
  }
}
