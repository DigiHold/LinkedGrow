/**
 * Daily warmup cron for the dev.to account.
 *
 * Reads short technical articles from src/content/cross-post-warmup/, sorted by
 * the `day` field in frontmatter. Each cron run:
 *   1. Lists already-published articles via dev.to API
 *   2. Finds the first warmup article whose title isn't already on dev.to
 *   3. Publishes it
 *
 * Stateless — dev.to itself is the source of truth for what's been posted.
 * Stops naturally once all 7 are live; main cross-post cron takes over from
 * 2026-05-13 (DEVTO_ACTIVATION_AT in src/lib/cross-post.ts).
 */

import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { auth } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

export const maxDuration = 60;
export const runtime = "nodejs";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

interface WarmupArticle {
  day: number;
  title: string;
  description: string;
  tags: string[];
  body: string;
  filename: string;
}

function parseFrontmatter(raw: string): WarmupArticle | null {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  const fm = match[1];
  const body = match[2].trim();

  const dayMatch = fm.match(/^day:\s*(\d+)/m);
  const titleMatch = fm.match(/^title:\s*"(.+?)"/m);
  const descMatch = fm.match(/^description:\s*"(.+?)"/m);
  const tagBlock = fm.match(/^tags:\s*\n((?:\s+-\s+\S+\n?)+)/m);

  if (!dayMatch || !titleMatch || !descMatch || !tagBlock) return null;

  const tags = tagBlock[1]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim().replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);

  return {
    day: Number(dayMatch[1]),
    title: titleMatch[1],
    description: descMatch[1],
    tags,
    body,
    filename: "",
  };
}

async function loadWarmupArticles(): Promise<WarmupArticle[]> {
  const dir = path.join(process.cwd(), "src/content/cross-post-warmup");
  const files = (await fs.readdir(dir))
    .filter((f) => f.endsWith(".md"))
    .sort();

  const articles: WarmupArticle[] = [];
  for (const f of files) {
    const raw = await fs.readFile(path.join(dir, f), "utf8");
    const parsed = parseFrontmatter(raw);
    if (parsed) {
      parsed.filename = f;
      articles.push(parsed);
    }
  }
  return articles.sort((a, b) => a.day - b.day);
}

async function listDevtoTitles(apiKey: string): Promise<Set<string>> {
  // Pull both published and drafts so we don't double-publish anything.
  const titles = new Set<string>();
  for (const path of ["/api/articles/me/published", "/api/articles/me/unpublished"]) {
    const res = await fetch(`https://dev.to${path}?per_page=100`, {
      headers: { "api-key": apiKey, Accept: "application/vnd.forem.api-v1+json" },
    });
    if (!res.ok) continue;
    const data = (await res.json()) as Array<{ title?: string }>;
    for (const a of data) if (a.title) titles.add(a.title.trim().toLowerCase());
  }
  return titles;
}

async function publishOne(
  article: WarmupArticle,
  apiKey: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const body = {
    article: {
      title: article.title,
      body_markdown: article.body,
      published: true,
      description: article.description.slice(0, 250),
      tags: article.tags.slice(0, 4),
    },
  };
  const res = await fetch("https://dev.to/api/articles", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/vnd.forem.api-v1+json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `dev.to ${res.status}: ${text.slice(0, 300)}` };
  }
  const data = (await res.json()) as { url?: string };
  return { ok: true, url: data.url };
}

async function runWarmup() {
  const apiKey = process.env.DEVTO_API_KEY;
  if (!apiKey) throw new Error("DEVTO_API_KEY not set");

  const articles = await loadWarmupArticles();
  if (articles.length === 0) {
    return { skipped: "no warmup articles found", published: null };
  }

  const existing = await listDevtoTitles(apiKey);
  const next = articles.find((a) => !existing.has(a.title.trim().toLowerCase()));

  if (!next) {
    return { skipped: "all warmup articles already published", published: null };
  }

  const result = await publishOne(next, apiKey);
  return {
    published: {
      day: next.day,
      title: next.title,
      ...result,
    },
  };
}

export async function POST(request: NextRequest) {
  let authorized = false;

  try {
    const body = await request.text();
    const signature = request.headers.get("upstash-signature") || "";
    if (signature) {
      const isValid = await receiver.verify({
        body,
        signature,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/devto-warmup`,
      });
      if (isValid) authorized = true;
    }
  } catch {
    // Fall through to admin session check
  }

  if (!authorized) {
    const session = await auth();
    if (session?.user?.isAdmin) authorized = true;
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runWarmup();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
