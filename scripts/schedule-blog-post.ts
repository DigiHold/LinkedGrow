/**
 * Headless equivalent of the admin "schedule" action: books the next free Mon/Wed/Fri
 * 7:00 AM Los Angeles slot via QStash and writes the blog_posts row, so the SEO automation
 * can auto-schedule a freshly written article without anyone opening the admin.
 *
 * Usage: npx tsx scripts/schedule-blog-post.ts <slug>
 * Env (production values required): TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, QSTASH_TOKEN.
 * Without them the script exits 3 and prints SCHEDULE_MISSING_ENV so the caller leaves
 * the post as a draft (never writes the local SQLite fallback by accident).
 */
import { eq } from "drizzle-orm";

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("usage: npx tsx scripts/schedule-blog-post.ts <slug>");
    process.exit(2);
  }
  if (
    !process.env.TURSO_DATABASE_URL ||
    !process.env.TURSO_AUTH_TOKEN ||
    !process.env.QSTASH_TOKEN
  ) {
    console.error(
      "SCHEDULE_MISSING_ENV: TURSO_DATABASE_URL / TURSO_AUTH_TOKEN / QSTASH_TOKEN not set — leave the post as draft"
    );
    process.exit(3);
  }

  const { db } = await import("../src/lib/db");
  const { blogPosts } = await import("../src/lib/db/schema");
  const { getBlogPost } = await import("../src/lib/blog");
  const { scheduleBlogPost } = await import("../src/lib/blog-schedule");

  if (!getBlogPost(slug)) {
    console.error(`unknown slug in the blog registry: ${slug}`);
    process.exit(2);
  }

  const existing = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.slug, slug),
  });
  if (existing && existing.status !== "draft") {
    console.log(`${slug} is already ${existing.status} — not touching it`);
    return;
  }

  const { scheduledAt, messageId } = await scheduleBlogPost(slug);
  const now = new Date();
  if (existing) {
    await db
      .update(blogPosts)
      .set({
        status: "scheduled",
        scheduledAt,
        qstashMessageId: messageId,
        updatedAt: now,
      })
      .where(eq(blogPosts.slug, slug));
  } else {
    await db.insert(blogPosts).values({
      slug,
      status: "scheduled",
      scheduledAt,
      qstashMessageId: messageId,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`SCHEDULED ${slug} for ${scheduledAt.toISOString()} (qstash ${messageId})`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  }
);
