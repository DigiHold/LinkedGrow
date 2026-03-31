import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BLOG_POSTS } from "@/lib/blog";
import { getAllPostsWithStatus } from "@/lib/blog";
import { notifySearchEngines } from "@/lib/search-indexing";
import {
  analyzeKeywordCannibalization,
  analyzeCanonicals,
} from "@/lib/page-keywords";
import { findAllPages, getPublicPagePaths } from "@/lib/public-pages";
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

    // Get all public pages from filesystem scan
    const pages = getPublicPages();

    // Filesystem-discovered pages are guaranteed to exist (compiled by Next.js)
    // No HTTP check needed - eliminates false positives from server-to-server requests
    const pageStatuses = pages.map((p) => ({
      url: p.url,
      status: 200,
      ok: true,
      responseTime: 0,
    }));

    // Blog posts registered in BLOG_POSTS are filesystem-verified (same as pages)
    // Server-to-server HTTP checks on Vercel cause false positives (self-referencing, cold starts)
    const publishedBlogUrls = allPosts
      .filter((p) => p.status === "published")
      .map((p) => `${BASE_URL}/blog/${p.slug}`);
    const blogUrlStatuses = publishedBlogUrls.map((url) => ({
      url,
      status: 200,
      ok: true,
      responseTime: 0,
    }));

    const allUrlStatuses = [...pageStatuses, ...blogUrlStatuses];

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

    // Keyword cannibalization analysis (GSC-powered) + canonical analysis + broken links in parallel
    const [keywordOverlaps, canonicalStatuses, brokenLinks] = await Promise.all([
      analyzeKeywordCannibalization(),
      Promise.resolve(analyzeCanonicals()),
      Promise.resolve(scanBrokenInternalLinks()),
    ]);

    return NextResponse.json({
      pages: pageStatuses,
      blogPosts: blogData,
      blogUrlStatuses,
      allUrlStatuses,
      indexingConfig,
      totalPosts: BLOG_POSTS.length,
      publishedPosts: allPosts.filter((p) => p.status === "published").length,
      draftPosts: allPosts.filter((p) => p.status === "draft").length,
      scheduledPosts: allPosts.filter((p) => p.status === "scheduled").length,
      totalPages: pageStatuses.length + publishedBlogUrls.length,
      keywordOverlaps,
      canonicalStatuses,
      brokenLinks,
    });
  } catch (error) {
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

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 }
    );
  }
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

// Get all public pages by scanning the filesystem (uses shared utility)
function getPublicPages(): { url: string; label: string }[] {
  const pagePaths = getPublicPagePaths();

  return pagePaths
    .map((pagePath) => ({
      url: pagePath === "/" ? BASE_URL : `${BASE_URL}${pagePath}`,
      label: pathToLabel(pagePath),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// Scan all page files for broken internal links
function scanBrokenInternalLinks(): { source: string; href: string; type: "page" | "blog" }[] {
  const appDir = path.join(process.cwd(), "src", "app");
  const allPages = findAllPages(appDir, "");
  const allPagePaths = new Set(allPages);

  // Also add blog article slugs as valid paths
  for (const post of Object.values(BLOG_POSTS)) {
    allPagePaths.add(`/blog/${post.slug}`);
  }

  // Add known special paths that resolve but aren't page.tsx files
  allPagePaths.add("/blog"); // blog listing

  const broken: { source: string; href: string; type: "page" | "blog" }[] = [];

  // Scan all page.tsx and content files for internal links
  function scanDir(dir: string, basePath: string = "") {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (item.startsWith("_") || item === "api" || item === "node_modules" || item === ".next") continue;
          let urlSegment = item;
          if (item.startsWith("(") && item.endsWith(")")) urlSegment = "";
          if (item.startsWith("[")) continue;
          const newBasePath = urlSegment ? `${basePath}/${urlSegment}` : basePath;
          scanDir(fullPath, newBasePath);
        } else if (item.endsWith(".tsx") || item.endsWith(".ts")) {
          // Skip non-page utility files
          if (item.startsWith("_")) continue;
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            const sourcePage = basePath || "/";

            // Match href="/path" and href={"/path"} patterns (internal links only)
            const hrefRegex = /href=(?:{?"|\{")(\/?(?:blog|features|for|use-cases|industries|free-tools|pricing|about|sign-up|sign-in|affiliate|prelaunch)[^"'}]*)/g;
            let match;
            while ((match = hrefRegex.exec(content)) !== null) {
              let href = match[1];
              // Ensure leading slash
              if (!href.startsWith("/")) href = `/${href}`;
              // Strip trailing slash and hash fragments
              href = href.replace(/\/+$/, "").replace(/#.*$/, "");
              if (!href) continue;
              // Check if the path exists
              if (!allPagePaths.has(href)) {
                broken.push({
                  source: sourcePage,
                  href,
                  type: href.startsWith("/blog/") ? "blog" : "page",
                });
              }
            }
          } catch {
            // Skip unreadable files
          }
        }
      }
    } catch {
      // Ignore directory errors
    }
  }

  scanDir(appDir);

  // Deduplicate
  const seen = new Set<string>();
  return broken.filter((b) => {
    const key = `${b.source}:${b.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

