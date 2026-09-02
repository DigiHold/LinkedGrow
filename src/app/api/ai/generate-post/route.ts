import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { getAISettingsUser } from "@/lib/team-utils";
import { checkAIRateLimit } from "@/lib/rate-limit";
import { anthropicEffort, extractAnthropicText, stripReasoningTags , kimiReasoningEffort} from "@/lib/ai-fetch";
import { buildLanguageInstruction } from "@/lib/content-languages";
import { checkGenerationLimit, incrementGenerationUsage } from "@/lib/generation-usage";
import { HOOK_RULES, POST_STYLE_RULES, stripSlop } from "@/lib/post-style";
import { effectivePlan } from "@/lib/plans";

export const maxDuration = 120;

/**
 * What actually leaves this route, whatever the model returned.
 *
 * The prompt asks for a post with none of the machine-written markers on it and
 * the model mostly complies, but "mostly" is not good enough when the cost of a
 * miss is a customer's post being reported and buried. `stripSlop` removes the
 * emoji, the Unicode bold, the bullet symbols, the separators and the closing
 * engagement bait unconditionally.
 */
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

  cleaned = stripSlop(cleaned);

  // The opening two lines run together, with no blank line between them: that
  // is how the hook renders before "See more".
  const lines = cleaned.split("\n");
  if (lines.length >= 3) {
    const first = lines[0] ?? "";
    const third = lines[2] ?? "";
    if (first.length > 0 && first.length < 60 && (lines[1] ?? "").trim() === "") {
      if (third && third.length < 80) {
        lines.splice(1, 1);
        cleaned = lines.join("\n");
      }
    }
  }

  return cleaned;
}

interface GeneratePostRequest {
  idea: string;
  postType?: string;
  postCategory?: string;
  topic?: string;
  content?: string;
  instruction?: string;
  slideCount?: number;
}

interface CarouselSlide {
  title: string;
  content: string;
  imagePrompt: string;
}

