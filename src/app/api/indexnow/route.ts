import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// IndexNow API - Instantly notify search engines of new/updated content
// Supported by: Bing, Yandex, Seznam, Naver, and others
// https://www.indexnow.org/

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://linkedgrow.ai";

// IndexNow endpoints
const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
  "https://yandex.com/indexnow",
];

interface IndexNowRequest {
  urls: string[];
}

/**
 * Submit URLs to IndexNow for instant indexing
 * POST /api/indexnow
 * Body: { urls: ["https://linkedgrow.ai/page1", ...] }
 */
export async function POST(request: NextRequest) {
  // Require authentication for URL submission
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!INDEXNOW_KEY) {
    return NextResponse.json(
      { error: "IndexNow not configured" },
      { status: 500 }
    );
  }

  try {
    const body: IndexNowRequest = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "URLs array required" },
        { status: 400 }
      );
    }

    // Validate URLs belong to our domain
    const validUrls = urls.filter((url) => url.startsWith(BASE_URL));
    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: "No valid URLs for this domain" },
        { status: 400 }
      );
    }

    // Submit to IndexNow
    const payload = {
      host: new URL(BASE_URL).host,
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: validUrls,
    };

    // Submit to multiple endpoints for redundancy
    const results = await Promise.allSettled(
      INDEXNOW_ENDPOINTS.map((endpoint) =>
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      )
    );

    const successful = results.filter(
      (r) => r.status === "fulfilled" && (r.value as Response).ok
    ).length;

    return NextResponse.json({
      success: true,
      submitted: validUrls.length,
      endpoints: successful,
    });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to submit URLs" },
      { status: 500 }
    );
  }
}

/**
 * Get IndexNow status and key info
 * GET /api/indexnow
 *
 * Also handles key verification when ?key=xxx is passed (via rewrite from /:key.txt)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyParam = searchParams.get("key");

  // If key param is present, this is a key verification request (rewritten from /:key.txt)
  if (keyParam !== null) {
    // Only respond for the correct key
    if (!INDEXNOW_KEY || keyParam !== INDEXNOW_KEY) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Return the key as plain text
    return new NextResponse(INDEXNOW_KEY, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  // Default: return status info
  return NextResponse.json({
    configured: !!INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY ? `${BASE_URL}/${INDEXNOW_KEY}.txt` : null,
    endpoints: INDEXNOW_ENDPOINTS,
  });
}
