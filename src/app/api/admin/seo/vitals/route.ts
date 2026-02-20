import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

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
 * GET /api/admin/seo/vitals
 * Runs PageSpeed Insights for key pages (mobile strategy)
 * Free API - no key required for basic usage
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await Promise.allSettled(
      KEY_PAGES.map((page) => checkPageSpeed(page.path, page.label))
    );

    const vitals: PageSpeedResult[] = [];
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        vitals.push(result.value);
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
  label: string
): Promise<PageSpeedResult | null> {
  const url = pagePath === "/" ? BASE_URL : `${BASE_URL}${pagePath}`;
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&strategy=mobile`;

  try {
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) return null;

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
      strategy: "mobile",
    };
  } catch {
    return null;
  }
}
