import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessFeature, type PlanId } from "@/lib/plans";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

function detectContentType(url: string): "blog" | "webpage" {
  const blogIndicators = ["/blog/", "/post/", "/article/", "/posts/", "/articles/"];
  const blogDomains = ["medium.com", "substack.com", "dev.to", "hashnode.dev", "wordpress.com"];

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

    // Fetch the page HTML
    let response: Response;
    try {
      response = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; LinkedGrow/1.0; +https://linkedgrow.ai)",
          "Accept": "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(15000),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
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
      return NextResponse.json(
        { error: `Failed to fetch the page (HTTP ${response.status}). Please try a different URL.` },
        { status: 502 }
      );
    }

    // Check content type
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return NextResponse.json(
        { error: "This URL doesn't point to a web page. Make sure it's a blog post or article URL." },
        { status: 400 }
      );
    }

    const html = await response.text();

    // Parse with JSDOM and extract with Readability
    const dom = new JSDOM(html, { url: parsedUrl.toString() });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      return NextResponse.json(
        { error: "We couldn't identify an article on this page. This works best with blog posts, news articles, and long-form content. Make sure the URL points to a specific article, not a homepage or listing." },
        { status: 400 }
      );
    }

    // Clean and trim
    const cleanText = article.textContent
      .replace(/\s+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const words = cleanText.split(/\s+/);
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
