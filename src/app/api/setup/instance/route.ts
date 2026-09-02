/** Step 1 of the wizard, and the first card of Settings, Instance. */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSelfHosted } from "@/lib/edition";
import { updateInstanceSettings } from "@/lib/instance-settings";
import { rateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";
import { appUrl, email, text, timezone, ValidationError } from "@/lib/setup/fields";
import { instanceSection } from "@/lib/setup/status";

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
    const patch = {
      instanceName: text(body.instanceName, "Instance name", 80),
      appUrl: appUrl(body.appUrl),
      timezone: timezone(body.timezone),
      adminEmail: email(body.adminEmail, "Admin email"),
    };
    if (Object.values(patch).every((v) => v === undefined)) {
      return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
    }

    const row = await updateInstanceSettings(patch);
    return NextResponse.json({ ok: true, instance: instanceSection(row) });
  } catch (error) {
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Could not save the instance settings" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
