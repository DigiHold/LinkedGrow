import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { notifySearchEngines } from "@/lib/search-indexing";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    const signature = request.headers.get("upstash-signature");
    if (!signature) {
      console.error("QStash publish-blog: missing upstash-signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/qstash/publish-blog`;

    let isValid = false;
    try {
      isValid = await receiver.verify({ signature, body, url: verifyUrl });
    } catch (verifyError) {
      // URL mismatch is the most common cause - retry without URL binding
      console.warn("QStash publish-blog: URL-bound verify failed, retrying without URL:", {
        verifyUrl,
        error: verifyError instanceof Error ? verifyError.message : verifyError,
      });
      try {
        isValid = await receiver.verify({ signature, body });
      } catch (fallbackError) {
        console.error("QStash publish-blog: signature verification failed completely:", {
          verifyUrl,
          error: fallbackError instanceof Error ? fallbackError.message : fallbackError,
          bodyPreview: body.substring(0, 200),
        });
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    if (!isValid) {
      console.error("QStash publish-blog: signature returned invalid", { verifyUrl });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { slug } = JSON.parse(body);
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const blogPost = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.slug, slug),
    });

    if (!blogPost) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    // Only publish if still scheduled (could have been manually published or unscheduled)
    if (blogPost.status !== "scheduled") {
      return NextResponse.json({
        success: true,
        message: `Blog post already ${blogPost.status}, skipping`,
      });
    }

    const now = new Date();
    await db
      .update(blogPosts)
      .set({
        status: "published",
        publishedAt: now,
        qstashMessageId: null,
        updatedAt: now,
      })
      .where(eq(blogPosts.slug, slug));

    // Purge CDN cache
    revalidatePath(`/blog/${slug}`);
    revalidatePath("/blog");

    // Notify search engines for instant indexing
    const BASE_URL =
      process.env.NEXT_PUBLIC_APP_URL || "https://linkedgrow.ai";
    const indexingResult = await notifySearchEngines([
      `${BASE_URL}/blog/${slug}`,
    ]);

    console.log(`Blog post published: ${slug}`, indexingResult);

    return NextResponse.json({
      success: true,
      slug,
      publishedAt: now.toISOString(),
      indexing: indexingResult,
    });
  } catch (error) {
    console.error("QStash publish-blog error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to publish blog post",
      },
      { status: 500 }
    );
  }
}
