/** Where dedicated addresses come from: Proxy-Seller with the instance's own key, or nowhere. */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSelfHosted } from "@/lib/edition";
import { encryptSecret, getInstanceSettings, instanceSecrets, updateInstanceSettings } from "@/lib/instance-settings";
import { rateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";
import { oneOf, secret, ValidationError } from "@/lib/setup/fields";
import { proxySection } from "@/lib/setup/status";

const PROVIDERS = ["none", "proxy-seller"] as const;

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
    const provider = oneOf(body.provider, PROVIDERS, "Provider");
    if (!provider) return NextResponse.json({ error: "Provider is required." }, { status: 400 });
    const apiKey = secret(body.apiKey, "Proxy-Seller API key");

    const current = await getInstanceSettings(true);
    const hasKey = apiKey ? true : apiKey === undefined && !!current.proxySellerKeyEncrypted;
    if (provider === "proxy-seller" && !hasKey) {
      return NextResponse.json({ error: "Paste the Proxy-Seller API key." }, { status: 400 });
    }

    const row = await updateInstanceSettings({
      proxyProvider: provider,
      ...(apiKey !== undefined ? { proxySellerKeyEncrypted: apiKey === null ? null : encryptSecret(apiKey) } : {}),
    });
    const secrets = await instanceSecrets();
    return NextResponse.json({ ok: true, proxy: proxySection(row, secrets, null) });
  } catch (error) {
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Could not save the proxy settings" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