// Exported so the MCP server can produce a draft through exactly the same
// path as the dashboard, rather than a second copy of the provider logic
// that would drift.
export async function generatePost(
  idea: string,
  apiKey: string,
  provider: string,
  model: string,
  postType?: string,
  postCategory?: string,
  samplePosts?: string[],
  neverMention?: string,
  businessDescription?: string,
  targetAudience?: string,
  writingTone?: string,
  contentLanguage?: string
): Promise<string> {
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

  // Build post type instructions
  let typeInstructions = "";
  if (postType) {
    const typeDescriptions: Record<string, string> = {
      actionable: "Focus on practical tips, how-tos, and actionable advice readers can implement immediately. Include a clear framework or steps.",
      inspiring: "Create an inspiring, motivational post with storytelling elements. Share a personal lesson or transformation.",
      introspective: "Write a reflective, personal post sharing lessons learned and insights. Be vulnerable and authentic.",
      promotional: "Showcase work, achievements, or expertise in a humble, value-first way. Lead with value, not the pitch.",
    };
    typeInstructions = typeDescriptions[postType] ? `\nPost style: ${typeDescriptions[postType]}` : "";
  }

  // Build category instructions
  let categoryInstructions = "";
  if (postCategory && postCategory !== "auto") {
    const categoryDescriptions: Record<string, string> = {
      explanation: "Explain a concept or process clearly with a simple framework",
      "best-practices": "Share best practices and proven methods in a listicle format",
      advice: "Give striking, memorable advice with one clear takeaway",
      list: "Use a list format with numbered points or bullet points",
      resources: "Share valuable resources, tools, or recommendations",
    };
    categoryInstructions = categoryDescriptions[postCategory] ? `\nFormat: ${categoryDescriptions[postCategory]}` : "";
  }

  // Get current year for accurate data
  const currentYear = new Date().getFullYear();

  const prompt = `Act like a LinkedIn ghostwriter who writes posts that get saved and shared.

Goal: Create a compelling LinkedIn post on this topic.

Topic/Idea: "${idea}"${typeInstructions}${categoryInstructions}${businessContext}

=== IMPORTANT: CURRENT DATE IS ${currentYear} ===
- NEVER mention outdated tools, models, or statistics from previous years
- If mentioning AI models or tools, use YOUR OWN current knowledge to cite the latest accurate names and versions as of ${currentYear}
- Do NOT use old model names like "GPT-4", "Claude 3", "Gemini 1.5" etc. - only use the latest current models you know exist
- If mentioning statistics, use generic phrasing like "studies show" instead of citing potentially outdated data
- When in doubt about specific facts, use general principles instead of potentially outdated specifics
- NEVER guess version numbers, release dates, or technical specifications you're unsure about

=== CRITICAL RULES ===

${HOOK_RULES}

After the two opening lines, one blank line, then the body.

${POST_STYLE_RULES}

=== SHAPE ===
- 800 to 1500 characters.
- Paragraphs separated by blank lines, each paragraph two to four sentences.
- One clear takeaway. If there are steps, write them as sentences in a
  paragraph, not as a decorated list.
- Stop when the point is made.${voiceInstructions}${avoidInstructions}${buildLanguageInstruction(contentLanguage)}

Return ONLY the post text. No quotes, no explanations.`;

  let response;
  let post = "";

  if (provider === "openai") {
    const openaiModel = model || "gpt-5.4-mini";
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
      requestBody.temperature = 0.8;
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
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate post with OpenAI");
    }

    const data = await response.json();
    post = data.choices[0]?.message?.content || "";
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
        // Thinking tokens count against max_tokens on Sonnet 5 and Fable 5, so
        // this has to leave room for the reasoning and the answer together.
        max_tokens: 8000,
        ...anthropicEffort(model || "claude-sonnet-5"),
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate post with Anthropic");
    }

    const data = await response.json();
    post = extractAnthropicText(data);
  } else if (provider === "google") {
    const googleModel = model || "gemini-3-flash-preview";
    const isProModel = googleModel.includes("-pro");

    // Build request body - Pro models need higher maxOutputTokens
    const requestBody: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: isProModel ? 8000 : 2000,
      },
    };

    // For Pro models, set minimal thinking budget to reduce reasoning overhead
    // Pro models require thinking mode, so we use the minimum budget (1024 tokens)
    if (isProModel) {
      (requestBody.generationConfig as Record<string, unknown>).thinkingConfig = {
        thinkingBudget: 1024,
      };
    }

    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate post with Google AI");
    }

    const data = await response.json();
    // For Pro models with thinking enabled, find the last text part (thinking parts come first)
    const parts = data.candidates?.[0]?.content?.parts || [];
    post = "";
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i]?.text) {
        post = parts[i].text;
        break;
      }
    }
  } else if (provider === "grok") {
    // xAI Grok uses OpenAI-compatible API
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
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate post with Grok");
    }

    const data = await response.json();
    post = data.choices[0]?.message?.content || "";
  } else if (provider === "perplexity") {
    // Perplexity uses OpenAI-compatible API
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
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate post with Perplexity");
    }

    const data = await response.json();
    post = stripReasoningTags(data.choices[0]?.message?.content || "") || "";
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
        ...kimiReasoningEffort(model || "kimi-k2.6"),
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate post with Kimi");
    }

    const data = await response.json();
    post = data.choices[0]?.message?.content || "";
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  return sanitizeAIOutput(post);
}

