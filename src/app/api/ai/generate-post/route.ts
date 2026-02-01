import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decryptApiKey } from "@/lib/encryption";
import { getAISettingsUser } from "@/lib/team-utils";

// Sanitize AI output: remove wrapping quotes, em dashes, and separators
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

  // Remove horizontal separators (---, ===, ___, etc.)
  cleaned = cleaned.replace(/\n-{3,}\n/g, "\n\n");
  cleaned = cleaned.replace(/\n={3,}\n/g, "\n\n");
  cleaned = cleaned.replace(/\n_{3,}\n/g, "\n\n");

  // Fix hook spacing: ensure no empty line between first 2 lines (the hook)
  // Match pattern: short line, empty line, another line that looks like hook continuation
  const lines = cleaned.split("\n");
  if (lines.length >= 3) {
    // Check if first line is short (hook line 1) and second line is empty
    if (lines[0].length > 0 && lines[0].length < 60 && lines[1].trim() === "") {
      // Check if third line looks like hook line 2 (short, no bullet/emoji at start)
      const thirdLine = lines[2];
      if (thirdLine && thirdLine.length < 80 && !thirdLine.match(/^[✅→•\-📌♻️🔔✨]/)) {
        // Remove the empty line between hook lines
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

async function generatePost(
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
  writingTone?: string
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

1. HOOK (First 2 lines - visible before "See more"):
   - Line 1: A POWERFUL one-liner hook (under 100 characters) that stops scrolling
   - Line 2: IMMEDIATELY follows Line 1 with NO EMPTY LINE between them
   - Line 2 creates urgency to click "See more"
   - After the 2-line hook, add ONE empty line, then continue with the body
   - Examples of correct hook format:
     "I mass applied for hundreds of jobs.
Here's the strategy that actually got me hired.

The rest of the post starts here..."
   - NEVER put an empty line between Line 1 and Line 2 of the hook
   - NEVER use --- or === or ___ separators anywhere in the post

2. FORMATTING (LinkedIn-native):
   - NEVER use markdown formatting like **bold** or *italic* - LinkedIn doesn't support it
   - USE Unicode bold characters for section headers (like 𝗧𝗵𝗶𝘀 𝗶𝘀 𝗯𝗼𝗹𝗱)
   - USE emojis strategically: ✅ for list items, ✨ for highlights, 📌 for save CTA, ♻️ for repost CTA, 🔔 for follow CTA
   - USE → arrows for bullet points when listing steps or features
   - Keep lines SHORT (5-10 words max per line)
   - Add whitespace between sections for skimmability
   - NEVER use em dashes or en dashes. Use commas or " - " with spaces instead.

3. STRUCTURE:
   - Start with strong 2-line hook
   - Keep it skimmable with short lines and whitespace
   - Include 1 clear takeaway + 1 framework (steps)
   - End with a CTA like "📌 Save this for later" or "♻️ Repost if this helped"
   - 800-1500 characters total
   - NO hashtags

4. CONTENT:
   - No fluff, no generic advice
   - Be specific and actionable
   - Professional but conversational tone
   - Focus on genuine value${voiceInstructions}${avoidInstructions}

Return ONLY the post text. No quotes, no explanations.`;

  let response;
  let post = "";

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
      requestBody.temperature = 0.8;
    }
    if (isGPT5) {
      requestBody.max_completion_tokens = 4000;
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
        model: model || "claude-sonnet-4-5-20250929",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate post with Anthropic");
    }

    const data = await response.json();
    post = data.content[0]?.text || "";
  } else if (provider === "google") {
    const googleModel = model || "gemini-3-flash-preview";
    const isProModel = googleModel.includes("-pro");

    // Build request body with thinking disabled for Pro models
    const requestBody: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 2000,
      },
    };

    // For Pro models, disable thinking mode to ensure they follow instructions
    if (isProModel) {
      (requestBody.generationConfig as Record<string, unknown>).thinkingConfig = {
        thinkingBudget: 0,
      };
    }

    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate post with Google AI");
    }

    const data = await response.json();
    post = data.candidates[0]?.content?.parts[0]?.text || "";
  } else if (provider === "grok") {
    // xAI Grok uses OpenAI-compatible API
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
  targetAudience?: string
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
- NEVER use em dashes (—) or en dashes (–). Use regular hyphens or commas instead.

Return ONLY a JSON array of 5 strings. Example:
["Idea 1 here", "Idea 2 here", "Idea 3 here", "Idea 4 here", "Idea 5 here"]`;

  let response;
  let ideas: string[] = [];

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
      requestBody.temperature = 0.9;
    }
    if (isGPT5) {
      requestBody.max_completion_tokens = 4000;
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
        model: model || "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate ideas with Anthropic");
    }

    const data = await response.json();
    const content = data.content[0]?.text || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    ideas = JSON.parse(cleanContent);
  } else if (provider === "google") {
    const googleModel = model || "gemini-3-flash-preview";
    const isProModel = googleModel.includes("-pro");

    // Build request body with thinking disabled for Pro models
    const googleRequestBody: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 2000,
      },
    };

    // For Pro models, disable thinking mode to ensure they follow instructions
    if (isProModel) {
      (googleRequestBody.generationConfig as Record<string, unknown>).thinkingConfig = {
        thinkingBudget: 0,
      };
    }

    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googleRequestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate ideas with Google AI");
    }

    const data = await response.json();
    const googleContent = data.candidates[0]?.content?.parts[0]?.text || "[]";
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
        model: model || "grok-4-1-fast-reasoning",
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
  model: string
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

