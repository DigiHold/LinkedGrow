// Retry wrapper for AI provider HTTP calls.
//
// AI providers return transient errors when their servers are busy - most
// notably Anthropic, which responds with HTTP 529 and the message "Overloaded".
// Those are not real failures: retrying a few seconds later almost always
// succeeds. This wrapper retries retryable statuses with exponential backoff so
// the user never sees a raw "Overloaded" error.

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 529]);

// Models that accept output_config.effort.
//
// Thinking bills as output tokens, and Sonnet 5 and Fable 5 default to "high"
// effort, so leaving it unset makes every BYOK generation cost noticeably more
// than it did before those models turned thinking on. "low" keeps spend and
// latency close to the old no-thinking baseline these short prompts were
// written for, which is what Anthropic recommends for callers migrating from a
// thinking-off model.
//
// The parameter is not universal: Haiku 4.5 and Sonnet 4.5 reject it outright,
// so this is an allowlist rather than a blocklist. An unrecognised or legacy
// model string sends nothing, because a missing effort is only the default
// while a wrong one is a 400.
const EFFORT_CAPABLE_MODELS = [
  "claude-fable-5",
  "claude-mythos-5",
  "claude-opus-4-8",
  "claude-opus-4-7",
  "claude-opus-4-6",
  "claude-opus-4-5",
  "claude-sonnet-5",
  "claude-sonnet-4-6",
];

export function anthropicEffort(model: string): { output_config?: { effort: string } } {
  const supported = EFFORT_CAPABLE_MODELS.some((id) => model.startsWith(id));
  return supported ? { output_config: { effort: "low" } } : {};
}

// Kimi K3 always has thinking mode on and defaults reasoning_effort to "max",
// and its reasoning tokens bill as output at the same rate as the answer, so an
// unconfigured K3 call costs several times what the same prompt costs on K2.6.
// Moonshot documents "low" as the lever for exactly this. Earlier Kimi models do
// not take the field, so this stays an allowlist for the same reason as
// anthropicEffort: an unrecognised model sends nothing rather than risking a 400.
export function kimiReasoningEffort(model: string): { reasoning_effort?: string } {
  return model.startsWith("kimi-k3") ? { reasoning_effort: "low" } : {};
}

// Strip a Perplexity reasoning preamble out of message.content.
//
// Perplexity's reasoning models (sonar-reasoning-pro, sonar-deep-research) open
// their reply with a <think> block holding the chain of thought and only then
// give the real answer, and response_format does not remove it. Left in place it
// breaks JSON.parse on the structured routes and leaks raw reasoning into
// generated posts and comments. A truncated reply can leave the block unclosed,
// which means the answer never arrived, so drop everything from that point.
export function stripReasoningTags(content: string): string {
  let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const unclosed = cleaned.search(/<think>/i);
  if (unclosed !== -1) {
    cleaned = cleaned.slice(0, unclosed);
  }
  return cleaned.trim();
}

interface AnthropicContentBlock {
  type?: string;
  text?: string;
}

// Pull the answer out of an Anthropic /v1/messages response.
//
// Claude Sonnet 5 and Fable 5 run adaptive thinking whenever a request leaves
// the `thinking` field out, so their first content block is a thinking block,
// not the answer. Its text is empty as well, because thinking.display defaults
// to "omitted". Reading content[0].text on those models returns undefined, so
// every generation silently produced an empty string or an empty array with a
// 200 response and no error anywhere. Select the text blocks by type instead of
// trusting their position, which works on thinking and non-thinking models
// alike.
export function extractAnthropicText(data: unknown): string {
  const blocks = (data as { content?: AnthropicContentBlock[] } | null | undefined)?.content;
  if (!Array.isArray(blocks)) return "";

  let text = "";
  for (const block of blocks) {
    if (block?.type === "text" && typeof block.text === "string") {
      text += block.text;
    }
  }
  return text;
}

export async function fetchAIWithRetry(
  url: string,
  init: RequestInit,
  retries = 3
): Promise<Response> {
  let lastStatus = 0;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 1s, 2s, 4s
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
    }

    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (err) {
      // Network-level error - retry, or rethrow on the final attempt
      if (attempt === retries) throw err;
      continue;
    }

    // Success or a non-retryable error (bad key, bad request): hand it straight
    // back so the caller's existing error handling reports the real cause.
    if (!RETRYABLE_STATUS.has(res.status)) return res;

    lastStatus = res.status;
    // Free the connection before the next attempt
    res.body?.cancel().catch(() => {});
  }

  throw new Error(
    lastStatus === 429
      ? "Your AI provider is rate-limiting requests right now. Wait a minute and try again."
      : "Your AI provider is temporarily overloaded. Wait a moment and try again."
  );
}
