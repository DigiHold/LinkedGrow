/** How the instance sends its notifications: Resend, Brevo, an SMTP server, or nothing. */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSelfHosted } from "@/lib/edition";
import { encryptSecret, getInstanceSettings, instanceSecrets, updateInstanceSettings } from "@/lib/instance-settings";
import { rateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";
import { boolean, email, hostname, oneOf, port, secret, text, ValidationError } from "@/lib/setup/fields";
import { emailSection } from "@/lib/setup/status";

const PROVIDERS = ["none", "resend", "smtp", "brevo"] as const;

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
    const apiKey = secret(body.apiKey, "API key");
    const smtpHost = hostname(body.smtpHost, "Host");
    const smtpPort = port(body.smtpPort, "Port");
    const smtpUser = text(body.smtpUser, "Username", 200, 0);
    const smtpPassword = secret(body.smtpPassword, "Password");
    const smtpTls = boolean(body.smtpTls, "Use TLS");
    const fromName = text(body.fromName, "From name", 80);
    const fromAddress = email(body.fromAddress, "From address");

    const current = await getInstanceSettings(true);
    const keyAfter = apiKey === undefined ? !!current.emailKeyEncrypted : !!apiKey;
    const hostAfter = smtpHost ?? current.smtpHost;
    const portAfter = smtpPort ?? current.smtpPort;
    const fromAfter = fromAddress ?? current.emailFromAddress;

    if ((provider === "resend" || provider === "brevo") && !keyAfter) {
      return NextResponse.json({ error: "Paste the API key for this provider." }, { status: 400 });
    }
    if (provider === "smtp" && (!hostAfter || !portAfter)) {
      return NextResponse.json({ error: "Host and port are required for SMTP." }, { status: 400 });
    }
    if (provider !== "none" && !fromAfter) {
      return NextResponse.json({ error: "From address is required." }, { status: 400 });
    }

    const row = await updateInstanceSettings({
      emailProvider: provider,
      ...(apiKey !== undefined ? { emailKeyEncrypted: apiKey === null ? null : encryptSecret(apiKey) } : {}),
      ...(smtpHost !== undefined ? { smtpHost } : {}),
      ...(smtpPort !== undefined ? { smtpPort } : {}),
      ...(smtpUser !== undefined ? { smtpUser: smtpUser || null } : {}),
      ...(smtpPassword !== undefined ? { smtpPasswordEncrypted: smtpPassword === null ? null : encryptSecret(smtpPassword) } : {}),
      ...(smtpTls !== undefined ? { smtpTls } : {}),
      ...(fromName !== undefined ? { emailFromName: fromName } : {}),
      ...(fromAddress !== undefined ? { emailFromAddress: fromAddress } : {}),
    });
    return NextResponse.json({ ok: true, email: emailSection(row, await instanceSecrets()) });
  } catch (error) {
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Could not save the email settings" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
