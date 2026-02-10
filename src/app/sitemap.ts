import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { getAllPostsWithStatus } from "@/lib/blog";

const BASE_URL = "https://linkedgrow.ai";

// Pages to exclude from sitemap (private, utility pages)
const EXCLUDED_PATHS = [
  "/dashboard",
  "/api",
  "/onboarding",
  "/checkout",
  "/maintenance",
  "/reset-password", // Has dynamic token
  "/team/invite", // Private team invite page
];

// Priority configuration for different page types
const PRIORITY_CONFIG: Record<string, { priority: number; changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" }> = {
  "/": { priority: 1.0, changeFrequency: "weekly" },
  "/prelaunch": { priority: 0.9, changeFrequency: "weekly" },
  "/about": { priority: 0.8, changeFrequency: "monthly" },
  "/privacy": { priority: 0.3, changeFrequency: "yearly" },
  "/cookies": { priority: 0.3, changeFrequency: "yearly" },
  "/terms": { priority: 0.3, changeFrequency: "yearly" },
  "/sign-in": { priority: 0.5, changeFrequency: "monthly" },
  "/sign-up": { priority: 0.6, changeFrequency: "monthly" },
  "/forgot-password": { priority: 0.4, changeFrequency: "monthly" },
  "/blog": { priority: 0.9, changeFrequency: "weekly" },
  "/pricing": { priority: 0.8, changeFrequency: "monthly" },
};

// Priority for page path prefixes (matched if exact config not found)
const PREFIX_PRIORITY: Record<string, { priority: number; changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" }> = {
  "/for/": { priority: 0.7, changeFrequency: "monthly" },
  "/use-cases/": { priority: 0.7, changeFrequency: "monthly" },
  "/industries/": { priority: 0.7, changeFrequency: "monthly" },
};

// Default priority for pages not in config
const DEFAULT_CONFIG = { priority: 0.5, changeFrequency: "monthly" as const };

/**
 * Recursively finds all page.tsx files in the app directory
 * and converts them to URL paths
 */
function findAllPages(dir: string, basePath: string = ""): string[] {
  const pages: string[] = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip api, node_modules, and other non-page directories
        if (item.startsWith("_") || item === "api" || item === "node_modules") {
          continue;
        }

        // Handle route groups (folders starting with parentheses)
        // e.g., (auth), (marketing) - these don't affect the URL
        let urlSegment = item;
        if (item.startsWith("(") && item.endsWith(")")) {
          urlSegment = ""; // Route groups don't add to URL
        }

        // Handle dynamic routes - skip them for now
        // e.g., [id], [slug], [...catchAll]
        if (item.startsWith("[")) {
          continue;
        }

        const newBasePath = urlSegment ? `${basePath}/${urlSegment}` : basePath;
        pages.push(...findAllPages(fullPath, newBasePath));
      } else if (item === "page.tsx" || item === "page.ts") {
        // Found a page file
        const pagePath = basePath || "/";
        pages.push(pagePath);
      }
    }
  } catch (error) {
    console.error("Error reading directory:", dir, error);
  }

  return pages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date().toISOString();

  // Get the app directory path
  const appDir = path.join(process.cwd(), "src", "app");

  // Find all pages automatically
  const allPages = findAllPages(appDir);

  // Filter out excluded paths and blog article pages (blog posts are added from DB below)
  const sitemapEntries: MetadataRoute.Sitemap = allPages
    .filter((pagePath) => {
      // Check if this path should be excluded
      if (EXCLUDED_PATHS.some((excluded) => pagePath.startsWith(excluded))) return false;
      // Skip individual blog article pages - they are managed via DB (published only)
      if (pagePath.startsWith("/blog/")) return false;
      return true;
    })
    .map((pagePath) => {
      const config = PRIORITY_CONFIG[pagePath]
        || Object.entries(PREFIX_PRIORITY).find(([prefix]) => pagePath.startsWith(prefix))?.[1]
        || DEFAULT_CONFIG;

      return {
        url: pagePath === "/" ? BASE_URL : `${BASE_URL}${pagePath}`,
        lastModified: currentDate,
        changeFrequency: config.changeFrequency,
        priority: config.priority,
      };
    })
    // Sort by priority (highest first)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // Add blog post entries (published only)
  const blogPosts = await getAllPostsWithStatus(false);
  for (const post of blogPosts) {
    sitemapEntries.push({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt || post.publishedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return sitemapEntries;
}
