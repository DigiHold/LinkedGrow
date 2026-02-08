import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { cmsPages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "https://linkedgrow.ai";

// Pages to exclude from sitemap (private, utility pages)
const EXCLUDED_PATHS = [
  "/dashboard",
  "/api",
  "/admin",
  "/onboarding",
  "/checkout",
  "/maintenance",
  "/reset-password", // Has dynamic token
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

// CMS page type priorities
const CMS_PRIORITY: Record<string, { priority: number; changeFrequency: "weekly" | "monthly" }> = {
  audience: { priority: 0.8, changeFrequency: "monthly" },
  feature: { priority: 0.8, changeFrequency: "monthly" },
  blog: { priority: 0.7, changeFrequency: "weekly" },
  "free-tool": { priority: 0.7, changeFrequency: "monthly" },
  "use-case": { priority: 0.6, changeFrequency: "monthly" },
  industry: { priority: 0.6, changeFrequency: "monthly" },
  comparison: { priority: 0.6, changeFrequency: "monthly" },
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date().toISOString();

  // Get the app directory path
  const appDir = path.join(process.cwd(), "src", "app");

  // Find all static pages automatically
  const allPages = findAllPages(appDir);

  // Filter out excluded paths and build sitemap entries
  const staticEntries: MetadataRoute.Sitemap = allPages
    .filter((pagePath) => {
      return !EXCLUDED_PATHS.some((excluded) => pagePath.startsWith(excluded));
    })
    .map((pagePath) => {
      const config = PRIORITY_CONFIG[pagePath] || DEFAULT_CONFIG;

      return {
        url: pagePath === "/" ? BASE_URL : `${BASE_URL}${pagePath}`,
        lastModified: currentDate,
        changeFrequency: config.changeFrequency,
        priority: config.priority,
      };
    });

  // Fetch published CMS pages from database
  let cmsEntries: MetadataRoute.Sitemap = [];
  try {
    const publishedPages = await db
      .select({ slug: cmsPages.slug, pageType: cmsPages.pageType, updatedAt: cmsPages.updatedAt })
      .from(cmsPages)
      .where(eq(cmsPages.status, "published"));

    cmsEntries = publishedPages.filter((page) => page.pageType !== "static").map((page) => {
      const config = CMS_PRIORITY[page.pageType] || { priority: 0.5, changeFrequency: "monthly" as const };
      return {
        url: `${BASE_URL}/${page.slug}`,
        lastModified: page.updatedAt ? new Date(page.updatedAt).toISOString() : currentDate,
        changeFrequency: config.changeFrequency,
        priority: config.priority,
      };
    });
  } catch {
    // DB might not have the table yet during build
  }

  // Combine and sort by priority
  return [...staticEntries, ...cmsEntries].sort((a, b) => (b.priority || 0) - (a.priority || 0));
}
