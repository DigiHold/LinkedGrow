import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Allow up to 120s for sequential PageSpeed API calls
export const maxDuration = 120;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://linkedgrow.ai";

// Key pages to check - representative sample covering different page types
const KEY_PAGES = [
  { path: "/", label: "Homepage" },
  { path: "/blog", label: "Blog Listing" },
  { path: "/pricing", label: "Pricing" },
  { path: "/features/ai-post-generator", label: "AI Post Generator" },
];

interface PageSpeedResult {
  url: string;
  label: string;
  score: number;
  lcp: number;
  cls: number;
  fcp: number;
  si: number;
  tbt: number;
  strategy: string;
}

/**
 * GET /api/admin/seo/vitals?strategy=mobile|desktop
 * Runs PageSpeed Insights for key pages (one strategy at a time)
 * Calls run sequentially to avoid Google API rate limits
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const strategy = (request.nextUrl.searchParams.get("strategy") || "mobile") as "mobile" | "desktop";

  try {
    // Run sequentially to avoid PageSpeed API rate limiting
    const vitals: PageSpeedResult[] = [];
    for (const page of KEY_PAGES) {
      const result = await checkPageSpeed(page.path, page.label, strategy);
      if (result) {
        vitals.push(result);
      }
    }

    return NextResponse.json({ vitals });
  } catch (error) {
    console.error("Core Web Vitals check failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check vitals" },
      { status: 500 }
    );
  }
}

async function checkPageSpeed(
  pagePath: string,
  label: string,
  strategy: "mobile" | "desktop"
): Promise<PageSpeedResult | null> {
  const url = pagePath === "/" ? BASE_URL : `${BASE_URL}${pagePath}`;
  const apiKey = process.env.PAGESPEED_API_KEY;
  let apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&strategy=${strategy}`;
  if (apiKey) {
    apiUrl += `&key=${apiKey}`;
  }

  try {
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      console.error(`PageSpeed API error for ${pagePath} (${strategy}): ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const audit = data.lighthouseResult?.audits;
    const score = data.lighthouseResult?.categories?.performance?.score ?? 0;

    return {
      url: pagePath,
      label,
      score: Math.round(score * 100),
      lcp: audit?.["largest-contentful-paint"]?.numericValue ?? 0,
      cls: audit?.["cumulative-layout-shift"]?.numericValue ?? 0,
      fcp: audit?.["first-contentful-paint"]?.numericValue ?? 0,
      si: audit?.["speed-index"]?.numericValue ?? 0,
      tbt: audit?.["total-blocking-time"]?.numericValue ?? 0,
      strategy,
    };
  } catch (error) {
    console.error(`PageSpeed API exception for ${pagePath} (${strategy}):`, error);
    return null;
  }
}
