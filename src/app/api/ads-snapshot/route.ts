import { NextRequest, NextResponse } from "next/server";
import { randomUUID, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { googleAdsSnapshots } from "@/lib/db/schema";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

/**
 * Receives the daily stats snapshot from the Google Ads Script.
 *
 * Deliberately public (no session: the caller is Google's script runner), so
 * it protects itself: a dedicated bearer secret compared in constant time, an
 * IP rate limit, a hard size cap, and the payload must parse as JSON before a
 * byte of it is stored. Nothing in the response ever echoes the payload.
 */
export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(`ads-snapshot:${getClientIP(request)}`, {
      maxRequests: 12,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const secret = process.env.ADS_SNAPSHOT_SECRET;
    const header = request.headers.get("authorization") ?? "";
    const expected = `Bearer ${secret}`;
    if (
      !secret ||
      header.length !== expected.length ||
      !timingSafeEqual(Buffer.from(header), Buffer.from(expected))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const text = await request.text();
    if (!text || text.length > 900_000) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    try {
      JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await db.insert(googleAdsSnapshots).values({
      id: randomUUID(),
      day: new Date().toISOString().slice(0, 10),
      payload: text,
      createdAt: Math.floor(Date.now() / 1000),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Snapshot not saved" }, { status: 500 });
  }
}
