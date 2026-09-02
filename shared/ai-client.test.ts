import { test } from "node:test";
import assert from "node:assert/strict";
import { chat, requestFor } from "./ai-client.ts";

test("request shapes per transport", () => {
  const a = requestFor({ provider: "anthropic", apiKey: "k", model: "m", system: "s", messages: [{ role: "user", content: "hi" }], maxTokens: 10 });
  assert.equal(a.url, "https://api.anthropic.com/v1/messages");
  assert.equal(a.headers["x-api-key"], "k");
  assert.equal(a.headers["anthropic-version"], "2023-06-01");
  const o = requestFor({ provider: "openai", apiKey: "k", model: "m", messages: [{ role: "user", content: "hi" }] });
  assert.equal(o.url, "https://api.openai.com/v1/chat/completions");
  assert.equal(o.headers.Authorization, "Bearer k");
  assert.equal(JSON.parse(o.body).max_completion_tokens, 1024);
  assert.equal(JSON.parse(o.body).max_tokens, undefined);
  const g = requestFor({ provider: "google", apiKey: "k", model: "m", messages: [{ role: "user", content: "hi" }] });
  assert.ok(g.url.startsWith("https://generativelanguage.googleapis.com/v1beta/models/m:generateContent"));
  assert.equal(g.headers["x-goog-api-key"], "k");
  const x = requestFor({ provider: "grok", apiKey: "k", model: "m", messages: [] });
  assert.equal(x.url, "https://api.x.ai/v1/chat/completions");
  assert.equal(JSON.parse(x.body).max_tokens, 1024);
  assert.equal(requestFor({ provider: "kimi", apiKey: "k", model: "m", messages: [] }).url, "https://api.moonshot.ai/v1/chat/completions");
});

test("chat parses each provider's answer and usage", async () => {
  const fetchStub = (body: unknown) => async () => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  const a = await chat({ provider: "anthropic", apiKey: "k", model: "m", messages: [{ role: "user", content: "x" }] }, fetchStub({ content: [{ type: "text", text: "hello" }], usage: { input_tokens: 3, output_tokens: 2 } }));
  assert.deepEqual(a, { text: "hello", inputTokens: 3, outputTokens: 2 });
  const o = await chat({ provider: "openai", apiKey: "k", model: "m", messages: [{ role: "user", content: "x" }] }, fetchStub({ choices: [{ message: { content: "hey" } }], usage: { prompt_tokens: 5, completion_tokens: 1 } }));
  assert.deepEqual(o, { text: "hey", inputTokens: 5, outputTokens: 1 });
  const g = await chat({ provider: "google", apiKey: "k", model: "m", messages: [{ role: "user", content: "x" }] }, fetchStub({ candidates: [{ content: { parts: [{ text: "yo" }] } }], usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 4 } }));
  assert.deepEqual(g, { text: "yo", inputTokens: 7, outputTokens: 4 });
});

test("a 401 surfaces the provider message without the key", async () => {
  const bad = async () => new Response(JSON.stringify({ error: { message: "invalid x-api-key" } }), { status: 401 });
  await assert.rejects(chat({ provider: "anthropic", apiKey: "secret", model: "m", messages: [] }, bad), (e: Error) => /invalid x-api-key/.test(e.message) && !/secret/.test(e.message));
});
