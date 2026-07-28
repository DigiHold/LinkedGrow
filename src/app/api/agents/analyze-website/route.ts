import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAIRateLimit } from "@/lib/rate-limit";

/**
 * Reads the client's own website once and turns it into the agent's targeting.
 *
 * Without this the wizard asks a brand new customer to describe their ideal
 * buyer from a blank field, which is the step most of them stall on. The site
 * already says what the business sells and to whom, so the agent reads it and
 * proposes the ICP, the roles, the industries and the company sizes. The
 * customer edits rather than invents.
 *
 * The AI runs on the platform key, not the customer's: on v2 the agent's AI is
 * in the price, and a new account has no key of its own yet.
 */

const MAX_HTML = 400_000;
const MAX_TEXT = 12_000;

/** Hosts that must never be fetched from the server: SSRF. */
const BLOCKED = [
  /^localhost$/i, /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
  /^169\.254\./, /^0\./, /^\[::1\]$/, /^\[fc/i, /^\[fd/i, /^\[fe80:/i,
  /\.local$/i, /\.internal$/i,
];

function readableText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT);
}

/** Keeps only strings, trims them, and caps both the count and each item. */
function list(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, max)
    .map((v) => v.slice(0, 80));
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = checkAIRateLimit(session.user.id);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many requests. Try again in a minute." },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => null);
    const raw = typeof body?.website === "string" ? body.website.trim() : "";
    if (!raw || raw.length > 300) {
      return NextResponse.json({ error: "Enter your website address." }, { status: 400 });
    }

    let target: URL;
    try {
      target = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    } catch {
      return NextResponse.json({ error: "That does not look like a web address." }, { status: 400 });
    }
    if (target.protocol !== "https:" && target.protocol !== "http:") {
      return NextResponse.json({ error: "Only HTTP and HTTPS addresses work here." }, { status: 400 });
    }
    if (BLOCKED.some((pattern) => pattern.test(target.hostname.toLowerCase()))) {
      return NextResponse.json({ error: "That address is not allowed." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Site reading is unavailable right now. Fill the fields by hand and carry on." },
        { status: 503 },
      );
    }

    let page: Response;
    try {
      page = await fetch(target.toString(), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      return NextResponse.json(
        { error: "That site took too long to answer. Check the address and try again." },
        { status: 502 },
      );
    }
    if (!page.ok) {
      return NextResponse.json(
        { error: "That site did not answer. Check the address and try again." },
        { status: 502 },
      );
    }

    const text = readableText((await page.text()).slice(0, MAX_HTML));
    if (text.length < 200) {
      return NextResponse.json(
        { error: "There was not enough text on that page to read. Fill the fields by hand." },
        { status: 422 },
      );
    }

    let completion: Response;
    try {
      completion = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5.4-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You read a company's website and work out who buys from them. " +
                "Answer with JSON only, using these keys: icpSummary (a sentence naming the buyer and " +
                "the problem the company solves for them), jobRoles (array of job titles), industries " +
                "(array), companySizes (array from: 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+), " +
                "signals (array of 6 short topics those buyers post about or search for, two or three " +
                "words each, no hashtags), " +
                "companyInfo (two sentences a stranger could read to understand what the company sells). " +
                "Leave an array empty rather than guessing. Never invent a location.",
            },
            { role: "user", content: `Website: ${target.hostname}\n\n${text}` },
          ],
        }),
        signal: AbortSignal.timeout(45000),
      });
    } catch {
      return NextResponse.json(
        { error: "Reading the site timed out. Fill the fields by hand and carry on." },
        { status: 504 },
      );
    }
    if (!completion.ok) {
      return NextResponse.json(
        { error: "Reading the site failed. Fill the fields by hand and carry on." },
        { status: 502 },
      );
    }

    const payload = await completion.json();
    const content = payload?.choices?.[0]?.message?.content;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(typeof content === "string" ? content : "{}");
    } catch {
      return NextResponse.json(
        { error: "The answer came back unreadable. Fill the fields by hand and carry on." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      website: target.hostname,
      icpSummary:
        typeof parsed.icpSummary === "string" ? parsed.icpSummary.trim().slice(0, 2000) : "",
      jobRoles: list(parsed.jobRoles, 20),
      industries: list(parsed.industries, 20),
      companySizes: list(parsed.companySizes, 10),
      signals: list(parsed.signals, 8),
      companyInfo:
        typeof parsed.companyInfo === "string" ? parsed.companyInfo.trim().slice(0, 4000) : "",
    });
  } catch {
    return NextResponse.json({ error: "Failed to read the site" }, { status: 500 });
  }
}
