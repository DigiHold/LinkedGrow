/**
 * The worker's way of sending an operations email.
 *
 * The worker has no mail provider of its own on a self hosted install: the
 * instance settings hold the provider, and only the app reads them. So the
 * worker hands the app a subject and a few lines, authenticated the same way
 * the cron routes are (the instance's cron secret, or an admin session), and
 * the app sends it to whoever operations mail goes to. No recipient means the
 * mail is dropped on purpose, and the caller is told so.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { sendEmail, opsRecipient } from "@/lib/email/ses-client";

const MAX_SUBJECT = 200;
const MAX_LINES = 30;
const MAX_LINE = 2000;

/** The worker sends a handful of alerts a day; anything faster from one address is not the worker. */
const RATE = { maxRequests: 60, windowMs: 60 * 1000 };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseBody(raw: string): { subject: string; lines: string[] } | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const { subject, lines } = parsed as { subject?: unknown; lines?: unknown };
  if (typeof subject !== "string" || subject.trim().length === 0 || subject.length > MAX_SUBJECT) return null;
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > MAX_LINES) return null;
  if (!lines.every((l): l is string => typeof l === "string" && l.length <= MAX_LINE)) return null;
  return { subject: subject.trim(), lines };
}

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(`internal-notify:${getClientIP(request)}`, RATE);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const verified = await verifyCronRequest(request, "/api/internal/notify");
    if (!verified.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = parseBody(verified.body);
    if (!body) {
      return NextResponse.json(
        { error: `Expected { subject (1 to ${MAX_SUBJECT} chars), lines (1 to ${MAX_LINES} strings, each up to ${MAX_LINE} chars) }` },
        { status: 400 }
      );
    }

    const to = await opsRecipient();
    if (!to) return NextResponse.json({ ok: true, skipped: true });

    await sendEmail({
      to,
      subject: body.subject,
      html: body.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join(""),
      text: body.lines.join("\n"),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Notification failed", detail: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
