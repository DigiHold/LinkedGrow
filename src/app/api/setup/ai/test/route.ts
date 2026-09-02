/** One short request to the provider, with the pasted key or the stored one, and its answer. */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSelfHosted } from "@/lib/edition";
import { instanceSecrets } from "@/lib/instance-settings";
import { rateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";
import { oneOf, secret, text, ValidationError } from "@/lib/setup/fields";
import { chat } from "@shared/ai-client.ts";
import { AGENT_PROVIDER_IDS, AGENT_PROVIDERS } from "@shared/ai-models.ts";

export async function POST(request: NextRequest) {
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
    const pasted = secret(body.apiKey, "API key");
    const model = text(body.model, "Model", 80) || AGENT_PROVIDERS[provider].fast;

    const apiKey = pasted || (await instanceSecrets()).agentAiKey;
    if (!apiKey) return NextResponse.json({ ok: false, error: "Paste an API key first." });

    try {
      const result = await chat({
        provider,
        apiKey,
        model,
        messages: [{ role: "user", content: "Reply with the single word ok." }],
        maxTokens: 5,
      });
      return NextResponse.json({ ok: true, sample: result.text });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The provider did not answer.";
      return NextResponse.json({ ok: false, error: message.split(apiKey).join("[key]") });
    }
  } catch (error) {
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Could not test the key" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
