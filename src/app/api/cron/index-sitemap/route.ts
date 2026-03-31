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
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const verifyUrl = `${BASE_URL}/api/cron/index-sitemap`;

    let isValid = false;
    try {
      isValid = await receiver.verify({ signature, body, url: verifyUrl });
    } catch {
      try {
        isValid = await receiver.verify({ signature, body });
      } catch {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Dynamically discover ALL public URLs (pages + blog posts + docs)
    const allUrls = await getAllIndexableUrls();

    // Submit all URLs to search engines
    const result = await notifySearchEngines(allUrls);

    return NextResponse.json({
      success: true,
      urlCount: allUrls.length,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to index sitemap",
      },
      { status: 500 }
    );
  }
}
