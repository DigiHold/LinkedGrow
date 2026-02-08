// CMS Library - Lightweight headless CMS for marketing pages
import { db } from "./db";
import { cmsPages } from "./db/schema";
import { eq, desc } from "drizzle-orm";

// ============================================
// CONTENT BLOCK TYPES
// ============================================

export type ContentBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "text"; html: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "faq"; items: FAQItem[] }
  | { type: "cta"; text: string; href: string; variant: "primary" | "secondary" }
  | { type: "separator" };

export type FAQItem = {
  question: string;
  answer: string;
};

export type PageType =
  | "audience"
  | "feature"
  | "free-tool"
  | "use-case"
  | "industry"
  | "blog"
  | "comparison"
  | "static";

export type PageStatus = "draft" | "published";

export type TranslationData = {
  content: ContentBlock[];
  faq: FAQItem[];
  seoTitle?: string;
  seoDescription?: string;
};

export type Translations = Partial<Record<string, TranslationData>>;

export interface CMSPageData {
  id: string;
  slug: string;
  pageType: PageType;
  status: PageStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  content: ContentBlock[];
  faq: FAQItem[] | null;
  translations: Translations | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  publishedAt: Date | null;
}

// ============================================
// DATA ACCESS
// ============================================

/**
 * Get a published page by its slug
 */
export async function getPublishedPage(slug: string): Promise<CMSPageData | null> {
  const page = await db.query.cmsPages.findFirst({
    where: eq(cmsPages.slug, slug),
  });

  if (!page || page.status !== "published") return null;

  return parsePage(page);
}

/**
 * Get any page by slug (published or draft) - admin only
 */
export async function getPageBySlug(slug: string): Promise<CMSPageData | null> {
  const page = await db.query.cmsPages.findFirst({
    where: eq(cmsPages.slug, slug),
  });

  if (!page) return null;

  return parsePage(page);
}

/**
 * Get all pages, optionally filtered by type
 */
export async function getAllPages(pageType?: PageType): Promise<CMSPageData[]> {
  let pages;

  if (pageType) {
    pages = await db
      .select()
      .from(cmsPages)
      .where(eq(cmsPages.pageType, pageType))
      .orderBy(desc(cmsPages.updatedAt));
  } else {
    pages = await db
      .select()
      .from(cmsPages)
      .orderBy(desc(cmsPages.updatedAt));
  }

  return pages.map(parsePage);
}

/**
 * Get all published pages of a given type (for sitemap, listings)
 */
export async function getPublishedPagesByType(pageType: PageType): Promise<CMSPageData[]> {
  const pages = await db
    .select()
    .from(cmsPages)
    .where(eq(cmsPages.pageType, pageType))
    .orderBy(desc(cmsPages.publishedAt));

  return pages.filter((p) => p.status === "published").map(parsePage);
}

// ============================================
// HELPERS
// ============================================

function parsePage(page: typeof cmsPages.$inferSelect): CMSPageData {
  let content: ContentBlock[] = [];
  let faq: FAQItem[] | null = null;
  let translations: Translations | null = null;

  try {
    content = JSON.parse(page.content || "[]");
  } catch {
    content = [];
  }

  try {
    faq = page.faq ? JSON.parse(page.faq) : null;
  } catch {
    faq = null;
  }

  try {
    translations = page.translations ? JSON.parse(page.translations) : null;
  } catch {
    translations = null;
  }

  return {
    id: page.id,
    slug: page.slug,
    pageType: page.pageType as PageType,
    status: (page.status || "draft") as PageStatus,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    seoKeywords: page.seoKeywords,
    ogTitle: page.ogTitle,
    ogDescription: page.ogDescription,
    ogImage: page.ogImage,
    canonicalUrl: page.canonicalUrl,
    content,
    faq,
    translations,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    publishedAt: page.publishedAt,
  };
}

/**
 * Build the URL path for a CMS page based on its slug
 */
export function getPageUrl(slug: string): string {
  return `/${slug}`;
}

/**
 * Build the canonical URL for a CMS page
 */
export function getCanonicalUrl(slug: string): string {
  return `https://linkedgrow.ai/${slug}`;
}

/**
 * Page type labels for the admin UI
 */
export const PAGE_TYPE_LABELS: Record<PageType, string> = {
  audience: "Audience",
  feature: "Feature",
  "free-tool": "Free Tool",
  "use-case": "Use Case",
  industry: "Industry",
  blog: "Blog Post",
  comparison: "Comparison",
  static: "Static Page",
};

/**
 * Page type URL prefixes
 */
export const PAGE_TYPE_PREFIXES: Record<PageType, string> = {
  audience: "for",
  feature: "features",
  "free-tool": "free-tools",
  "use-case": "use-cases",
  industry: "industries",
  blog: "blog",
  comparison: "compare",
  static: "",
};
