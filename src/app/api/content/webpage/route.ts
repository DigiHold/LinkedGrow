import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessFeature, type PlanId } from "@/lib/plans";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

function detectContentType(url: string): "blog" | "webpage" {
  const blogIndicators = ["/blog/", "/post/", "/article/", "/posts/", "/articles/", "/p/", "/note/"];
  const blogDomains = ["medium.com", "substack.com", "dev.to", "hashnode.dev", "wordpress.com", "ghost.io", "beehiiv.com", "mirror.xyz"];

  const lowerUrl = url.toLowerCase();

  for (const indicator of blogIndicators) {
    if (lowerUrl.includes(indicator)) return "blog";
  }

  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    for (const domain of blogDomains) {
      if (hostname.includes(domain)) return "blog";
    }
  } catch {
    // Invalid URL - treat as webpage
  }

  return "webpage";
}

// Max HTML size: 3MB - prevents memory issues with very large pages
const MAX_HTML_SIZE = 3 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check plan access
    const [user] = await db.select({ plan: users.plan }).from(users).where(eq(users.id, session.user.id));
    const userPlan = (user?.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "contentRepurposing")) {
      return NextResponse.json(
        { error: "Content repurposing requires a Starter plan or higher. Please upgrade to access this feature." },
        { status: 403 }
      );
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Please enter a valid URL" }, { status: 400 });
    }

    // SSRF protection: only allow http/https and block internal/private IPs
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return NextResponse.json({ error: "Only HTTP and HTTPS URLs are supported." }, { status: 400 });
    }
    const hostname = parsedUrl.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\./,
      /^\[::1\]$/,
      /^\[fc/i,
      /^\[fd/i,
      /^\[fe80:/i,
      /\.local$/i,
      /\.internal$/i,
    ];
    if (blockedPatterns.some(p => p.test(hostname))) {
      return NextResponse.json({ error: "This URL is not allowed." }, { status: 400 });
    }

    // Fetch the page HTML with browser-like headers to avoid bot blocking
    let response: Response;
    try {
      response = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        },
        signal: AbortSignal.timeout(15000),
        redirect: "follow",
      });
    } catch (error) {
      if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
        return NextResponse.json(
          { error: "This page took too long to load. Please check the URL and try again." },
          { status: 408 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch the page. Please check the URL and try again." },
        { status: 502 }
      );
    }

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "This page doesn't exist or has been removed." },
          { status: 404 }
        );
      }
      if (response.status === 403 || response.status === 401) {
        return NextResponse.json(
          { error: "This page requires login or is blocking automated access. Try a publicly accessible article." },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: `Failed to fetch the page (HTTP ${response.status}). Please try a different URL.` },
        { status: 502 }
      );
    }

    // Check content type
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml") && !contentType.includes("text/plain")) {
      return NextResponse.json(
        { error: "This URL doesn't point to a web page. Make sure it's a blog post or article URL." },
        { status: 400 }
      );
    }

    // Read HTML with size limit
    let html: string;
    try {
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > MAX_HTML_SIZE) {
        // Truncate to MAX_HTML_SIZE - still try to parse what we have
        html = new TextDecoder().decode(buffer.slice(0, MAX_HTML_SIZE));
      } else {
        html = new TextDecoder().decode(buffer);
      }
    } catch {
      return NextResponse.json(
        { error: "Failed to read the page content. Please try again." },
        { status: 500 }
      );
    }

    if (!html || html.length < 100) {
      return NextResponse.json(
        { error: "The page returned empty or very little content. Make sure the URL points to an article." },
        { status: 400 }
      );
    }

    // Parse with JSDOM and extract with Readability - wrapped in try/catch
    let article: { title: string; textContent: string; excerpt: string } | null = null;
    try {
      const dom = new JSDOM(html, { url: parsedUrl.toString() });
      const reader = new Readability(dom.window.document);
      const parsed = reader.parse();
      if (parsed) {
        article = {
          title: parsed.title || "",
          textContent: parsed.textContent || "",
          excerpt: parsed.excerpt || "",
        };
      }
    } catch (parseError) {
      console.error("JSDOM/Readability parse error:", parseError);
      // Try a simpler extraction as fallback: strip all HTML tags
      try {
        const textOnly = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (textOnly.length > 200) {
          const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
          article = {
            title: titleMatch ? titleMatch[1].trim() : "",
            textContent: textOnly,
            excerpt: textOnly.substring(0, 200),
          };
        }
      } catch {
        // Fallback also failed
      }
    }

    if (!article || !article.textContent || article.textContent.trim().length < 50) {
      return NextResponse.json(
        { error: "We couldn't extract article content from this page. This works best with blog posts, news articles, and long-form content. Try a different URL or a page with more text content." },
        { status: 400 }
      );
    }

    // Clean and trim
    const cleanText = article.textContent
      .replace(/\s+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const words = cleanText.split(/\s+/).filter(w => w.length > 0);
    const trimmedContent = words.slice(0, 4000).join(" ");

    // Detect content type
    const sourceType = detectContentType(url);

    // Build warnings
    let warning: string | undefined;
    if (words.length < 100) {
      return NextResponse.json(
        { error: "This article appears to be behind a paywall or requires login. Only the preview text was extracted. Try a freely accessible article." },
        { status: 400 }
      );
    }
    if (words.length < 200) {
      warning = "This article is very short. The AI may not have enough context to generate a strong post. Consider using a longer article for better results.";
    }

    return NextResponse.json({
      source: sourceType,
      title: article.title || "",
      content: trimmedContent,
      wordCount: words.length,
      metadata: {
        excerpt: article.excerpt || "",
      },
      warning,
    });
  } catch (error) {
    console.error("Webpage extraction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to extract page content" },
      { status: 500 }
    );
  }
}
