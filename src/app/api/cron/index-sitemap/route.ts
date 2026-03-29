import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { notifySearchEngines } from "@/lib/search-indexing";
import { getAllIndexableUrls } from "@/lib/public-pages";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://linkedgrow.ai";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

/**
 * Daily QStash scheduled job - submits ALL public URLs to search engines.
 * Dynamically discovers pages from filesystem + blog posts from DB + docs.
 * IndexNow and Google Indexing API handle re-submissions gracefully,
 * they only re-crawl if content has actually changed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    const signature = request.headers.get("upstash-signature");
    if (!signature) {
      console.error("QStash index-sitemap: missing upstash-signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const verifyUrl = `${BASE_URL}/api/cron/index-sitemap`;

    let isValid = false;
    try {
      isValid = await receiver.verify({ signature, body, url: verifyUrl });
    } catch (verifyError) {
      console.warn("QStash index-sitemap: URL-bound verify failed, retrying without URL:", {
        verifyUrl,
        error: verifyError instanceof Error ? verifyError.message : verifyError,
      });
      try {
        isValid = await receiver.verify({ signature, body });
      } catch (fallbackError) {
        console.error("QStash index-sitemap: signature verification failed completely:", {
          verifyUrl,
          error: fallbackError instanceof Error ? fallbackError.message : fallbackError,
        });
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    if (!isValid) {
      console.error("QStash index-sitemap: signature returned invalid", { verifyUrl });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Dynamically discover ALL public URLs (pages + blog posts + docs)
    const allUrls = await getAllIndexableUrls();

    // Submit all URLs to search engines
    const result = await notifySearchEngines(allUrls);

    console.log(
      `[Cron] Auto-indexed ${allUrls.length} URLs:`,
      JSON.stringify(result)
    );

    return NextResponse.json({
      success: true,
      urlCount: allUrls.length,
      result,
    });
  } catch (error) {
    console.error("[Cron] Index sitemap error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to index sitemap",
      },
      { status: 500 }
    );
  }
}