async function generateIdeas(
  topic: string,
  postType: string,
  apiKey: string,
  provider: string,
  model: string,
  businessDescription?: string,
  targetAudience?: string,
  contentLanguage?: string
): Promise<string[]> {
  let contextInstructions = "";
  if (businessDescription) {
    contextInstructions += `\n\nAbout the author: ${businessDescription}`;
  }
  if (targetAudience) {
    contextInstructions += `\nTarget audience: ${targetAudience}`;
  }

  const typeDescriptions: Record<string, string> = {
    actionable: "practical tips and how-tos",
    inspiring: "inspiring stories and motivation",
    introspective: "personal lessons and reflections",
    promotional: "showcasing expertise and achievements",
  };
  const typeDesc = typeDescriptions[postType] || "engaging content";

  // Get current year for accurate data
  const currentYear = new Date().getFullYear();

  const prompt = `You are an expert LinkedIn content strategist. Generate 5 compelling post ideas about the following topic.

IMPORTANT: Current year is ${currentYear}. Never reference outdated tools, models, or data. If mentioning AI models, use YOUR OWN current knowledge to cite accurate latest model names - never use old names like GPT-4, Claude 3, etc.

Topic: "${topic || "general professional development"}"
Post style: ${typeDesc}${contextInstructions}

Requirements:
- Each idea should be specific and attention-grabbing
- Ideas should be different angles on the topic
- Make them suitable for LinkedIn's professional audience
- Each idea should be 1-2 sentences max
- NEVER use em dashes (—) or en dashes (–). Use regular hyphens or commas instead.${buildLanguageInstruction(contentLanguage)}

Return ONLY a JSON array of 5 strings. Example:
["Idea 1 here", "Idea 2 here", "Idea 3 here", "Idea 4 here", "Idea 5 here"]`;

  let response;
  let ideas: string[] = [];

  if (provider === "openai") {
    const openaiModel = model || "gpt-5.4-mini";
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
      requestBody.temperature = 0.9;
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
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate ideas with OpenAI");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    ideas = JSON.parse(cleanContent);
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
        // Thinking tokens count against max_tokens on Sonnet 5 and Fable 5, so
        // this has to leave room for the reasoning and the answer together.
        max_tokens: 8000,
        ...anthropicEffort(model || "claude-sonnet-5"),
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate ideas with Anthropic");
    }

    const data = await response.json();
    const content = extractAnthropicText(data) || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    ideas = JSON.parse(cleanContent);
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

    // For Pro models, set minimal thinking budget
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
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate ideas with Google AI");
    }

    const data = await response.json();
    // For Pro models with thinking enabled, find the last text part (thinking parts come first)
    const gParts = data.candidates?.[0]?.content?.parts || [];
    let googleContent = "[]";
    for (let i = gParts.length - 1; i >= 0; i--) {
      if (gParts[i]?.text) {
        googleContent = gParts[i].text;
        break;
      }
    }
    const cleanContent = googleContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    ideas = JSON.parse(cleanContent);
  } else if (provider === "grok") {
    // xAI Grok uses OpenAI-compatible API
    response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "grok-4.3",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate ideas with Grok");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    ideas = JSON.parse(cleanContent);
  } else if (provider === "perplexity") {
    // Perplexity uses OpenAI-compatible API
    response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "sonar-pro",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate ideas with Perplexity");
    }

    const data = await response.json();
    const content = stripReasoningTags(data.choices[0]?.message?.content || "") || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    ideas = JSON.parse(cleanContent);
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
        ...kimiReasoningEffort(model || "kimi-k2.6"),
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate ideas with Kimi");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    ideas = JSON.parse(cleanContent);
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  // Sanitize each idea to remove em dashes
  return ideas.map((idea: string) => sanitizeAIOutput(idea));
}

