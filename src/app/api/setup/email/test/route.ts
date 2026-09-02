/** One message through the saved provider, to the administrator unless another address is given. */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSelfHosted } from "@/lib/edition";
import { sendEmail } from "@/lib/email/ses-client";
import { getInstanceSettings } from "@/lib/instance-settings";
import { rateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";
import { email, ValidationError } from "@/lib/setup/fields";

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
    const to = email(body.to, "Recipient") ?? session.user.email?.toLowerCase().trim();
    if (!to) return NextResponse.json({ error: "Recipient is required." }, { status: 400 });

    const settings = await getInstanceSettings(true);
    if (settings.emailProvider === "none") {
      return NextResponse.json({ ok: false, error: "No email provider is configured." });
    }

    const name = settings.instanceName || "LinkedGrow";
    const text = `${name} sent this test email through your email provider.\nNotifications from this instance will arrive the same way.`;
    try {
      const result = await sendEmail({
        to,
        subject: "LinkedGrow test email",
        text,
        html: text
          .split("\n")
          .map((line) => `<p>${line}</p>`)
          .join(""),
      });
      if ("skipped" in result && result.skipped) {
        return NextResponse.json({ ok: false, error: "That address can never receive mail. Pick a real one." });
      }
      return NextResponse.json({ ok: true, to });
    } catch (error) {
      return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "The provider did not answer." });
    }
  } catch (error) {
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Could not send the test email" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
