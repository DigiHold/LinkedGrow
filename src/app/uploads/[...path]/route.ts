import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import { requestAppUrl } from "@/lib/app-url-server";
import { isCloud } from "@/lib/edition";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { contentTypeForKey, LocalStorage, storageRoot } from "@/lib/storage/local";

function notFound(): NextResponse {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

/**
 * Serves what the local driver stored, at `/uploads/<key>`.
 *
 * Public on purpose: post media is public in the cloud too, and LinkedIn reads
 * it from here when the worker attaches it. The cloud stores nothing on disk,
 * so there it answers 404 for everything.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    if (isCloud()) return notFound();

    const limit = rateLimit(`uploads:${getClientIP(request)}`, {
      maxRequests: 600,
      windowMs: 60 * 1000,
    });
    if (!limit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { path } = await params;
    if (path.some((segment) => segment === "" || segment === "." || segment === "..")) {
      return notFound();
    }
    const key = path.join("/");

    // The same resolve check the driver applies on write: a key that lands
    // outside the root is refused before the disk is touched.
    const storage = new LocalStorage(storageRoot(), await requestAppUrl());
    let file: { size: number; stream: Readable } | null;
    try {
      file = await storage.open(key);
    } catch {
      return notFound();
    }
    if (!file) return notFound();

    const type = contentTypeForKey(key);
    const headers: Record<string, string> = {
      "Content-Type": type,
      "Content-Length": String(file.size),
      "Cache-Control": "public, max-age=31536000, immutable",
    };
    // An SVG is a document that can carry script. Served from our own origin
    // it would run with our cookies, so it is sandboxed.
    if (type === "image/svg+xml") {
      headers["Content-Security-Policy"] = "default-src 'none'; sandbox";
    }

    const body = Readable.toWeb(file.stream) as ReadableStream;
    return new NextResponse(body, { headers });
  } catch {
    return NextResponse.json({ error: "Failed to read the file" }, { status: 500 });
  }
}
