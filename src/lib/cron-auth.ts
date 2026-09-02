import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { isSelfHosted } from "@/lib/edition";
import { resolveInstanceSecret } from "@/lib/instance-settings";
import { getAppUrl } from "@/lib/app-url";

export const CRON_HEADER = "x-linkedgrow-cron";

export function sharedSecretMatches(given: string | null | undefined, expected: string): boolean {
  if (!given || !expected || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

/**
 * Three ways in: the QStash signature (cloud), an admin session (manual runs anywhere),
 * or the instance's own cron secret sent by the worker (self hosted only).
 * Returns the raw body so the route can parse it once.
 */
export async function verifyCronRequest(request: NextRequest, path: string): Promise<{ ok: true; body: string } | { ok: false }> {
  const body = await request.text();
  if (isSelfHosted()) {
    const expected = await resolveInstanceSecret("cronSecret");
    if (expected && sharedSecretMatches(request.headers.get(CRON_HEADER), expected)) return { ok: true, body };
  } else {
    const { Receiver } = await import("@upstash/qstash");
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY ?? "",
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY ?? "",
    });
    const signature = request.headers.get("upstash-signature") || "";
    try {
      if (await receiver.verify({ body, signature, url: `${getAppUrl()}${path}` })) return { ok: true, body };
    } catch {
      // fall through to the admin session
    }
  }
  const session = await auth();
  if (session?.user?.isAdmin) return { ok: true, body };
  return { ok: false };
}
