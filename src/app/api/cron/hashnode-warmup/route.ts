/**
 * Daily warmup cron for the Hashnode publication.
 *
 * Reads short technical articles from src/content/cross-post-warmup/, sorted by
 * the `day` field in frontmatter. Each cron run:
 *   1. Lists already-published articles in the publication via Hashnode GraphQL
 *   2. Finds the first warmup article whose title isn't already on Hashnode
 *   3. Publishes it as native content (no canonical URL) so Hashnode treats it
 *      as original — same content as dev.to versions but each platform sees
 *      itself as the source for its own copy.
 *
 * Stateless — Hashnode itself is the source of truth. Stops naturally once all
 * 7 are live; main cross-post cron takes over from 2026-05-13.
 */

import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { auth } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

export const maxDuration = 60;
export const runtime = "nodejs";

const HASHNODE_API = "https://gql.hashnode.com";

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
    .map((l) => l.slice(2).trim())
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

async function getPublicationContext(
  host: string,
  token: string
): Promise<{ publicationId: string; existingTitles: Set<string> }> {
  const res = await fetch(HASHNODE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({
      query: `query Pub($host: String!) {
        publication(host: $host) {
          id
          posts(first: 50) {
            edges { node { title } }
          }
        }
      }`,
      variables: { host },
    }),
  });
  if (!res.ok) throw new Error(`Hashnode publication lookup ${res.status}`);
  const data = (await res.json()) as {
    data?: {
      publication?: {
        id?: string;
        posts?: { edges: Array<{ node: { title: string } }> };
      } | null;
    };
    errors?: Array<{ message: string }>;
  };
  if (data.errors?.length) throw new Error(`Hashnode: ${data.errors[0].message}`);
  const pub = data.data?.publication;
  if (!pub?.id) throw new Error(`No publication for host ${host}`);

  const titles = new Set<string>(
    (pub.posts?.edges ?? []).map((e) => e.node.title.trim().toLowerCase())
  );
  return { publicationId: pub.id, existingTitles: titles };
}

async function publishOne(
  article: WarmupArticle,
  publicationId: string,
  token: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const tagSlugs = article.tags
    .map((t) => ({
      slug: t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      name: t.trim(),
    }))
    .filter((t) => t.slug)
    .slice(0, 5);

  const res = await fetch(HASHNODE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({
      query: `mutation PublishPost($input: PublishPostInput!) {
        publishPost(input: $input) {
          post { id url }
        }
      }`,
      variables: {
        input: {
          title: article.title,
          subtitle: article.description.slice(0, 250),
          contentMarkdown: article.body,
          publicationId,
          tags: tagSlugs,
          settings: { isNewsletterActivated: false },
        },
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `hashnode ${res.status}: ${text.slice(0, 300)}` };
  }
  const data = (await res.json()) as {
    data?: { publishPost?: { post?: { id?: string; url?: string } } };
    errors?: Array<{ message: string }>;
  };
  if (data.errors?.length) {
    return { ok: false, error: `hashnode: ${data.errors[0].message}` };
  }
  const out = data.data?.publishPost?.post;
  if (!out?.url) return { ok: false, error: "hashnode returned no post" };
  return { ok: true, url: out.url };
}

async function runWarmup() {
  const token = process.env.HASHNODE_API_KEY;
  const rawHost = process.env.HASHNODE_PUBLICATION_HOST;
  if (!token) throw new Error("HASHNODE_API_KEY not set");
  if (!rawHost) throw new Error("HASHNODE_PUBLICATION_HOST not set");
  const host = rawHost.replace(/^https?:\/\//, "").replace(/\/+$/, "").trim();

  const articles = await loadWarmupArticles();
  if (articles.length === 0) {
    return { skipped: "no warmup articles found", published: null };
  }

  const { publicationId, existingTitles } = await getPublicationContext(host, token);
  const next = articles.find(
    (a) => !existingTitles.has(a.title.trim().toLowerCase())
  );

  if (!next) {
    return { skipped: "all warmup articles already published", published: null };
  }

  const result = await publishOne(next, publicationId, token);
  return {
    published: { day: next.day, title: next.title, ...result },
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
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/hashnode-warmup`,
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
