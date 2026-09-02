import { NextRequest, NextResponse } from "next/server";
import { EDITION } from "@/lib/edition";
import { getInstanceSettings } from "@/lib/instance-settings";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

// GET /api/health - what the compose healthcheck and the worker's boot wait poll.
// No auth, no session: it says whether the app can reach its database, and
// nothing about the instance beyond the edition and whether setup has run.
export async function GET(request: NextRequest) {
  const limit = rateLimit(`health:${getClientIP(request)}`, { maxRequests: 120, windowMs: 60_000 });
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: NO_STORE });
  }
  try {
    const settings = await getInstanceSettings();
    return NextResponse.json(
      { ok: true, edition: EDITION, setupCompleted: settings.setupCompleted },
      { headers: NO_STORE }
    );
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers: NO_STORE });
  }
}
