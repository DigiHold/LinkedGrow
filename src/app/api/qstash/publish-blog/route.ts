import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    const signature = request.headers.get("upstash-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const isValid = await receiver.verify({
      signature,
      body,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/qstash/publish-blog`,
    });

    if (!isValid) {
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

    console.log(`Blog post published: ${slug}`);

    return NextResponse.json({
      success: true,
      slug,
      publishedAt: now.toISOString(),
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
