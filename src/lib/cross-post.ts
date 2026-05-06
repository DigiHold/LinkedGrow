/**
 * Cross-post a published blog article to dev.to and Hashnode
 * with the canonical URL set back to linkedgrow.ai so Google
 * keeps ranking the original.
 *
 * Source of truth for content is the rendered HTML at
 * https://linkedgrow.ai/blog/[slug] — we fetch it, isolate the
 * article body via the [data-blog-content] selector, normalize
 * links/images, then convert to markdown for the platform APIs.
 */

import * as cheerio from "cheerio";
import TurndownService from "turndown";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getBlogPost, getAuthor, type BlogPost } from "@/lib/blog";

const APP_URL = "https://linkedgrow.ai";
const HASHNODE_API = "https://gql.hashnode.com";

export type CrossPostTarget = "devto" | "hashnode";

export interface CrossPostResult {
  slug: string;
  devto: { ok: boolean; url?: string; id?: string; error?: string };
  hashnode: { ok: boolean; url?: string; id?: string; error?: string };
}

/**
 * Fetch the published article HTML and extract the body as markdown.
 * Internal links are rewritten to absolute URLs so they work off-domain.
 */
async function extractArticleMarkdown(slug: string): Promise<string> {
  const url = `${APP_URL}/blog/${slug}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "LinkedGrowCrossPostBot/1.0" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} returned ${res.status}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);
  const $body = $("[data-blog-content]").first();
  if ($body.length === 0) {
    throw new Error(`No [data-blog-content] block found in ${url}`);
  }

  // Rewrite relative links to absolute
  $body.find("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (href.startsWith("/")) {
      $(el).attr("href", `${APP_URL}${href}`);
    }
  });

  // Resolve Next.js Image srcs to direct URLs
  $body.find("img").each((_, el) => {
    const $img = $(el);
    const src = $img.attr("src") || "";
    if (src.startsWith("/_next/image")) {
      try {
        const abs = new URL(src, APP_URL);
        const real = abs.searchParams.get("url");
        if (real) $img.attr("src", decodeURIComponent(real));
      } catch {
        // ignore
      }
    } else if (src.startsWith("/")) {
      $img.attr("src", `${APP_URL}${src}`);
    }
    // Strip srcset / Next.js attrs (turndown ignores them but be safe)
    $img.removeAttr("srcset");
    $img.removeAttr("loading");
    $img.removeAttr("decoding");
    $img.removeAttr("data-nimg");
  });

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  turndown.keep(["sup", "sub"]);

  const innerHtml = $body.html() || "";
  return turndown.turndown(innerHtml).trim();
}

function buildAuthorBio(post: BlogPost): string {
  const author = getAuthor(post.authorId);
  if (!author) return "";
  const socials = [
    author.linkedin && `[LinkedIn](${author.linkedin})`,
    author.facebook && `[Facebook](${author.facebook})`,
    author.youtube && `[YouTube](${author.youtube})`,
  ]
    .filter(Boolean)
    .join(" · ");

  return [
    "",
    "---",
    "",
    `**Written by [${author.name}](${author.linkedin})** — ${author.title}`,
    "",
    `<img src="${author.avatar}" alt="${author.name}" width="80" height="80" />`,
    "",
    author.bio.replace("LinkedGrow", "[LinkedGrow](https://linkedgrow.ai)"),
    "",
    socials,
    "",
    `*This article was originally published on [linkedgrow.ai](${APP_URL}/blog/${post.slug}).*`,
  ].join("\n");
}

function buildPostMarkdown(post: BlogPost, body: string): string {
  return `${body}\n${buildAuthorBio(post)}\n`;
}

/**
 * Build dev.to-safe tag list (max 4, lowercase, alphanumeric only).
 * Source: post.category + post.keywords. Dedup, drop entries that
 * collapse to empty after sanitization.
 */
function buildDevtoTags(post: BlogPost): string[] {
  const raw = [post.category, ...post.keywords];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const r of raw) {
    const slug = r.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    tags.push(slug);
    if (tags.length >= 4) break;
  }
  return tags;
}

/**
 * Build Hashnode-safe tag list (max 5). Slug must be lowercase alphanumeric
 * with hyphens. Name is the original human-readable label.
 */
function buildHashnodeTags(post: BlogPost): { slug: string; name: string }[] {
  const raw = [post.category, ...post.keywords];
  const seen = new Set<string>();
  const tags: { slug: string; name: string }[] = [];
  for (const r of raw) {
    const slug = r
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    tags.push({ slug, name: r.trim() });
    if (tags.length >= 5) break;
  }
  return tags;
}

async function postToDevto(
  post: BlogPost,
  markdown: string
): Promise<{ ok: boolean; url?: string; id?: string; error?: string }> {
  const apiKey = process.env.DEVTO_API_KEY;
  if (!apiKey) return { ok: false, error: "DEVTO_API_KEY not set" };

  const canonical = `${APP_URL}/blog/${post.slug}`;
  const body = {
    article: {
      title: post.title,
      body_markdown: markdown,
      published: true,
      canonical_url: canonical,
      description: post.description.slice(0, 250),
      main_image: post.featuredImageOg || post.featuredImage,
      tags: buildDevtoTags(post),
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
  const data = (await res.json()) as { id?: number; url?: string };
  return { ok: true, url: data.url, id: data.id != null ? String(data.id) : undefined };
}

async function getHashnodePublicationId(
  host: string,
  token: string
): Promise<string> {
  const res = await fetch(HASHNODE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({
      query: `query Publication($host: String!) { publication(host: $host) { id } }`,
      variables: { host },
    }),
  });
  if (!res.ok) {
    throw new Error(`Hashnode publication lookup failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    data?: { publication?: { id?: string } | null };
    errors?: Array<{ message: string }>;
  };
  if (data.errors?.length) {
    throw new Error(`Hashnode error: ${data.errors[0].message}`);
  }
  const id = data.data?.publication?.id;
  if (!id) throw new Error(`No publication found for host ${host}`);
  return id;
}

