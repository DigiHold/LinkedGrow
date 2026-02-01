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

// Generate hooks from Reddit post using AI
async function generateHooks(
  trimmedJson: TrimmedRedditJson,
  apiKey: string,
  provider: string,
  model: string
): Promise<string[]> {
  // Get current year for accurate data
  const currentYear = new Date().getFullYear();

  const prompt = `I will give you a viral Reddit post:

TITLE: ${trimmedJson.post.title}

CONTENT: ${trimmedJson.post.selftext}

TOP COMMENTS: ${trimmedJson.comments.slice(0, 10).map(c => c.body).join('\n---\n')}

Your task: Create 5 viral LinkedIn hooks based on THIS SPECIFIC POST.

CRITICAL: The hooks must be about the ACTUAL content. Extract the key insight, story, advice, or controversial take from the post. Use specific details (numbers, names, timeframes, job titles, etc.) from the content. DO NOT generate generic hooks.

Adapt to the content type:
- Personal story? Capture the journey, transformation, specific numbers
- Advice post? Extract the contrarian or surprising insight
- Question/Discussion? Turn the most interesting angle into a hook
- Tutorial/How-to? Lead with the surprising result or counterintuitive method

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
- Be SPECIFIC - use actual details, numbers, facts from the post
- Sound human and authentic
- If the post has a personal element, write hooks in first person

Return ONLY a JSON array of 5 strings (each string has 2 lines separated by \\n):
["Line1\\nLine2", "Line1\\nLine2", "Line1\\nLine2", "Line1\\nLine2", "Line1\\nLine2"]`;

  let response;
  let hooks: string[] = [];

  if (provider === "openai") {
    const openaiModel = model || "o4-mini";
    const isOSeries = openaiModel.startsWith("o3") || openaiModel.startsWith("o4");
    const isGPT5 = openaiModel.startsWith("gpt-5");

    // O-series and GPT-5 models don't support temperature parameter
    // O-series and GPT-5 models require max_completion_tokens instead of max_tokens
    const requestBody: Record<string, unknown> = {
      model: openaiModel,
      messages: [{ role: "user", content: prompt }],
    };
    if (!isOSeries && !isGPT5) {
      requestBody.temperature = 0.8;
    }
    // O-series and GPT-5 require max_completion_tokens
    if (isOSeries || isGPT5) {
      requestBody.max_completion_tokens = 2048;
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
      console.error("[Reddit Analyze] OpenAI error:", response.status, errorData);
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    console.log("[Reddit Analyze] OpenAI raw response:", content.substring(0, 200));
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
      hooks = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("[Reddit Analyze] Failed to parse OpenAI response:", cleanContent);
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
        model: model || "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Reddit Analyze] Anthropic error:", response.status, errorData);
      throw new Error(errorData.error?.message || `Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || "[]";
    console.log("[Reddit Analyze] Anthropic raw response:", content.substring(0, 200));
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
      hooks = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("[Reddit Analyze] Failed to parse Anthropic response:", cleanContent);
      throw new Error("AI returned invalid JSON. Please try again.");
    }
  } else if (provider === "google") {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-3-flash-preview"}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Reddit Analyze] Google AI error:", response.status, errorData);
      throw new Error(errorData.error?.message || `Google AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates[0]?.content?.parts[0]?.text || "[]";
    console.log("[Reddit Analyze] Google raw response:", content.substring(0, 200));
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
      hooks = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("[Reddit Analyze] Failed to parse Google response:", cleanContent);
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
      console.error("[Reddit Analyze] Grok error:", response.status, errorData);
      throw new Error(errorData.error?.message || `Grok API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    console.log("[Reddit Analyze] Grok raw response:", content.substring(0, 200));
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
      hooks = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("[Reddit Analyze] Failed to parse Grok response:", cleanContent);
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
      console.error("[Reddit Analyze] Perplexity error:", response.status, errorData);
      throw new Error(errorData.error?.message || `Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    console.log("[Reddit Analyze] Perplexity raw response:", content.substring(0, 200));
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
      hooks = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("[Reddit Analyze] Failed to parse Perplexity response:", cleanContent);
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

    // Accept trimmed Reddit JSON data
    const { trimmedJson } = await request.json();

    if (!trimmedJson || !trimmedJson.post) {
      return NextResponse.json({ error: "No Reddit data provided" }, { status: 400 });
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

    const defaultModel = provider === "openai" ? "o4-mini" :
                         provider === "anthropic" ? "claude-sonnet-4-5-20250929" :
                         provider === "google" ? "gemini-3-flash-preview" :
                         provider === "grok" ? "grok-4-1-fast-reasoning" :
                         provider === "perplexity" ? "sonar-pro" : "o4-mini";
    const model = providerModelMap[provider] || defaultModel;

    console.log("[Reddit Analyze] Generating hooks with provider:", provider, "model:", model);
    console.log("[Reddit Analyze] Post title:", trimmedJson.post?.title);
    console.log("[Reddit Analyze] Post selftext length:", trimmedJson.post?.selftext?.length || 0);
    console.log("[Reddit Analyze] Comments count:", trimmedJson.comments?.length || 0);

    let hooks: string[];
    try {
      hooks = await generateHooks(
        trimmedJson,
        apiKey,
        provider,
        model
      );
    } catch (genError) {
      console.error("[Reddit Analyze] generateHooks threw error:", genError);
      throw genError;
    }

    console.log("[Reddit Analyze] Generated hooks count:", hooks.length);
    console.log("[Reddit Analyze] Hooks preview:", hooks.slice(0, 2));

    return NextResponse.json({ hooks });
  } catch (error) {
    console.error("Reddit analyze error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze Reddit post" },
      { status: 500 }
    );
  }
}
