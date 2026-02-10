import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getRankedKeywords,
  getCompetitors,
  getContentGaps,
  getKeywordSuggestions,
  getKeywordsForSite,
  isConfigured,
} from "@/lib/dataforseo";

const OUR_DOMAIN = "linkedgrow.ai";

// GET - Fetch overview data (ranked keywords + competitors)
export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "DataForSEO credentials not configured" },
      { status: 503 }
    );
  }

  try {
    const [rankedData, competitors] = await Promise.all([
      getRankedKeywords(OUR_DOMAIN, 100),
      getCompetitors(OUR_DOMAIN, 20),
    ]);

    return NextResponse.json({
      rankedKeywords: rankedData,
      competitors,
    });
  } catch (error) {
    console.error("SEO Intelligence GET error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch SEO data",
      },
      { status: 500 }
    );
  }
}

// POST - On-demand actions (content gaps, keyword research)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "DataForSEO credentials not configured" },
      { status: 503 }
    );
  }

  try {
    const { action, competitor, keyword } = await request.json();

    if (action === "content-gaps") {
      if (!competitor) {
        return NextResponse.json(
          { error: "Competitor domain required" },
          { status: 400 }
        );
      }
      const gaps = await getContentGaps(competitor, OUR_DOMAIN, 200);
      return NextResponse.json({ success: true, gaps });
    }

    if (action === "keyword-suggestions") {
      if (!keyword) {
        return NextResponse.json(
          { error: "Seed keyword required" },
          { status: 400 }
        );
      }
      const suggestions = await getKeywordSuggestions(keyword, 100);
      return NextResponse.json({ success: true, suggestions });
    }

    if (action === "keywords-for-site") {
      const suggestions = await getKeywordsForSite(OUR_DOMAIN, 200);
      return NextResponse.json({ success: true, suggestions });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("SEO Intelligence POST error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 }
    );
  }
}