async function postToHashnode(
  post: BlogPost,
  markdown: string
): Promise<{ ok: boolean; url?: string; id?: string; error?: string }> {
  const token = process.env.HASHNODE_API_KEY;
  const rawHost = process.env.HASHNODE_PUBLICATION_HOST;
  if (!token) return { ok: false, error: "HASHNODE_API_KEY not set" };
  if (!rawHost) return { ok: false, error: "HASHNODE_PUBLICATION_HOST not set" };

  // Accept "https://x.hashnode.dev/", "x.hashnode.dev", etc. — Hashnode wants just the host.
  const host = rawHost.replace(/^https?:\/\//, "").replace(/\/+$/, "").trim();

  let publicationId: string;
  try {
    publicationId = await getHashnodePublicationId(host, token);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  const canonical = `${APP_URL}/blog/${post.slug}`;
  const variables = {
    input: {
      title: post.title,
      subtitle: post.description.slice(0, 250),
      contentMarkdown: markdown,
      publicationId,
      tags: buildHashnodeTags(post),
      originalArticleURL: canonical,
      coverImageOptions: {
        coverImageURL: post.featuredImageOg || post.featuredImage,
      },
      metaTags: {
        title: post.title,
        description: post.description.slice(0, 250),
        image: post.featuredImageOg || post.featuredImage,
      },
      settings: { isNewsletterActivated: false },
    },
  };

  const res = await fetch(HASHNODE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({
      query: `mutation PublishPost($input: PublishPostInput!) {
        publishPost(input: $input) {
          post { id url }
        }
      }`,
      variables,
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
  if (!out?.url || !out.id) return { ok: false, error: "hashnode returned no post" };
  return { ok: true, url: out.url, id: out.id };
}

/**
 * Cross-post one article. Skips targets that already succeeded
 * (devtoUrl / hashnodeUrl already set) so this is idempotent and
 * safe to retry.
 */
export async function crossPostArticle(
  slug: string,
  options?: { force?: boolean; only?: CrossPostTarget }
): Promise<CrossPostResult> {
  const post = getBlogPost(slug);
  if (!post) throw new Error(`Blog post not found: ${slug}`);

  const existing = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.slug, slug),
  });

  const force = options?.force === true;
  const only = options?.only;

  const result: CrossPostResult = {
    slug,
    devto: { ok: false },
    hashnode: { ok: false },
  };

  // Generate markdown once, reuse for both platforms
  const body = await extractArticleMarkdown(slug);
  const markdown = buildPostMarkdown(post, body);

  // dev.to
  if (only !== "hashnode") {
    if (!force && existing?.devtoUrl) {
      result.devto = { ok: true, url: existing.devtoUrl, id: existing.devtoId ?? undefined };
    } else {
      result.devto = await postToDevto(post, markdown);
    }
  } else if (existing?.devtoUrl) {
    result.devto = { ok: true, url: existing.devtoUrl, id: existing.devtoId ?? undefined };
  }

  // Hashnode
  if (only !== "devto") {
    if (!force && existing?.hashnodeUrl) {
      result.hashnode = { ok: true, url: existing.hashnodeUrl, id: existing.hashnodeId ?? undefined };
    } else {
      result.hashnode = await postToHashnode(post, markdown);
    }
  } else if (existing?.hashnodeUrl) {
    result.hashnode = { ok: true, url: existing.hashnodeUrl, id: existing.hashnodeId ?? undefined };
  }

  // Persist whatever succeeded
  const updates: Partial<typeof blogPosts.$inferInsert> = {};
  if (result.devto.ok && result.devto.url) {
    updates.devtoUrl = result.devto.url;
    updates.devtoId = result.devto.id ?? null;
  }
  if (result.hashnode.ok && result.hashnode.url) {
    updates.hashnodeUrl = result.hashnode.url;
    updates.hashnodeId = result.hashnode.id ?? null;
  }
  if (Object.keys(updates).length > 0) {
    updates.crossPostedAt = new Date();
    updates.updatedAt = new Date();
    if (existing) {
      await db.update(blogPosts).set(updates).where(eq(blogPosts.slug, slug));
    } else {
      await db.insert(blogPosts).values({
        slug,
        status: "published",
        publishedAt: new Date(),
        createdAt: new Date(),
        ...updates,
      });
    }
  }

  return result;
}
