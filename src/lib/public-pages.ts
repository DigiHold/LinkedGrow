// Shared utility for discovering all public pages from the filesystem.
// Used by: sitemap.ts and cron/index-sitemap

import fs from "fs";
import path from "path";
import { getAllPostsWithStatus } from "@/lib/blog";
import { getAllCategories, getArticlesForCategory } from "@/lib/docs";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://linkedgrow.ai";

// Pages to exclude from public listing (private, utility, auth pages)
const EXCLUDED_PATHS = [
  "/dashboard",
  "/api",
  "/checkout",
  "/maintenance",
  "/reset-password",
  "/team/invite",
  "/network-notifications/invite",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
];

/**
 * Recursively finds all page.tsx files in the app directory
 * and converts them to URL paths.
 */
export function findAllPages(dir: string, basePath: string = ""): string[] {
  const pages: string[] = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (item.startsWith("_") || item === "api" || item === "node_modules") {
          continue;
        }

        // Route groups (parentheses) don't affect the URL
        let urlSegment = item;
        if (item.startsWith("(") && item.endsWith(")")) {
          urlSegment = "";
        }

        // Skip dynamic routes
        if (item.startsWith("[")) {
          continue;
        }

        const newBasePath = urlSegment ? `${basePath}/${urlSegment}` : basePath;
        pages.push(...findAllPages(fullPath, newBasePath));
      } else if (item === "page.tsx" || item === "page.ts") {
        pages.push(basePath || "/");
      }
    }
  } catch {
    // ignore read errors
  }

  return pages;
}

/**
 * Get all public page paths (excluding dashboard, api, auth, blog articles).
 * Blog articles are managed separately via DB.
 */
export function getPublicPagePaths(): string[] {
  const appDir = path.join(process.cwd(), "src", "app");
  const allPages = findAllPages(appDir);

  return allPages.filter((pagePath) => {
    if (EXCLUDED_PATHS.some((excluded) => pagePath.startsWith(excluded))) return false;
    if (pagePath.startsWith("/blog/")) return false;
    return true;
  });
}

/**
 * Get ALL URLs that should be submitted to search engines.
 * Includes: public pages + published blog posts + docs pages.
 */
export async function getAllIndexableUrls(): Promise<string[]> {
  // Static pages from filesystem
  const pagePaths = getPublicPagePaths();
  const pageUrls = pagePaths.map((p) => (p === "/" ? BASE_URL : `${BASE_URL}${p}`));

  // Published blog posts from DB
  const publishedPosts = await getAllPostsWithStatus(false);
  const blogUrls = publishedPosts.map((post) => `${BASE_URL}/blog/${post.slug}`);

  // Docs pages
  const docsUrls: string[] = [];
  const categories = getAllCategories();
  for (const cat of categories) {
    docsUrls.push(`${BASE_URL}/docs/${cat.slug}`);
    const articles = getArticlesForCategory(cat.slug);
    for (const article of articles) {
      docsUrls.push(`${BASE_URL}/docs/${cat.slug}/${article.slug}`);
    }
  }

  return [...pageUrls, ...blogUrls, ...docsUrls];
}
