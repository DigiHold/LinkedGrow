import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { decryptApiKey } from "@/lib/encryption";

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
  let voiceInstructions = "";
  if (samplePosts && samplePosts.length > 0) {
    voiceInstructions = `\n\nIMPORTANT - Match the writing style from these sample posts:\n${samplePosts.map((p, i) => `Sample ${i + 1}: ${p.substring(0, 500)}`).join("\n\n")}`;
  }

  let contextInstructions = "";
  if (businessDescription) {
    contextInstructions += `\n\nAbout the author: ${businessDescription}`;
  }
  if (targetAudience) {
    contextInstructions += `\nTarget audience: ${targetAudience}`;
  }
  if (writingTone) {
    contextInstructions += `\nWriting tone: ${writingTone}`;
  }

  let avoidInstructions = "";
  if (neverMention) {
    avoidInstructions = `\n\nNEVER mention or reference: ${neverMention}`;
  }

  let typeInstructions = "";
  if (postType) {
    const typeDescriptions: Record<string, string> = {
      actionable: "Focus on practical tips, how-tos, and actionable advice readers can implement immediately",
      inspiring: "Create an inspiring, motivational post with storytelling elements",
      introspective: "Write a reflective, personal post sharing lessons learned and insights",
      promotional: "Showcase work, achievements, or expertise in a humble, value-first way",
    };
    typeInstructions = typeDescriptions[postType] ? `\nPost style: ${typeDescriptions[postType]}` : "";
  }

  let categoryInstructions = "";
  if (postCategory && postCategory !== "auto") {
    const categoryDescriptions: Record<string, string> = {
      explanation: "Explain a concept or process clearly",
      "best-practices": "Share best practices and proven methods",
      advice: "Give striking, memorable advice",
      list: "Use a list format with numbered points or bullets",
      resources: "Share valuable resources, tools, or recommendations",
    };
    categoryInstructions = categoryDescriptions[postCategory] ? `\nFormat: ${categoryDescriptions[postCategory]}` : "";
  }

  const prompt = `You are an expert LinkedIn content creator. Generate a compelling LinkedIn post based on the following idea.

Idea: "${idea}"${typeInstructions}${categoryInstructions}${contextInstructions}

Requirements:
1. Create a post between 800-1500 characters
2. Start with a strong, attention-grabbing hook (first 2 lines are crucial)
3. Use short paragraphs and line breaks for readability
4. Include a call-to-action at the end (ask a question or encourage engagement)
5. Make it professional but conversational
6. Do NOT use hashtags
7. Limit emoji usage - maximum 1-2 per post if any
8. Focus on providing genuine value${voiceInstructions}${avoidInstructions}

Return ONLY the post text, nothing else.`;

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

  return post.trim();
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
  const prompt = `You are an expert LinkedIn content editor. Edit the following LinkedIn post according to the user's instruction.

Current post:
"""
${content}
"""

User instruction: "${instruction}"

Requirements:
1. Apply the user's requested changes while maintaining the post's core message
2. Keep the post professional and suitable for LinkedIn
3. Maintain good formatting with line breaks for readability
4. Do NOT use hashtags
5. Limit emoji usage - maximum 1-2 per post if any

Return ONLY the edited post text, nothing else.`;

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

  return editedPost.trim();
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
