/**
 * The end of the wizard. Needs an AI key, because nothing else in the product
 * runs without one; makes sure the worker's cron secret exists; then marks the
 * instance set up so the dashboard opens and the sign up switch takes effect.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSelfHosted } from "@/lib/edition";
import { ensureCronSecret, getInstanceSettings, updateInstanceSettings } from "@/lib/instance-settings";
import { rateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";
import { boolean, ValidationError } from "@/lib/setup/fields";

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
    const allowSignups = boolean(body.allowSignups, "Allow sign ups");
    if (allowSignups === undefined) return NextResponse.json({ error: "Allow sign ups is required." }, { status: 400 });

    const current = await getInstanceSettings(true);
    if (!current.agentAiProvider || !current.agentAiKeyEncrypted) {
      return NextResponse.json({ error: "Add an AI key first" }, { status: 400 });
    }

    await ensureCronSecret();
    await updateInstanceSettings({ setupCompleted: true, allowSignups });
    return NextResponse.json({ ok: true, next: "/dashboard/agents/new" });
  } catch (error) {
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Could not finish the setup" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
