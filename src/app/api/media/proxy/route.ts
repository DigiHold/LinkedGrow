import { NextRequest, NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";
import { auth } from "@/lib/auth";
import { isCloud, isSelfHosted } from "@/lib/edition";
import { getStorage } from "@/lib/storage";
import { LocalStorage } from "@/lib/storage/local";

/**
 * A placeholder instead of an error for a file that cannot be read, because
 * a failed image load makes Fabric.js loadFromJSON throw, and that wipes the
 * carousel it was loading.
 */
function placeholder(): NextResponse {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#f3f4f6" rx="8"/><text x="200" y="192" text-anchor="middle" fill="#9ca3af" font-family="system-ui,sans-serif" font-size="14">Image unavailable</text><text x="200" y="216" text-anchor="middle" fill="#d1d5db" font-family="system-ui,sans-serif" font-size="12">Re-upload this image</text></svg>`;
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache, no-store",
    },
  });
}

/** The image, with the CORS header the canvas needs to read its pixels. */
function image(body: BodyInit, contentType: string): NextResponse {
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": getAppUrl(),
    },
  });
}

// Proxy for stored images to avoid CORS issues
// This fetches images server-side and returns them with proper headers
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
    }

    // Only our own storage is proxied. The cloud also keeps its R2 hosts, for
    // the files that predate the current public URL.
    const allowedDomains = [
      "r2.dev",
      "r2.cloudflarestorage.com",
      "pub-86332bae77404495924b3ef7d4cbe7db.r2.dev",
    ];

    // A local file's URL is relative, and parses only against this instance.
    const urlObj = new URL(url, getAppUrl());
    const storage = await getStorage();
    const key = storage.keyFromUrl(url);
    const isAllowed =
      key !== null ||
      (isCloud() && allowedDomains.some((domain) => urlObj.hostname.includes(domain)));

    if (!isAllowed) {
      return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
    }

    // A file on this instance's own disk is read as a file. Fetching the app's
    // public URL from inside the app leaves the container and has to find its
    // way back through the reverse proxy, which it does not always do.
    if (isSelfHosted() && key !== null && storage instanceof LocalStorage) {
      let file: { body: Buffer; contentType: string } | null;
      try {
        file = await storage.read(key);
      } catch {
        file = null;
      }
      return file ? image(new Uint8Array(file.body), file.contentType) : placeholder();
    }

    const imageResponse = await fetch(url);
    if (!imageResponse.ok) return placeholder();

    const contentType = imageResponse.headers.get("content-type") || "image/webp";
    return image(await imageResponse.arrayBuffer(), contentType);
  } catch (error) {
return NextResponse.json(
      { error: "Failed to proxy image" },
      { status: 500 }
    );
  }
}
