import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { redeemCode, type RedemptionSource } from "@/lib/redemption-codes";
import { addToLtdList, removeFromAbandonedCartList } from "@/lib/newsletter";
import { sendLtdWelcomeEmail } from "@/lib/email";

const REDEEM_RATE_LIMIT = { maxRequests: 10, windowMs: 60 * 60 * 1000 };

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const clientIP = getClientIP(request);
  const rl = rateLimit(`ltd-redeem:${userId}:${clientIP}`, REDEEM_RATE_LIMIT);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { code, source } = (body || {}) as { code?: unknown; source?: unknown };

  if (typeof code !== "string" || code.length === 0 || code.length > 64) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }
  if (source !== "dealify" && source !== "dealmirror") {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  const result = await redeemCode(code, userId, source as RedemptionSource);

  if (!result.ok) {
    const messages: Record<string, string> = {
      invalid_format: "This code format is not valid. Check for typos and try again.",
      not_found: "We couldn't find that code. Make sure you copied it exactly.",
      already_redeemed: "This code has already been redeemed.",
      revoked: "This code is no longer valid. Contact the marketplace you bought from.",
      wrong_source: "This code is not valid on this page. Use the redemption link from the marketplace you bought from.",
    };
    return NextResponse.json(
      { error: messages[result.reason] ?? "Unable to redeem this code." },
      { status: 400 }
    );
  }

  const user = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user[0]?.email) {
    try { await addToLtdList(user[0].email, `marketplace-${source}`); } catch {}
    try { await removeFromAbandonedCartList(user[0].email); } catch {}
    try {
      await sendLtdWelcomeEmail({
        to: user[0].email,
        name: user[0].name || undefined,
      });
    } catch {}
  }

  return NextResponse.json({ success: true });
}
