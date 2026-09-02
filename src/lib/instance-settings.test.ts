import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveSecretFrom, maskSecret } from "./instance-settings";

test("cloud resolves secrets from env, self hosted from the row", () => {
  const row = { agentAiKey: "row-key", proxySellerKey: "row-proxy", emailKey: null, smtpPassword: null, s3AccessKey: null, s3Secret: null, cronSecret: "row-cron" };
  assert.equal(resolveSecretFrom("cloud", "agentAiKey", row, { ANTHROPIC_API_KEY: "env-key" }), "env-key");
  assert.equal(resolveSecretFrom("self-hosted", "agentAiKey", row, { ANTHROPIC_API_KEY: "env-key" }), "row-key");
  assert.equal(resolveSecretFrom("cloud", "proxySellerKey", row, { PROXY_SELLER_API_KEY: "p" }), "p");
  assert.equal(resolveSecretFrom("self-hosted", "emailKey", row, { BREVO_API_KEY: "b" }), null);
});

test("masks show only the last four characters", () => {
  assert.equal(maskSecret("sk-ant-1234abcd"), "••••abcd");
  assert.equal(maskSecret(null), null);
  assert.equal(maskSecret(""), null);
});
