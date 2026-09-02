import { test } from "node:test";
import assert from "node:assert/strict";
import { createCipheriv, randomBytes } from "node:crypto";
import { createClient } from "@libsql/client";
import { setDbForTests, db as sharedDb } from "./db.ts";
import { instance, instanceFor, invalidateInstance } from "./instance.ts";
import { EDITION } from "./edition.ts";

// 64 hex characters, the shape the app and the worker both demand. Read when a value is decrypted, not at import.
const KEY = "0123456789abcdef".repeat(4);
process.env.ENCRYPTION_KEY = KEY;

/** The app's `encrypt` (src/lib/encryption.ts): AES-256-GCM, 16 byte iv, `iv:authTag:ciphertext` in hex. The worker only decrypts. */
function encryptForTest(plain: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(KEY, "hex"), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${data.toString("hex")}`;
}

/** The columns `instanceFor` reads off the wizard's row. */
async function freshTable(): Promise<void> {
  setDbForTests(createClient({ url: ":memory:" }));
  invalidateInstance();
  await sharedDb().execute(`CREATE TABLE instance_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    timezone TEXT, admin_email TEXT, app_url TEXT,
    agent_ai_provider TEXT, agent_ai_key_encrypted TEXT, agent_ai_model_fast TEXT, agent_ai_model_writer TEXT,
    agent_daily_cap_usd REAL NOT NULL DEFAULT 1.0, account_monthly_cap_usd REAL NOT NULL DEFAULT 12.0,
    proxy_seller_key_encrypted TEXT, cron_secret_encrypted TEXT,
    storage_provider TEXT NOT NULL DEFAULT 'local', s3_endpoint TEXT, s3_region TEXT, s3_bucket TEXT,
    s3_access_key_encrypted TEXT, s3_secret_encrypted TEXT, s3_public_url TEXT)`);
}

async function seedRow(): Promise<void> {
  await sharedDb().execute({
    sql: `INSERT INTO instance_settings (id, timezone, admin_email, app_url, agent_ai_provider, agent_ai_key_encrypted,
            agent_ai_model_fast, agent_ai_model_writer, agent_daily_cap_usd, account_monthly_cap_usd,
            proxy_seller_key_encrypted, cron_secret_encrypted, storage_provider, s3_endpoint, s3_region, s3_bucket,
            s3_access_key_encrypted, s3_secret_encrypted, s3_public_url)
          VALUES (1, 'Europe/Zurich', 'admin@acme.test', 'https://leads.acme.test', 'anthropic', ?,
            'claude-haiku-4-5', 'claude-sonnet-4-6', 2.5, 40,
            ?, ?, 's3', 'https://s3.acme.test', 'eu-central-1', 'media', ?, ?, 'https://media.acme.test')`,
    args: [encryptForTest("sk-ant-instance"), encryptForTest("proxy-seller-key"), encryptForTest("cron-secret"), encryptForTest("AKIA-access"), encryptForTest("s3-secret")],
  });
}

test("self hosted: the wizard's row comes back decrypted, with its caps and its timezone", async () => {
  await freshTable();
  await seedRow();
  const i = await instanceFor("self-hosted", {});
  assert.equal(i.agentAiProvider, "anthropic");
  assert.equal(i.agentAiKey, "sk-ant-instance");
  assert.equal(i.agentAiModelFast, "claude-haiku-4-5");
  assert.equal(i.agentAiModelWriter, "claude-sonnet-4-6");
  assert.equal(i.agentDailyCapUsd, 2.5);
  assert.equal(i.accountMonthlyCapUsd, 40);
  assert.equal(i.proxySellerKey, "proxy-seller-key");
  assert.equal(i.cronSecret, "cron-secret");
  assert.equal(i.adminEmail, "admin@acme.test");
  assert.equal(i.appUrl, "https://leads.acme.test");
  assert.equal(i.timezone, "Europe/Zurich");
  assert.equal(i.storageProvider, "s3");
  assert.equal(i.s3Endpoint, "https://s3.acme.test");
  assert.equal(i.s3Region, "eu-central-1");
  assert.equal(i.s3Bucket, "media");
  assert.equal(i.s3AccessKey, "AKIA-access");
  assert.equal(i.s3Secret, "s3-secret");
  assert.equal(i.s3PublicUrl, "https://media.acme.test");
  // The public entry point resolves the compiled edition against the process environment.
  assert.deepEqual(await instance(), await instanceFor(EDITION, process.env));
  setDbForTests(null);
});

test("self hosted: the row is cached for 30 seconds and invalidateInstance() drops the cache", async () => {
  await freshTable();
  await seedRow();
  assert.equal((await instanceFor("self-hosted", {})).agentDailyCapUsd, 2.5);
  await sharedDb().execute(`UPDATE instance_settings SET agent_daily_cap_usd = 9, agent_ai_key_encrypted = ? WHERE id = 1`, [encryptForTest("sk-ant-rotated")]);
  const cached = await instanceFor("self-hosted", {});
  assert.equal(cached.agentDailyCapUsd, 2.5);
  assert.equal(cached.agentAiKey, "sk-ant-instance");
  invalidateInstance();
  const fresh = await instanceFor("self-hosted", {});
  assert.equal(fresh.agentDailyCapUsd, 9);
  assert.equal(fresh.agentAiKey, "sk-ant-rotated");
  setDbForTests(null);
});

test("self hosted: an unfinished wizard reads as no secrets, default caps and local storage", async () => {
  await freshTable();
  await sharedDb().execute(`INSERT INTO instance_settings (id) VALUES (1)`);
  const i = await instanceFor("self-hosted", {});
  assert.equal(i.agentAiKey, null);
  assert.equal(i.proxySellerKey, null);
  assert.equal(i.cronSecret, null);
  assert.equal(i.timezone, null);
  assert.equal(i.agentDailyCapUsd, 1);
  assert.equal(i.accountMonthlyCapUsd, 12);
  assert.equal(i.storageProvider, "local");
  invalidateInstance();
  await sharedDb().execute(`DELETE FROM instance_settings`);
  assert.equal((await instanceFor("self-hosted", {})).storageProvider, "local");
  setDbForTests(null);
});

test("cloud: the environment answers and the database is never opened", async () => {
  // A database with no tables at all: one query from the cloud branch would throw "no such table".
  setDbForTests(createClient({ url: ":memory:" }));
  invalidateInstance();
  const i = await instanceFor("cloud", { ANTHROPIC_API_KEY: "sk-ant-cloud", PROXY_SELLER_API_KEY: "ps-cloud", APP_URL: "https://linkedgrow.ai" });
  assert.equal(i.agentAiProvider, "anthropic");
  assert.equal(i.agentAiKey, "sk-ant-cloud");
  assert.equal(i.proxySellerKey, "ps-cloud");
  assert.equal(i.appUrl, "https://linkedgrow.ai");
  assert.equal(i.agentDailyCapUsd, 1);
  assert.equal(i.accountMonthlyCapUsd, 12);
  assert.equal(i.cronSecret, null);
  assert.equal(i.timezone, null);
  assert.equal(i.storageProvider, null);
  const bare = await instanceFor("cloud", { ANTHROPIC_API_KEY: "" });
  assert.equal(bare.agentAiKey, null);
  assert.equal(bare.proxySellerKey, null);
  assert.equal(bare.appUrl, null);
  setDbForTests(null);
});
