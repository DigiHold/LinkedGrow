/** Asks Proxy-Seller which countries it sells addresses in, which also proves the allowlist lets this server through. */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSelfHosted } from "@/lib/edition";
import { instanceSecrets } from "@/lib/instance-settings";
import { ProxySellerProvider } from "@/lib/proxy/proxy-seller";
import { rateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";
import { secret, ValidationError } from "@/lib/setup/fields";

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

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const pasted = secret(body.apiKey, "Proxy-Seller API key");
    const apiKey = pasted || (await instanceSecrets()).proxySellerKey;
    if (!apiKey) return NextResponse.json({ ok: false, error: "Paste the Proxy-Seller API key first." });

    try {
      const countries = await new ProxySellerProvider(apiKey).countries();
      return NextResponse.json({ ok: true, countries: countries.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Proxy-Seller did not answer.";
      return NextResponse.json({ ok: false, error: message.split(apiKey).join("[key]") });
    }
  } catch (error) {
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Could not test the key" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
