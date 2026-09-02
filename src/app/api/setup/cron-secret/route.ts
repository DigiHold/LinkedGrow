/**
 * Rotate the instance's cron secret.
 *
 * The worker reads the new value off instance_settings within a minute and
 * starts sending it; until then its scheduled calls answer 401 and are
 * retried on the next tick, so nothing is lost. The plain value never leaves
 * the database: the response carries the masked suffix and nothing else.
 * Self hosted only. The cloud has QStash and no row to rotate.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSelfHosted } from "@/lib/edition";
import { maskSecret, rotateCronSecret } from "@/lib/instance-settings";
import { rateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!session.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!isSelfHosted()) return NextResponse.json({ error: "Only a self hosted instance has a cron secret" }, { status: 403 });

    const limit = rateLimit(`cron-secret-rotate:${session.user.id}`, AUTH_RATE_LIMITS.cronSecretRotate);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many rotations. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const secret = await rotateCronSecret();
    return NextResponse.json({ ok: true, secret: maskSecret(secret) });
  } catch (error) {
    return NextResponse.json(
      { error: "Could not rotate the cron secret", detail: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
