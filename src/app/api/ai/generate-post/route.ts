import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { decryptApiKey } from "@/lib/encryption";

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

interface GeneratePostRequest {
  idea: string;
  postType?: string;
  postCategory?: string;
  topic?: string;
  content?: string;
  instruction?: string;
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

  const prompt = `Act like a LinkedIn ghostwriter who writes posts that get saved and shared.

Goal: Create a compelling LinkedIn post on this topic.

Topic/Idea: "${idea}"${typeInstructions}${categoryInstructions}${businessContext}

=== CRITICAL RULES ===

1. HOOK (First 2 lines - visible before "See more"):
   - Line 1: A POWERFUL one-liner hook (under 100 characters) that stops scrolling
   - Line 2: A compelling second hook that creates urgency to click "See more"
   - Examples:
     * "I mass applied for hundreds of jobs." / "Here's the strategy that actually got me hired."
     * "Stop networking. Seriously." / "This 3-step system works 10x better."
     * "Most productivity advice is garbage." / "Here's what actually works (after 10 years of testing)."

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
        model: model || "grok-3-mini-beta",
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

  const prompt = `You are an expert LinkedIn content strategist. Generate 5 compelling post ideas about the following topic.

Topic: "${topic || "general professional development"}"
Post style: ${typeDesc}${contextInstructions}

Requirements:
- Each idea should be specific and attention-grabbing
- Ideas should be different angles on the topic
- Make them suitable for LinkedIn's professional audience
- Each idea should be 1-2 sentences max

Return ONLY a JSON array of 5 strings. Example:
["Idea 1 here", "Idea 2 here", "Idea 3 here", "Idea 4 here", "Idea 5 here"]`;

  let response;
  let ideas: string[] = [];

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
        temperature: 0.9,
      }),
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
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate ideas with Google AI");
    }

    const data = await response.json();
    const content = data.candidates[0]?.content?.parts[0]?.text || "[]";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
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
        model: model || "grok-3-mini-beta",
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

  return ideas;
}

async function editPost(
  content: string,
  instruction: string,
  apiKey: string,
  provider: string,
  model: string
): Promise<string> {
  const prompt = `You are an expert LinkedIn content editor. Edit this post according to the instruction.

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
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "gpt-5-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
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
        model: model || "grok-3-mini-beta",
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

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const provider = user.aiProvider || "openai";

    // Get per-provider API key based on selected provider
    const providerKeyMap: Record<string, string | null> = {
      openai: user.openaiApiKey,
      anthropic: user.anthropicApiKey,
      google: user.googleApiKey,
      grok: user.grokApiKey,
      perplexity: user.perplexityApiKey,
    };

    const encryptedApiKey = providerKeyMap[provider];
    if (!encryptedApiKey) {
      return NextResponse.json({ error: `No API key configured for ${provider}. Please add your API key in Settings.` }, { status: 400 });
    }

    const apiKey = decryptApiKey(encryptedApiKey);
    if (!apiKey) {
      return NextResponse.json({ error: "Failed to decrypt API key" }, { status: 500 });
    }

    // Get per-provider model based on selected provider
    const providerModelMap: Record<string, string | null> = {
      openai: user.openaiModel,
      anthropic: user.anthropicModel,
      google: user.googleModel,
      grok: user.grokModel,
      perplexity: user.perplexityModel,
    };

    const defaultModel = provider === "openai" ? "gpt-5-mini" :
                         provider === "anthropic" ? "claude-sonnet-4-5-20250929" :
                         provider === "google" ? "gemini-3-flash-preview" :
                         provider === "grok" ? "grok-3-mini-beta" :
                         provider === "perplexity" ? "sonar-pro" : "gpt-5-mini";
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