async function editPost(
  content: string,
  instruction: string,
  apiKey: string,
  provider: string,
  model: string,
  contentLanguage?: string
): Promise<string> {
  // Get current year for accurate data
  const currentYear = new Date().getFullYear();

  const prompt = `You are an expert LinkedIn content editor. Edit this post according to the instruction.

IMPORTANT: Current year is ${currentYear}. Never reference outdated tools, models, or data. If the post mentions AI, use YOUR OWN current knowledge to cite accurate latest model names - never use old names like GPT-4, Claude 3, etc.

=== CURRENT POST ===
${content}
=== END POST ===

Instruction: "${instruction}"

=== EDITING RULES ===

1. Apply the requested change and leave everything else alone. The person asked
   for one thing; rewriting the rest is not helping.
2. Keep the core message and the author's own voice.

${POST_STYLE_RULES}

${HOOK_RULES}${buildLanguageInstruction(contentLanguage)}

Return ONLY the edited post. No quotes, no explanations.`;

  let response;
  let editedPost = "";

  if (provider === "openai") {
    const openaiModel = model || "gpt-5.4-mini";
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
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to edit post with OpenAI");
    }

    const data = await response.json();
    editedPost = data.choices[0]?.message?.content || "";
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
        // Thinking tokens count against max_tokens on Sonnet 5 and Fable 5, so
        // this has to leave room for the reasoning and the answer together.
        max_tokens: 8000,
        ...anthropicEffort(model || "claude-sonnet-5"),
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to edit post with Anthropic");
    }

    const data = await response.json();
    editedPost = extractAnthropicText(data);
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

    // For Pro models, set minimal thinking budget
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
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to edit post with Google AI");
    }

    const data = await response.json();
    // For Pro models with thinking enabled, find the last text part (thinking parts come first)
    const editParts = data.candidates?.[0]?.content?.parts || [];
    editedPost = "";
    for (let i = editParts.length - 1; i >= 0; i--) {
      if (editParts[i]?.text) {
        editedPost = editParts[i].text;
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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to edit post with Grok");
    }

    const data = await response.json();
    editedPost = data.choices[0]?.message?.content || "";
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
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to edit post with Perplexity");
    }

    const data = await response.json();
    editedPost = stripReasoningTags(data.choices[0]?.message?.content || "") || "";
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
        ...kimiReasoningEffort(model || "kimi-k2.6"),
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to edit post with Kimi");
    }

    const data = await response.json();
    editedPost = data.choices[0]?.message?.content || "";
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  return sanitizeAIOutput(editedPost);
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

    const body: GeneratePostRequest & { action?: string } = await request.json();
    const { action = "generate", idea, postType, postCategory, topic, content, instruction } = body;

    // Free plan: one count per "post cycle" - the click on "Generate 5 ideas"
    // (action === "ideas"). The follow-up post generation from a chosen idea
    // (action === "generate") and refinements (action === "edit") do NOT count;
    // they're part of the same cycle. Carousel is Business-only so irrelevant.
    const countableAction = action === "ideas";
    const userPlan = effectivePlan({ plan: session.user.plan, isAdmin: session.user.isAdmin });
    let limitCheck: Awaited<ReturnType<typeof checkGenerationLimit>> | null = null;
    if (countableAction) {
      limitCheck = await checkGenerationLimit(session.user.id, userPlan);
      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: "You've used all 3 free generations this month. Upgrade to Starter for unlimited posts.",
            limitReached: true,
            used: limitCheck.used,
            limit: limitCheck.limit,
            remaining: 0,
          },
          { status: 403 }
        );
      }
    }

    // Get user and AI settings (uses team owner's settings if user is a team member)
    const result = await getAISettingsUser(session.user.id);

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { user, aiSettingsUser } = result;

    const provider = aiSettingsUser.aiProvider || "openai";

    // Get per-provider API key based on selected provider (from owner if team member)
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

    // Get per-provider model based on selected provider (from owner if team member)
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

    let samplePosts: string[] | undefined;
    if (user.samplePosts) {
      try {
        samplePosts = JSON.parse(user.samplePosts);
      } catch {
        samplePosts = undefined;
      }
    }

    if (action === "ideas") {
      const ideas = await generateIdeas(
        topic || "",
        postType || "actionable",
        apiKey,
        provider,
        model,
        user.businessDescription || undefined,
        user.targetAudience || undefined,
        user.contentLanguage || undefined
      );
      // Count this generation against the monthly limit.
      await incrementGenerationUsage(session.user.id);
      const remaining = limitCheck && limitCheck.limit !== -1
        ? Math.max(0, limitCheck.limit - (limitCheck.used + 1))
        : -1;
      return NextResponse.json({ ideas, remaining });
    }

    if (action === "carousel-prompts") {
      const carouselTopic = topic || idea || "";
      if (!carouselTopic) {
        return NextResponse.json({ error: "Topic is required for carousel generation" }, { status: 400 });
      }
      const validatedSlides = await generateCarouselSlides(
        carouselTopic,
        apiKey,
        provider,
        model,
        body.slideCount || 5,
        user.contentLanguage
      );
      return NextResponse.json({ slides: validatedSlides });
    }

    if (action === "edit") {
      if (!content || !instruction) {
        return NextResponse.json({ error: "Content and instruction are required for editing" }, { status: 400 });
      }
      const editedContent = await editPost(content, instruction, apiKey, provider, model, user.contentLanguage || undefined);
      return NextResponse.json({ content: editedContent });
    }

    if (!idea) {
      return NextResponse.json({ error: "Idea is required" }, { status: 400 });
    }

    const post = await generatePost(
      idea,
      apiKey,
      provider,
      model,
      postType,
      postCategory,
      samplePosts,
      user.neverMention || undefined,
      user.businessDescription || undefined,
      user.targetAudience || undefined,
      user.writingTone || undefined,
      user.contentLanguage || undefined
    );

    // "generate" does not increment the counter - it's part of the same cycle
    // as the preceding "ideas" click which already counted.
    return NextResponse.json({ post });
  } catch (error) {
return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate post" },
      { status: 500 }
    );
  }
}

