import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BLOG_POSTS } from "@/lib/blog";
import { getAllPostsWithStatus } from "@/lib/blog";
import { notifySearchEngines } from "@/lib/search-indexing";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://linkedgrow.ai";

// GET - Fetch SEO overview data
export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all blog posts with their publish status
    const allPosts = await getAllPostsWithStatus(true);

    // Get all public pages from sitemap data
    const pages = getPublicPages();

    // All URLs that should be indexed
    const allUrls = [
      ...pages.map((p) => p.url),
      ...allPosts
        .filter((p) => p.status === "published")
        .map((p) => `${BASE_URL}/blog/${p.slug}`),
    ];

    // Check index status for each URL via Google (site: query simulation)
    // We check by fetching HEAD requests to verify pages are alive (not 404)
    const urlStatuses = await checkUrlStatuses(allUrls);

    // Blog post details with status
    const blogData = allPosts.map((post) => ({
      slug: post.slug,
      title: post.title,
      url: `${BASE_URL}/blog/${post.slug}`,
      status: post.status,
      publishedAt: post.publishedAt,
      scheduledAt: post.scheduledAt,
      category: post.category,
      keywords: post.keywords,
    }));

    // Indexing config status
    const indexingConfig = {
      indexnow: !!process.env.INDEXNOW_KEY,
      googleIndexingApi: !!process.env.GOOGLE_INDEXING_CREDENTIALS,
    };

    return NextResponse.json({
      pages: urlStatuses.filter((u) => !u.url.includes("/blog/")),
      blogPosts: blogData,
      blogUrlStatuses: urlStatuses.filter((u) => u.url.includes("/blog/")),
      allUrlStatuses: urlStatuses,
      indexingConfig,
      totalPosts: BLOG_POSTS.length,
      publishedPosts: allPosts.filter((p) => p.status === "published").length,
      draftPosts: allPosts.filter((p) => p.status === "draft").length,
      scheduledPosts: allPosts.filter((p) => p.status === "scheduled").length,
      totalPages: allUrls.length,
    });
  } catch (error) {
    console.error("Admin SEO API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch SEO data",
      },
      { status: 500 }
    );
  }
}

// POST - Trigger indexing for specific URLs
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { urls, action } = await request.json();

    if (action === "index") {
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return NextResponse.json(
          { error: "URLs array required" },
          { status: 400 }
        );
      }

      const result = await notifySearchEngines(urls);
      return NextResponse.json({ success: true, result });
    }

    if (action === "check-status") {
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return NextResponse.json(
          { error: "URLs array required" },
          { status: 400 }
        );
      }

      const statuses = await checkUrlStatuses(urls);
      return NextResponse.json({ success: true, statuses });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Admin SEO POST error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 }
    );
  }
}

// Paths to exclude from public page listing (same as sitemap)
const EXCLUDED_PATHS = [
  "/dashboard",
  "/api",
  "/onboarding",
  "/checkout",
  "/maintenance",
  "/reset-password",
  "/team/invite",
];

// Recursively find all page.tsx files and convert to URL paths
function findAllPages(dir: string, basePath: string = ""): string[] {
  const pages: string[] = [];
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (item.startsWith("_") || item === "api" || item === "node_modules") continue;
        let urlSegment = item;
        if (item.startsWith("(") && item.endsWith(")")) urlSegment = "";
        if (item.startsWith("[")) continue;
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

// Convert path to readable label
function pathToLabel(pagePath: string): string {
  if (pagePath === "/") return "Homepage";
  return pagePath
    .split("/")
    .filter(Boolean)
    .map((seg) => seg.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "))
    .join(" > ");
}

// Get all public pages by scanning the filesystem (same approach as sitemap.ts)
function getPublicPages(): { url: string; label: string }[] {
  const appDir = path.join(process.cwd(), "src", "app");
  const allPages = findAllPages(appDir);

  return allPages
    .filter((pagePath) => {
      if (EXCLUDED_PATHS.some((excluded) => pagePath.startsWith(excluded))) return false;
      // Skip individual blog articles - they are tracked separately via blog posts section
      if (pagePath.startsWith("/blog/")) return false;
      return true;
    })
    .map((pagePath) => ({
      url: pagePath === "/" ? BASE_URL : `${BASE_URL}${pagePath}`,
      label: pathToLabel(pagePath),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// Check if URLs are live (not 404)
async function checkUrlStatuses(
  urls: string[]
): Promise<
  { url: string; status: number; ok: boolean; responseTime: number }[]
> {
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const start = Date.now();
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      });
      const responseTime = Date.now() - start;
      return {
        url,
        status: res.status,
        ok: res.ok,
        responseTime,
      };
    })
  );

  return results.map((result, i) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    return {
      url: urls[i],
      status: 0,
      ok: false,
      responseTime: 0,
    };
  });
}
