import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BLOG_POSTS } from "@/lib/blog";
import { getAllPostsWithStatus } from "@/lib/blog";
import { notifySearchEngines } from "@/lib/search-indexing";

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

// Get all public pages that should appear in sitemap
function getPublicPages(): { url: string; label: string }[] {
  return [
    { url: BASE_URL, label: "Homepage" },
    { url: `${BASE_URL}/prelaunch`, label: "Pre-launch" },
    { url: `${BASE_URL}/about`, label: "About" },
    { url: `${BASE_URL}/blog`, label: "Blog" },
    { url: `${BASE_URL}/privacy`, label: "Privacy Policy" },
    { url: `${BASE_URL}/terms`, label: "Terms of Service" },
    { url: `${BASE_URL}/cookies`, label: "Cookie Policy" },
    { url: `${BASE_URL}/sign-in`, label: "Sign In" },
    { url: `${BASE_URL}/sign-up`, label: "Sign Up" },
    { url: `${BASE_URL}/beta`, label: "Beta" },
  ];
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
