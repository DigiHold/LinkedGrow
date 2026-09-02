import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { checkAIRateLimit } from "@/lib/rate-limit";
import { EDITION } from "@/lib/edition";
import { getInstanceSettings, resolveInstanceSecret } from "@/lib/instance-settings";
import { chat, type AgentProvider } from "@shared/ai-client.ts";
import { AGENT_PROVIDERS, isAgentProvider } from "@shared/ai-models.ts";

/**
 * Reads the client's own website once and turns it into the agent's targeting.
 *
 * Without this the wizard asks a brand new customer to describe their ideal
 * buyer from a blank field, which is the step most of them stall on. The site
 * already says what the business sells and to whom, so the agent reads it and
 * proposes the ICP, the roles, the industries and the company sizes. The
 * customer edits rather than invents.
 *
 * In the cloud the read runs on the platform Anthropic key, not the customer's:
 * on v2 the agent's AI is in the price and a new account has no key of its own
 * yet. Haiku, not Sonnet: pulling roles and topics out of a page is extraction,
 * which is what the plan's routing table sends to Haiku. The customer edits the
 * result anyway, so paying five times more for the same list buys nothing.
 *
 * The self hosted edition reads with the key, the provider and the writer
 * model the setup wizard stored, through the same shared client the worker
 * uses, so the five providers behave the same here as they do in the agents.
 */

const MAX_HTML = 400_000;
// Enough of a home page to know what is sold and to whom. Everything past this
// is footer, cookie notice and nav, which cost tokens and add nothing.
const MAX_TEXT = 8_000;

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

/**
 * The shape the answer has to take, asked for in words because the five
 * providers do not share a schema-constrained decoding mode. The keys and the
 * size bands are spelled out so every provider returns the same object.
 */
const SYSTEM =
  "You read a company's website and work out who buys from them. Fill each field: " +
  "icpSummary, a sentence naming the buyer and the problem the company solves for them; " +
  "jobRoles, the job titles that buy; industries, the sectors they work in; " +
  "companySizes, the headcount bands that fit, each one of 1-10, 11-50, 51-200, 201-500, 501-1000 or 1000+; " +
  "signals, 6 short topics those buyers post about or search for, two or three words " +
  "each, no hashtags; " +
  "companyInfo, two sentences a stranger could read to understand what the company sells. " +
  "Leave an array empty rather than guessing. Never invent a location. " +
  "Answer with one JSON object holding exactly the keys icpSummary, jobRoles, industries, companySizes, signals and companyInfo, " +
  "and nothing else: no prose before or after it, no code fence.";

/**
 * Reads the object out of the answer even if something wraps it.
 *
 * The prompt asks for bare JSON. This stays because a whole signup stalls on
 * one stray character, and the cost of being wrong here is a customer staring
 * at a form we promised to fill for them.
 */
function extractJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const value: unknown = JSON.parse(trimmed.slice(start, end + 1));
    return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
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

/** Who reads the page: the cloud's own Haiku, or whatever the setup wizard stored. */
async function reader(): Promise<{ provider: AgentProvider; model: string; apiKey: string | null }> {
  if (EDITION === "cloud") {
    return { provider: "anthropic", model: "claude-haiku-4-5", apiKey: process.env.ANTHROPIC_API_KEY || null };
  }
  const settings = await getInstanceSettings();
  const provider: AgentProvider =
    settings.agentAiProvider && isAgentProvider(settings.agentAiProvider) ? settings.agentAiProvider : "anthropic";
  return {
    provider,
    model: settings.agentAiModelWriter || AGENT_PROVIDERS[provider].writer,
    apiKey: await resolveInstanceSecret("agentAiKey"),
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* The read runs on our own key, and the wizard is open before any card
       now, so the spend is capped per user rather than by good faith. Ten a
       day is several full setups; nobody legitimate reaches it. */
    const limited = rateLimit(`analyze-website:${session.user.id}`, {
      maxRequests: 10,
      windowMs: 24 * 60 * 60 * 1000,
    });
    if (!limited.success) {
      return NextResponse.json(
        { error: "Daily limit reached for site reads. Fill the steps by hand or try tomorrow." },
        { status: 429 }
      );
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

    const ai = await reader();
    if (!ai.apiKey) {
      // A self hosted owner can fix this themselves; a cloud customer cannot.
      return EDITION === "cloud"
        ? NextResponse.json(
            { error: "Site reading is unavailable right now. Fill the fields by hand and carry on." },
            { status: 503 },
          )
        : NextResponse.json(
            { error: "No AI key is configured for the agents. Add one in Settings, Instance." },
            { status: 400 },
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

    let answer: string;
    try {
      answer = (
        await chat(
          {
            provider: ai.provider,
            apiKey: ai.apiKey,
            model: ai.model,
            maxTokens: 1500,
            system: SYSTEM,
            messages: [{ role: "user", content: `Website: ${target.hostname}\n\n${text}` }],
          },
          (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(45000) }),
        )
      ).text;
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        return NextResponse.json(
          { error: "Reading the site timed out. Fill the fields by hand and carry on." },
          { status: 504 },
        );
      }
      return NextResponse.json(
        { error: "Reading the site failed. Fill the fields by hand and carry on." },
        { status: 502 },
      );
    }

    const parsed = extractJson(answer);
    if (!parsed) {
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
