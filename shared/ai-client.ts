/**
 * One chat call, five providers, no dependencies.
 *
 * Both the app and the worker import this file, so it has no imports of its
 * own: the app resolves it through the `@shared/*` alias and the worker through
 * a relative path under `--experimental-strip-types`, and neither wants a
 * vendor SDK for what is one POST and one JSON read per provider.
 *
 * Anthropic and Google have their own request shapes. OpenAI, xAI and Moonshot
 * all speak the OpenAI chat completions shape, which is why three providers
 * share one transport below.
 */

export type AgentProvider = "anthropic" | "openai" | "google" | "grok" | "kimi";
export type ChatMessage = { role: "user" | "assistant"; content: string };
export interface ChatRequest {
  provider: AgentProvider;
  apiKey: string;
  model: string;
  system?: string;
  messages: ChatMessage[];
  maxTokens?: number;
  /** Anthropic only: cache the system prompt across calls. */
  cacheSystem?: boolean;
}
export interface ChatResult { text: string; inputTokens: number; outputTokens: number }
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

const OPENAI_COMPATIBLE: Record<Exclude<AgentProvider, "anthropic" | "google">, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  grok: "https://api.x.ai/v1/chat/completions",
  kimi: "https://api.moonshot.ai/v1/chat/completions",
};

export function requestFor(req: ChatRequest): { url: string; headers: Record<string, string>; body: string } {
  const maxTokens = req.maxTokens ?? 1024;
  if (req.provider === "anthropic") {
    return {
      url: "https://api.anthropic.com/v1/messages",
      headers: { "content-type": "application/json", "x-api-key": req.apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: req.model,
        max_tokens: maxTokens,
        ...(req.system
          ? { system: req.cacheSystem ? [{ type: "text", text: req.system, cache_control: { type: "ephemeral" } }] : req.system }
          : {}),
        messages: req.messages,
      }),
    };
  }
  if (req.provider === "google") {
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(req.model)}:generateContent`,
      headers: { "content-type": "application/json", "x-goog-api-key": req.apiKey },
      body: JSON.stringify({
        ...(req.system ? { systemInstruction: { parts: [{ text: req.system }] } } : {}),
        contents: req.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    };
  }
  // OpenAI's current models reject `max_tokens` and want `max_completion_tokens`;
  // xAI and Moonshot still take the older name.
  const cap = req.provider === "openai" ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens };
  return {
    url: OPENAI_COMPATIBLE[req.provider],
    headers: { "content-type": "application/json", Authorization: `Bearer ${req.apiKey}` },
    body: JSON.stringify({
      model: req.model,
      ...cap,
      messages: [...(req.system ? [{ role: "system", content: req.system }] : []), ...req.messages],
    }),
  };
}

function parse(provider: AgentProvider, data: Record<string, unknown>): ChatResult {
  if (provider === "anthropic") {
    const content = (data.content as { type: string; text?: string }[] | undefined) ?? [];
    const usage = (data.usage as { input_tokens?: number; output_tokens?: number } | undefined) ?? {};
    return { text: content.map((b) => (b.type === "text" ? b.text ?? "" : "")).join("").trim(), inputTokens: usage.input_tokens ?? 0, outputTokens: usage.output_tokens ?? 0 };
  }
  if (provider === "google") {
    const candidates = (data.candidates as { content?: { parts?: { text?: string }[] } }[] | undefined) ?? [];
    const usage = (data.usageMetadata as { promptTokenCount?: number; candidatesTokenCount?: number } | undefined) ?? {};
    return { text: (candidates[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim(), inputTokens: usage.promptTokenCount ?? 0, outputTokens: usage.candidatesTokenCount ?? 0 };
  }
  const choices = (data.choices as { message?: { content?: string | null } }[] | undefined) ?? [];
  const usage = (data.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined) ?? {};
  return { text: (choices[0]?.message?.content ?? "").trim(), inputTokens: usage.prompt_tokens ?? 0, outputTokens: usage.completion_tokens ?? 0 };
}

const RETRYABLE = new Set([429, 500, 502, 503, 529]);

/** One call, three retries with backoff on the busy statuses, never the key in an error message. */
export async function chat(req: ChatRequest, fetchImpl: FetchLike = fetch): Promise<ChatResult> {
  const { url, headers, body } = requestFor(req);
  let lastError = "";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetchImpl(url, { method: "POST", headers, body });
    const text = await response.text();
    if (response.ok) {
      const data = JSON.parse(text) as Record<string, unknown>;
      const result = parse(req.provider, data);
      if (!result.text) throw new Error(`${req.provider} returned an empty answer`);
      return result;
    }
    let message = `${req.provider} answered ${response.status}`;
    try {
      const data = JSON.parse(text) as { error?: { message?: string } | string; message?: string };
      const m = typeof data.error === "string" ? data.error : data.error?.message ?? data.message;
      if (m) message = `${message}: ${m}`;
    } catch {
      // not JSON, keep the status
    }
    lastError = message.split(req.apiKey).join("[key]");
    if (!RETRYABLE.has(response.status)) throw new Error(lastError);
    await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
  }
  throw new Error(lastError);
}
