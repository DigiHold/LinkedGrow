import fs from "fs";
import path from "path";
import { BLOG_POSTS } from "@/lib/blog";
import { getQueryPagePairs } from "@/lib/search-console";

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

// Non-SEO pages to skip in canonical analysis
const NON_SEO_PATHS = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/privacy",
  "/terms",
  "/cookies",
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

// Extract canonical URL from metadata export in file content
function extractCanonical(content: string): string | null {
  // Match: canonical: "..." or canonical: '...' or canonical: `...`
  const match = content.match(/canonical:\s*["'`]([^"'`]+)["'`]/);
  return match ? match[1] : null;
}

// Prettify a URL path into a readable title
function prettifyPath(pagePath: string): string {
  if (pagePath === "/") return "Homepage";
  return pagePath
    .split("/")
    .filter(Boolean)
    .map((seg) =>
      seg
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    )
    .join(" > ");
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
          const canonical = extractCanonical(content);
          const title = extractTitle(content) || prettifyPath(pagePath);

          pages.push({
            path: pagePath,
            title,
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

  // Blog posts from registry
  const blogPages: PageSeoData[] = Object.values(BLOG_POSTS).map((post) => ({
    path: `/blog/${post.slug}`,
    title: post.title,
    canonical: `${BASE_URL}/blog/${post.slug}`,
    type: "blog" as const,
  }));

  return [...filePages, ...blogPages];
}

// Keyword cannibalization analysis (powered by Google Search Console)
export interface KeywordOverlap {
  keyword: string;
  pages: {
    path: string;
    title: string;
    type: PageType;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
  severity: "high" | "medium" | "low";
  totalImpressions: number;
  totalClicks: number;
}

export async function analyzeKeywordCannibalization(): Promise<KeywordOverlap[]> {
  try {
    // Date range: last 28 days minus 2-day GSC reporting delay
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 2);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 27);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const response = await getQueryPagePairs(
      formatDate(startDate),
      formatDate(endDate)
    );

    if (!response.rows || response.rows.length === 0) {
      return [];
    }

    // Build title map from filesystem + blog registry for enrichment
    const allPages = getAllPageSeoData();
    const titleMap = new Map<string, { title: string; type: PageType }>();
    for (const page of allPages) {
      titleMap.set(page.path, { title: page.title, type: page.type });
    }

    // Group by query: Map<query, Array<{page, clicks, impressions, ctr, position}>>
    const queryMap = new Map<
      string,
      Array<{
        page: string;
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
      }>
    >();

    for (const row of response.rows) {
      const query = row.keys[0];
      const page = row.keys[1];

      if (!queryMap.has(query)) {
        queryMap.set(query, []);
      }
      queryMap.get(query)!.push({
        page,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      });
    }

    // Filter to queries with 2+ pages (actual cannibalization)
    const overlaps: KeywordOverlap[] = [];

    for (const [query, pageEntries] of queryMap) {
      if (pageEntries.length < 2) continue;

      const totalImpressions = pageEntries.reduce(
        (sum, p) => sum + p.impressions,
        0
      );
      const totalClicks = pageEntries.reduce((sum, p) => sum + p.clicks, 0);

      // Skip low-volume queries (noise filter)
      if (totalImpressions < 5) continue;

      // Determine severity based on search volume and position spread
      const positions = pageEntries.map((p) => p.position);
      const multipleInTop20 = positions.filter((p) => p <= 20).length >= 2;
      const minPosition = Math.min(...positions);
      const maxPosition = Math.max(...positions);
      const positionSpread = maxPosition - minPosition;

      let severity: "high" | "medium" | "low";

      if (totalImpressions >= 100 && multipleInTop20) {
        severity = "high";
      } else if (
        totalImpressions >= 20 &&
        (multipleInTop20 || positionSpread < 10)
      ) {
        severity = "medium";
      } else {
        severity = "low";
      }

      // Build page info with path derived from full URL
      const pages = pageEntries
        .sort((a, b) => a.position - b.position)
        .map((entry) => {
          const pagePath = entry.page.replace(BASE_URL, "") || "/";
          const known = titleMap.get(pagePath);
          return {
            path: pagePath,
            title: known?.title || prettifyPath(pagePath),
            type: known?.type || getPageType(pagePath),
            clicks: entry.clicks,
            impressions: entry.impressions,
            ctr: entry.ctr,
            position: entry.position,
          };
        });

      overlaps.push({
        keyword: query,
        pages,
        severity,
        totalImpressions,
        totalClicks,
      });
    }

    // Sort: high severity first, then by total impressions descending
    overlaps.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.totalImpressions - a.totalImpressions;
    });

    return overlaps;
  } catch (error) {
    console.error("Keyword cannibalization analysis failed:", error);
    return [];
  }
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
    // Skip auth/legal pages that aren't SEO targets
    if (
      NON_SEO_PATHS.some(
        (p) => page.path === p || page.path.startsWith(p + "/")
      )
    )
      continue;

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
