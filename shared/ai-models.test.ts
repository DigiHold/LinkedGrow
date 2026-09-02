import { test } from "node:test";
import assert from "node:assert/strict";
import { AGENT_PROVIDERS, AGENT_PROVIDER_IDS, isAgentProvider, priceFor } from "./ai-models.ts";

test("five providers, each with a fast and a writer model that is priced", () => {
  assert.deepEqual([...AGENT_PROVIDER_IDS].sort(), ["anthropic", "google", "grok", "kimi", "openai"]);
  for (const id of AGENT_PROVIDER_IDS) {
    const p = AGENT_PROVIDERS[id];
    assert.ok(p.prices[p.fast], `${id} fast model ${p.fast} has no price`);
    assert.ok(p.prices[p.writer], `${id} writer model ${p.writer} has no price`);
  }
  assert.equal(isAgentProvider("perplexity"), false);
  assert.equal(isAgentProvider("grok"), true);
});

test("an unknown model is priced at the provider's most expensive output rate", () => {
  const p = priceFor("anthropic", "claude-unknown");
  assert.equal(p.output, 50);
});
