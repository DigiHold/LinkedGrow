import type { AgentProvider } from "./ai-client.ts";

/**
 * The agent lineup: which model classifies, which model writes, and what each
 * one costs, per provider.
 *
 * Every price is dollars per million tokens on the vendor's standard tier for
 * prompts under 200k, read on the vendor page named above each entry on
 * 2026-09-02. Nothing here is remembered; a price with no source line does not
 * belong in this table.
 */

export interface ModelPrice { input: number; output: number }
export interface ProviderModels {
  label: string;
  fast: string;
  writer: string;
  /** $ per million tokens, standard tier, prompts under 200k. Read on the vendor page named in the comment on 2026-09-02. */
  prices: Record<string, ModelPrice>;
}

export const AGENT_PROVIDERS: Record<AgentProvider, ProviderModels> = {
  // https://platform.claude.com/docs/en/about-claude/pricing (read 2026-09-02)
  anthropic: {
    label: "Anthropic",
    fast: "claude-haiku-4-5-20251001",
    writer: "claude-sonnet-5",
    prices: {
      "claude-haiku-4-5-20251001": { input: 1, output: 5 },
      "claude-sonnet-5": { input: 2, output: 10 },
      "claude-opus-5": { input: 5, output: 25 },
      "claude-fable-5-1": { input: 10, output: 50 },
      // Legacy ids, still served and still billed.
      "claude-opus-4-8": { input: 5, output: 25 },
      "claude-fable-5": { input: 10, output: 50 },
      "claude-opus-4-7": { input: 5, output: 25 },
      "claude-sonnet-4-6": { input: 3, output: 15 },
    },
  },
  // https://developers.openai.com/api/docs/pricing (read 2026-09-02)
  openai: {
    label: "OpenAI",
    fast: "gpt-5.6-luna",
    writer: "gpt-5.6-terra",
    prices: {
      "gpt-5.6-sol": { input: 4, output: 20 },
      "gpt-5.6-terra": { input: 2, output: 12 },
      "gpt-5.6-luna": { input: 0.2, output: 1.2 },
      // Previous generation.
      "gpt-5.5": { input: 5, output: 30 },
      "gpt-5.4": { input: 2.5, output: 15 },
      "gpt-5.4-mini": { input: 0.75, output: 4.5 },
      "gpt-5.4-nano": { input: 0.2, output: 1.25 },
    },
  },
  // https://ai.google.dev/gemini-api/docs/pricing (read 2026-09-02)
  google: {
    label: "Google",
    fast: "gemini-3.1-flash-lite",
    writer: "gemini-3.7-flash",
    prices: {
      // $0.75 / $3.75 is the launch price until 2026-12-31; the page lists $1.50 / $7.50 after that.
      "gemini-3.7-flash": { input: 0.75, output: 3.75 },
      "gemini-3.6-flash": { input: 0.75, output: 3.75 },
      "gemini-3.5-flash": { input: 1.5, output: 9 },
      "gemini-3.5-flash-lite": { input: 0.3, output: 2.5 },
      "gemini-3.1-pro-preview": { input: 2, output: 12 },
      "gemini-3.1-flash-lite": { input: 0.25, output: 1.5 },
      "gemini-3-flash-preview": { input: 0.5, output: 3 },
      "gemini-2.5-pro": { input: 1.25, output: 10 },
      "gemini-2.5-flash": { input: 0.3, output: 2.5 },
      "gemini-2.5-flash-lite": { input: 0.1, output: 0.4 },
    },
  },
  // https://docs.x.ai/docs/models (read 2026-09-02)
  grok: {
    label: "Grok",
    fast: "grok-4.3",
    writer: "grok-4.6",
    prices: {
      "grok-4.6": { input: 2, output: 6 },
      "grok-4.5": { input: 2, output: 6 },
      "grok-4.3": { input: 1.25, output: 2.5 },
      "grok-4.20-0309-reasoning": { input: 1.25, output: 2.5 },
      "grok-4.20-0309-non-reasoning": { input: 1.25, output: 2.5 },
    },
  },
  // https://platform.kimi.ai/docs/pricing/chat-k3, .../chat-k26 and .../chat-k27-code (read 2026-09-02)
  kimi: {
    label: "Kimi",
    fast: "kimi-k2.6",
    writer: "kimi-k3",
    prices: {
      "kimi-k3": { input: 3, output: 15 },
      "kimi-k2.6": { input: 0.95, output: 4 },
      "kimi-k2.7-code": { input: 0.95, output: 4 },
    },
  },
};

export const AGENT_PROVIDER_IDS = Object.keys(AGENT_PROVIDERS) as AgentProvider[];

export function isAgentProvider(value: string): value is AgentProvider {
  return (AGENT_PROVIDER_IDS as string[]).includes(value);
}

/** Unknown model ids are metered at the provider's most expensive listed price, never at zero. */
export function priceFor(provider: AgentProvider, model: string): ModelPrice {
  const table = AGENT_PROVIDERS[provider].prices;
  const known = table[model];
  if (known) return known;
  return Object.values(table).reduce((a, b) => (b.output > a.output ? b : a));
}