/**
 * The carousel slide planner, lifted out of the route so the MCP server can
 * ask for a carousel with the same prompt and the same provider handling the
 * dashboard uses. Callers own auth, plan and rate limiting.
 */
export async function generateCarouselSlides(
  carouselTopic: string,
  apiKey: string,
  provider: string,
  model: string,
  slideCount: number,
  contentLanguage?: string | null
): Promise<CarouselSlide[]> {

    const carouselPrompt = `You are a world-class visual storyteller and LinkedIn content expert. Create a ${slideCount}-slide carousel that will stop scrollers and drive engagement.

Topic: "${carouselTopic}"

For each slide, generate:
1. TITLE: Punchy headline (3-8 words) that creates curiosity or delivers value
2. CONTENT: One powerful sentence that complements the title
3. IMAGE PROMPT: A highly detailed, specific prompt for AI image generation

=== CRITICAL IMAGE PROMPT REQUIREMENTS ===

Your image prompts must be 60-100 words each and include ALL of these elements:

1. PRIMARY SUBJECT: Describe a specific, evocative scene or visual metaphor that represents the slide's concept. Be creative - think like a professional art director.

2. VISUAL STYLE: Choose from photorealistic, 3D render, flat illustration, isometric design, or cinematic photography

3. LIGHTING & MOOD: Specify lighting (soft diffused, dramatic rim light, golden hour, studio lighting) and emotional tone (inspiring, powerful, calm, energetic)

4. COLOR PALETTE: Name 2-3 specific colors that work harmoniously (avoid pure black backgrounds for LinkedIn)

5. COMPOSITION: Describe framing (centered, rule of thirds, dynamic diagonal), depth of field, and negative space for text overlay areas

6. PROFESSIONAL CONTEXT: Include "LinkedIn carousel slide", "business professional aesthetic", "high-end corporate design"

7. TECHNICAL SPECS: End with "ultra high quality, 4K resolution, square 1:1 aspect ratio"

=== SLIDE STRUCTURE ===

- SLIDE 1 (Hook): Create intrigue. Use a bold statement, surprising statistic, or provocative question
- SLIDES 2-${slideCount - 1} (Value): Each slide = one powerful insight. Build narrative momentum
- SLIDE ${slideCount} (CTA): Drive action - follow, save, share, comment. Make it feel rewarding

=== AVOID ===
- Generic stock photo descriptions
- Em dashes (use commas or " - " instead)
- Text-heavy image prompts - the AI will generate visuals, text overlays come separately
- Cliche business imagery (handshakes, globes, generic office scenes)${buildLanguageInstruction(contentLanguage)}

Return ONLY a valid JSON array. Each object has "title", "content", and "imagePrompt" strings.

[
{"title": "Why 90% of Leaders Fail", "content": "The answer will surprise you.", "imagePrompt": "Dramatic conceptual photography of a single chess king piece casting a long shadow over fallen pieces, symbolizing leadership isolation. Cinematic lighting with warm amber and cool blue contrast. Shallow depth of field with bokeh background. Composition uses rule of thirds with king in left third, open space on right for text overlay. Moody and thought-provoking atmosphere. LinkedIn carousel slide, business professional aesthetic, ultra high quality, 4K resolution, square 1:1 aspect ratio"},
{"title": "1. They Stop Listening", "content": "Ego kills growth faster than competition.", "imagePrompt": "Surreal 3D render of a businessman in a sleek suit with headphones that transform into solid concrete blocks around his ears. Soft studio lighting with subtle purple and teal gradient background. Clean minimalist composition, subject centered with breathing room above for text. Modern corporate aesthetic with artistic edge. Metaphorical visual storytelling. LinkedIn carousel slide, premium design quality, ultra high quality, 4K resolution, square 1:1 aspect ratio"},
{"title": "Follow for More", "content": "Save this post - you will need it.", "imagePrompt": "Elegant flat design illustration of an upward-pointing arrow made of interconnected network nodes and glowing connection lines, representing growth and community. Gradient background transitioning from deep indigo to vibrant cyan. Centered symmetrical composition with ample space for text at top. Inspiring and inviting mood. Clean vector aesthetic with subtle depth. LinkedIn carousel slide, call-to-action design, ultra high quality, 4K resolution, square 1:1 aspect ratio"}
]`;

    let response;
    let slides: CarouselSlide[] = [];

    if (provider === "openai") {
      const openaiModel = model || "gpt-5.4-mini";
      const isOSeries = openaiModel.startsWith("o3") || openaiModel.startsWith("o4");
      const isGPT5 = openaiModel.startsWith("gpt-5");

      // O-series and GPT-5 models don't support temperature parameter
      // GPT-5 models use max_completion_tokens instead of max_tokens
      // GPT-5 models need reasoning_effort set to low to ensure they return content
      const requestBody: Record<string, unknown> = {
        model: openaiModel,
        messages: [{ role: "user", content: carouselPrompt }],
      };
      if (!isOSeries && !isGPT5) {
        requestBody.temperature = 0.8;
      }
      // O-series and GPT-5 require max_completion_tokens
      if (isOSeries || isGPT5) {
        requestBody.max_completion_tokens = 8000;
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
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to generate carousel prompts with OpenAI");
      }

      const data = await response.json();
      const jsonContent = data.choices[0]?.message?.content || "[]";
      const cleanContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      slides = JSON.parse(cleanContent);
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
          // Thinking tokens count against max_tokens on Sonnet 5 and Fable 5,
          // so this has to leave room for the reasoning and the answer.
          max_tokens: 16000,
          ...anthropicEffort(model || "claude-sonnet-5"),
          messages: [{ role: "user", content: carouselPrompt }],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to generate carousel prompts with Anthropic");
      }

      const data = await response.json();
      const jsonContent = extractAnthropicText(data) || "[]";
      const cleanContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      slides = JSON.parse(cleanContent);
    } else if (provider === "google") {
      const googleModel = model || "gemini-3-flash-preview";
      const isProModel = googleModel.includes("-pro");

      // Build request body - Pro models need higher maxOutputTokens
      const googleRequestBody: Record<string, unknown> = {
        contents: [{ parts: [{ text: carouselPrompt }] }],
        generationConfig: {
          maxOutputTokens: isProModel ? 16000 : 4000,
        },
      };

      // For Pro models, set minimal thinking budget
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
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to generate carousel prompts with Google AI");
      }

      const data = await response.json();
      // For Pro models with thinking enabled, find the last text part (thinking parts come first)
      const carouselParts = data.candidates?.[0]?.content?.parts || [];
      let jsonContent = "[]";
      for (let i = carouselParts.length - 1; i >= 0; i--) {
        if (carouselParts[i]?.text) {
          jsonContent = carouselParts[i].text;
          break;
        }
      }
      const cleanContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      slides = JSON.parse(cleanContent);
    } else if (provider === "grok") {
      response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || "grok-4.3",
          messages: [{ role: "user", content: carouselPrompt }],
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to generate carousel prompts with Grok");
      }

      const data = await response.json();
      const jsonContent = data.choices[0]?.message?.content || "[]";
      const cleanContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      slides = JSON.parse(cleanContent);
    } else if (provider === "perplexity") {
      response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || "sonar-pro",
          messages: [{ role: "user", content: carouselPrompt }],
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to generate carousel prompts with Perplexity");
      }

      const data = await response.json();
      const jsonContent = stripReasoningTags(data.choices[0]?.message?.content || "") || "[]";
      const cleanContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      slides = JSON.parse(cleanContent);
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
          ...kimiReasoningEffort(model || "kimi-k2.6"),
          messages: [{ role: "user", content: carouselPrompt }],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to generate carousel prompts with Kimi");
      }

      const data = await response.json();
      const jsonContent = data.choices[0]?.message?.content || "[]";
      const cleanContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      slides = JSON.parse(cleanContent);
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }

    // Validate slides
    if (!Array.isArray(slides) || slides.length === 0) {
      throw new Error("Invalid response format from AI");
    }

    const validatedSlides = slides.map(slide => ({
      title: String(slide.title || ""),
      content: String(slide.content || ""),
      imagePrompt: String(slide.imagePrompt || ""),
    }));

    return validatedSlides;
}
