/**
 * The key the agents think with.
 *
 * Saved on the instance row for the worker, and copied once into the
 * administrator's own BYOK column for the same provider, so the post
 * generator works on day one without a second paste. The copy happens only
 * when that column is empty, and the provider selected for posting is set
 * only when there is none yet: what the administrator chose for posting is
 * never overwritten from here.
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { isSelfHosted } from "@/lib/edition";
import { encryptApiKey } from "@/lib/encryption";
import { encryptSecret, getInstanceSettings, instanceSecrets, updateInstanceSettings } from "@/lib/instance-settings";
import { rateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";
import { cap, oneOf, secret, text, ValidationError } from "@/lib/setup/fields";
import { aiSection } from "@/lib/setup/status";
import type { AgentProvider } from "@shared/ai-client.ts";
import { AGENT_PROVIDER_IDS, AGENT_PROVIDERS } from "@shared/ai-models.ts";

type UserPatch = Partial<typeof users.$inferInsert>;
type KeyColumn = "anthropicApiKey" | "openaiApiKey" | "googleApiKey" | "grokApiKey" | "kimiApiKey";
type ModelColumn = "anthropicModel" | "openaiModel" | "googleModel" | "grokModel" | "kimiModel";

const BYOK_COLUMNS: Record<AgentProvider, { key: KeyColumn; model: ModelColumn }> = {
  anthropic: { key: "anthropicApiKey", model: "anthropicModel" },
  openai: { key: "openaiApiKey", model: "openaiModel" },
  google: { key: "googleApiKey", model: "googleModel" },
  grok: { key: "grokApiKey", model: "grokModel" },
  kimi: { key: "kimiApiKey", model: "kimiModel" },
};

async function copyIntoByok(userId: string, provider: AgentProvider, apiKey: string, writer: string): Promise<void> {
  const columns = BYOK_COLUMNS[provider];
  const [row] = await db
    .select({
      aiProvider: users.aiProvider,
      anthropicApiKey: users.anthropicApiKey,
      openaiApiKey: users.openaiApiKey,
      googleApiKey: users.googleApiKey,
      grokApiKey: users.grokApiKey,
      kimiApiKey: users.kimiApiKey,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row || row[columns.key]) return;

  const patch: UserPatch = { updatedAt: new Date(), ...(row.aiProvider ? {} : { aiProvider: provider }) };
  patch[columns.key] = encryptApiKey(apiKey);
  patch[columns.model] = writer;
  await db.update(users).set(patch).where(eq(users.id, userId));
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!session.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!isSelfHosted()) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const limit = rateLimit(`setup:${session.user.id}`, AUTH_RATE_LIMITS.setup);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const provider = oneOf(body.provider, AGENT_PROVIDER_IDS, "Provider");
    if (!provider) return NextResponse.json({ error: "Provider is required." }, { status: 400 });
    const apiKey = secret(body.apiKey, "API key");
    const modelFast = text(body.modelFast, "Fast model", 80) ?? AGENT_PROVIDERS[provider].fast;
    const modelWriter = text(body.modelWriter, "Writer model", 80) ?? AGENT_PROVIDERS[provider].writer;
    const dailyCapUsd = cap(body.dailyCapUsd, "Daily ceiling per agent");
    const monthlyCapUsd = cap(body.monthlyCapUsd, "Monthly ceiling per LinkedIn account");

    const current = await getInstanceSettings(true);
    const keepsStoredKey = apiKey === undefined && provider === current.agentAiProvider && !!current.agentAiKeyEncrypted;
    if (!apiKey && !keepsStoredKey) {
      return NextResponse.json({ error: "Paste the API key for this provider." }, { status: 400 });
    }

    const row = await updateInstanceSettings({
      agentAiProvider: provider,
      agentAiModelFast: modelFast,
      agentAiModelWriter: modelWriter,
      ...(apiKey !== undefined ? { agentAiKeyEncrypted: apiKey === null ? null : encryptSecret(apiKey) } : {}),
      ...(dailyCapUsd !== undefined ? { agentDailyCapUsd: dailyCapUsd } : {}),
      ...(monthlyCapUsd !== undefined ? { accountMonthlyCapUsd: monthlyCapUsd } : {}),
    });
    if (apiKey) await copyIntoByok(session.user.id, provider, apiKey, modelWriter);

    return NextResponse.json({ ok: true, ai: aiSection(row, await instanceSecrets()) });
  } catch (error) {
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Could not save the AI settings" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
