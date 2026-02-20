import fs from "fs";
import path from "path";
import { BLOG_POSTS } from "@/lib/blog";

export type PageType =
  | "feature"
  | "audience"
  | "use-case"
  | "industry"
  | "free-tool"
  | "marketing"
  | "blog";

export interface PageSeoData {
  path: string;
  title: string;
  keywords: string[];
  canonical: string | null;
  type: PageType;
}

const BASE_URL = "https://linkedgrow.ai";

// Paths to exclude from analysis (same as sitemap/SEO route)
const EXCLUDED_PATHS = [
  "/dashboard",
  "/api",
  "/onboarding",
  "/checkout",
  "/maintenance",
  "/reset-password",
  "/team/invite",
];

// Determine page type from URL path
function getPageType(pagePath: string): PageType {
  if (pagePath.startsWith("/features/")) return "feature";
  if (pagePath.startsWith("/for/")) return "audience";
  if (pagePath.startsWith("/use-cases/")) return "use-case";
  if (pagePath.startsWith("/industries/")) return "industry";
  if (pagePath.startsWith("/free-tools/")) return "free-tool";
  if (pagePath.startsWith("/blog/")) return "blog";
  return "marketing";
}

// Extract title from metadata export in file content
function extractTitle(content: string): string | null {
  // Match: title: "..." or title: '...' or title: `...`
  const match = content.match(/title:\s*["'`]([^"'`]+)["'`]/);
  if (match) {
    // Remove " | LinkedGrow" suffix for cleaner display
    return match[1].replace(/\s*[\-|]\s*LinkedGrow.*$/, "").trim();
  }
  return null;
}

// Extract keywords array from metadata export in file content
function extractKeywords(content: string): string[] {
  // Match the keywords array in metadata export
  // Pattern: keywords: [ "keyword1", "keyword2", ... ]
  // or keywords: ["keyword1", "keyword2", ...]
  const keywordsMatch = content.match(
    /keywords:\s*\[([\s\S]*?)\]/
  );
  if (!keywordsMatch) return [];

  const arrayContent = keywordsMatch[1];
  const keywords: string[] = [];

  // Extract individual strings from the array
  const stringPattern = /["'`]([^"'`]+)["'`]/g;
  let match;
  while ((match = stringPattern.exec(arrayContent)) !== null) {
    keywords.push(match[1]);
  }

  return keywords;
}

// Extract canonical URL from metadata export in file content
function extractCanonical(content: string): string | null {
  // Match: canonical: "..." or canonical: '...' or canonical: `...`
  const match = content.match(/canonical:\s*["'`]([^"'`]+)["'`]/);
  return match ? match[1] : null;
}

// Recursively find all page.tsx files and extract SEO metadata
function findPagesWithMetadata(
  dir: string,
  basePath: string = ""
): PageSeoData[] {
  const pages: PageSeoData[] = [];

  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (
          item.startsWith("_") ||
          item === "api" ||
          item === "node_modules"
        )
          continue;

        // Route groups: strip (parentheses) from URL
        let urlSegment = item;
        if (item.startsWith("(") && item.endsWith(")")) urlSegment = "";

        // Skip dynamic routes
        if (item.startsWith("[")) continue;

        const newBasePath = urlSegment
          ? `${basePath}/${urlSegment}`
          : basePath;
        pages.push(...findPagesWithMetadata(fullPath, newBasePath));
      } else if (item === "page.tsx" || item === "page.ts") {
        const pagePath = basePath || "/";

        // Skip excluded paths and blog article pages (handled via BLOG_POSTS)
        if (
          EXCLUDED_PATHS.some((excluded) => pagePath.startsWith(excluded))
        )
          continue;
        if (pagePath.startsWith("/blog/")) continue;

        // Read the file and extract metadata
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          const keywords = extractKeywords(content);
          const canonical = extractCanonical(content);
          const title =
            extractTitle(content) ||
            pagePath
              .split("/")
              .filter(Boolean)
              .map(
                (seg) =>
                  seg
                    .split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")
              )
              .join(" > ");

          pages.push({
            path: pagePath,
            title,
            keywords,
            canonical,
            type: getPageType(pagePath),
          });
        } catch {
          // Skip files that can't be read
        }
      }
    }
  } catch {
    // Ignore directory read errors
  }

  return pages;
}

// Get all pages with SEO data: filesystem scan + blog posts
export function getAllPageSeoData(): PageSeoData[] {
  const appDir = path.join(process.cwd(), "src", "app");

  // Auto-extract from page files
  const filePages = findPagesWithMetadata(appDir);

  // Blog posts from registry (already have keywords)
  const blogPages: PageSeoData[] = Object.values(BLOG_POSTS).map((post) => ({
    path: `/blog/${post.slug}`,
    title: post.title,
    keywords: post.keywords,
    canonical: `${BASE_URL}/blog/${post.slug}`,
    type: "blog" as const,
  }));

  return [...filePages, ...blogPages];
}

// Keyword cannibalization analysis
export interface KeywordOverlap {
  keyword: string;
  pages: { path: string; title: string; type: PageType }[];
  severity: "high" | "medium" | "low";
}

export function analyzeKeywordCannibalization(): KeywordOverlap[] {
  const allPages = getAllPageSeoData();
  const keywordMap = new Map<
    string,
    { path: string; title: string; type: PageType }[]
  >();

  for (const page of allPages) {
    for (const keyword of page.keywords) {
      const normalized = keyword.toLowerCase().trim();
      if (!keywordMap.has(normalized)) {
        keywordMap.set(normalized, []);
      }
      keywordMap.get(normalized)!.push({
        path: page.path,
        title: page.title,
        type: page.type,
      });
    }
  }

  const overlaps: KeywordOverlap[] = [];

  for (const [keyword, pages] of keywordMap) {
    if (pages.length < 2) continue;

    // Determine severity
    const types = new Set(pages.map((p) => p.type));
    let severity: "high" | "medium" | "low";

    if (pages.length >= 3) {
      severity = "high";
    } else if (types.size === 1) {
      // Two pages of the same type competing
      severity = "high";
    } else {
      // Two pages of different types - may be intentional
      severity = "medium";
    }

    overlaps.push({ keyword, pages, severity });
  }

  // Sort: high first, then by page count desc
  overlaps.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return b.pages.length - a.pages.length;
  });

  return overlaps;
}

// Canonical URL analysis
export interface CanonicalIssue {
  path: string;
  title: string;
  canonical: string | null;
  expected: string;
  issue: "missing" | "mismatch" | "ok";
  type: PageType;
}

export function analyzeCanonicals(): CanonicalIssue[] {
  const allPages = getAllPageSeoData();
  const results: CanonicalIssue[] = [];

  for (const page of allPages) {
    // Skip pages with no keywords (auth/legal pages) from canonical check
    // They aren't SEO targets
    if (page.keywords.length === 0) continue;

    const expected = `${BASE_URL}${page.path}`;
    if (!page.canonical) {
      results.push({
        path: page.path,
        title: page.title,
        canonical: null,
        expected,
        issue: "missing",
        type: page.type,
      });
    } else if (page.canonical !== expected) {
      results.push({
        path: page.path,
        title: page.title,
        canonical: page.canonical,
        expected,
        issue: "mismatch",
        type: page.type,
      });
    } else {
      results.push({
        path: page.path,
        title: page.title,
        canonical: page.canonical,
        expected,
        issue: "ok",
        type: page.type,
      });
    }
  }

  // Issues first, then ok
  results.sort((a, b) => {
    const issueOrder = { missing: 0, mismatch: 1, ok: 2 };
    return issueOrder[a.issue] - issueOrder[b.issue];
  });

  return results;
}
