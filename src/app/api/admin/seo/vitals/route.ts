import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Single page check completes in 15-30s, well within Vercel timeout
export const maxDuration = 60;

const BASE_URL = "https://linkedgrow.ai";

/**
 * GET /api/admin/seo/vitals?strategy=mobile&path=/
 * Proxies a single PageSpeed Insights call with API key
 * Frontend calls this once per page to show progressive results
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const strategy = request.nextUrl.searchParams.get("strategy") || "mobile";
  const pagePath = request.nextUrl.searchParams.get("path") || "/";
  const label = request.nextUrl.searchParams.get("label") || pagePath;

  const url = pagePath === "/" ? BASE_URL : `${BASE_URL}${pagePath}`;
  const apiKey = process.env.PAGESPEED_API_KEY;

  let apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&strategy=${strategy}`;
  if (apiKey) {
    apiUrl += `&key=${apiKey}`;
  }

  try {
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.error(`PageSpeed API ${res.status} for ${pagePath}: ${errorText}`);
      return NextResponse.json(
        { error: `PageSpeed API returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const audit = data.lighthouseResult?.audits;
    const score = data.lighthouseResult?.categories?.performance?.score ?? 0;

    return NextResponse.json({
      vital: {
        url: pagePath,
        label,
        score: Math.round(score * 100),
        lcp: audit?.["largest-contentful-paint"]?.numericValue ?? 0,
        cls: audit?.["cumulative-layout-shift"]?.numericValue ?? 0,
        fcp: audit?.["first-contentful-paint"]?.numericValue ?? 0,
        si: audit?.["speed-index"]?.numericValue ?? 0,
        tbt: audit?.["total-blocking-time"]?.numericValue ?? 0,
        strategy,
      },
    });
  } catch (error) {
    console.error(`PageSpeed exception for ${pagePath}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PageSpeed check failed" },
      { status: 500 }
    );
  }
}