1. Apply the requested changes while keeping the core message
2. Keep it professional and LinkedIn-appropriate

3. FORMATTING:
   - NEVER use markdown (**bold** or *italic*) - LinkedIn doesn't support it
   - USE Unicode bold for headers (like 𝗧𝗵𝗶𝘀 𝗶𝘀 𝗯𝗼𝗹𝗱)
   - USE emojis strategically: ✅ for lists, 📌 for save CTA, ♻️ for repost CTA
   - USE → arrows for bullet points
   - Keep lines SHORT for skimmability
   - NEVER use em dashes or en dashes. Use commas or " - " instead.
   - NO hashtags

4. IF IMPROVING HOOK:
   - Create TWO powerful hooks (first 2 lines)
   - Line 1: Scroll-stopping statement (under 100 characters)
   - Line 2: Teaser that compels clicking "See more"
   - Example: "I failed 47 times before this worked." / "The pattern I finally discovered changes everything."

5. STRUCTURE:
   - End with a CTA like "📌 Save this" or "♻️ Repost if helpful"
   - Keep whitespace for skimmability

Return ONLY the edited post. No quotes, no explanations.`;

  let response;
  let editedPost = "";

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
    if (isGPT5) {
      requestBody.max_completion_tokens = 4000;
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
        model: model || "claude-sonnet-4-5-20250929",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to edit post with Anthropic");
    }

    const data = await response.json();
    editedPost = data.content[0]?.text || "";
  } else if (provider === "google") {
    const googleModel = model || "gemini-3-flash-preview";
    const isProModel = googleModel.includes("-pro");

    // Build request body with thinking disabled for Pro models
    const googleRequestBody: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 2000,
      },
    };

    // For Pro models, disable thinking mode to ensure they follow instructions
    if (isProModel) {
      (googleRequestBody.generationConfig as Record<string, unknown>).thinkingConfig = {
        thinkingBudget: 0,
      };
    }

    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googleRequestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to edit post with Google AI");
    }

    const data = await response.json();
    editedPost = data.candidates[0]?.content?.parts[0]?.text || "";
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

    const body: GeneratePostRequest & { action?: string } = await request.json();
    const { action = "generate", idea, postType, postCategory, topic, content, instruction } = body;

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
    };

    const defaultModel = provider === "openai" ? "o4-mini" :
                         provider === "anthropic" ? "claude-sonnet-4-5-20250929" :
                         provider === "google" ? "gemini-3-flash-preview" :
                         provider === "grok" ? "grok-4-1-fast-reasoning" :
                         provider === "perplexity" ? "sonar-pro" : "o4-mini";
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
        user.targetAudience || undefined
      );
      return NextResponse.json({ ideas });
    }

    if (action === "carousel-prompts") {
      const slideCount = body.slideCount || 5;
      const carouselTopic = topic || idea || "";

      if (!carouselTopic) {
        return NextResponse.json({ error: "Topic is required for carousel generation" }, { status: 400 });
      }

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
- Cliche business imagery (handshakes, globes, generic office scenes)

Return ONLY a valid JSON array. Each object has "title", "content", and "imagePrompt" strings.

[
  {"title": "Why 90% of Leaders Fail", "content": "The answer will surprise you.", "imagePrompt": "Dramatic conceptual photography of a single chess king piece casting a long shadow over fallen pieces, symbolizing leadership isolation. Cinematic lighting with warm amber and cool blue contrast. Shallow depth of field with bokeh background. Composition uses rule of thirds with king in left third, open space on right for text overlay. Moody and thought-provoking atmosphere. LinkedIn carousel slide, business professional aesthetic, ultra high quality, 4K resolution, square 1:1 aspect ratio"},
  {"title": "1. They Stop Listening", "content": "Ego kills growth faster than competition.", "imagePrompt": "Surreal 3D render of a businessman in a sleek suit with headphones that transform into solid concrete blocks around his ears. Soft studio lighting with subtle purple and teal gradient background. Clean minimalist composition, subject centered with breathing room above for text. Modern corporate aesthetic with artistic edge. Metaphorical visual storytelling. LinkedIn carousel slide, premium design quality, ultra high quality, 4K resolution, square 1:1 aspect ratio"},
  {"title": "Follow for More", "content": "Save this post - you will need it.", "imagePrompt": "Elegant flat design illustration of an upward-pointing arrow made of interconnected network nodes and glowing connection lines, representing growth and community. Gradient background transitioning from deep indigo to vibrant cyan. Centered symmetrical composition with ample space for text at top. Inspiring and inviting mood. Clean vector aesthetic with subtle depth. LinkedIn carousel slide, call-to-action design, ultra high quality, 4K resolution, square 1:1 aspect ratio"}
]`;

      let response;
      let slides: CarouselSlide[] = [];

      if (provider === "openai") {
        const openaiModel = model || "o4-mini";
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
        if (isGPT5) {
          requestBody.max_completion_tokens = 8000;
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
            model: model || "claude-sonnet-4-5-20250929",
            max_tokens: 4096,
            messages: [{ role: "user", content: carouselPrompt }],
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || "Failed to generate carousel prompts with Anthropic");
        }

        const data = await response.json();
        const jsonContent = data.content[0]?.text || "[]";
        const cleanContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        slides = JSON.parse(cleanContent);
      } else if (provider === "google") {
        const googleModel = model || "gemini-3-flash-preview";
        const isProModel = googleModel.includes("-pro");

        // Build request body with thinking disabled for Pro models
        const googleRequestBody: Record<string, unknown> = {
          contents: [{ parts: [{ text: carouselPrompt }] }],
          generationConfig: {
            maxOutputTokens: 4000,
          },
        };

        // For Pro models, disable thinking mode to ensure they follow instructions
        if (isProModel) {
          (googleRequestBody.generationConfig as Record<string, unknown>).thinkingConfig = {
            thinkingBudget: 0,
          };
        }

        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(googleRequestBody),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || "Failed to generate carousel prompts with Google AI");
        }

        const data = await response.json();
        const jsonContent = data.candidates[0]?.content?.parts[0]?.text || "[]";
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
            model: model || "grok-4-1-fast-reasoning",
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

      return NextResponse.json({ slides: validatedSlides });
    }

    if (action === "edit") {
      if (!content || !instruction) {
        return NextResponse.json({ error: "Content and instruction are required for editing" }, { status: 400 });
      }
      const editedContent = await editPost(content, instruction, apiKey, provider, model);
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
      user.writingTone || undefined
    );

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Post generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate post" },
      { status: 500 }
    );
  }
}
