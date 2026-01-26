import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Proxy for R2 images to avoid CORS issues
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

    // Only allow proxying R2 URLs for security
    const allowedDomains = [
      "r2.dev",
      "r2.cloudflarestorage.com",
      "pub-86332bae77404495924b3ef7d4cbe7db.r2.dev",
    ];

    const urlObj = new URL(url);
    const isAllowed = allowedDomains.some(domain => urlObj.hostname.includes(domain));

    if (!isAllowed) {
      return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
    }

    // Fetch the image
    const imageResponse = await fetch(url);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: imageResponse.status }
      );
    }

    const contentType = imageResponse.headers.get("content-type") || "image/webp";
    const imageBuffer = await imageResponse.arrayBuffer();

    // Return the image with CORS headers
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.json(
      { error: "Failed to proxy image" },
      { status: 500 }
    );
  }
}
