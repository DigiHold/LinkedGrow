// Admin CMS API - Read, Update, Delete a single page
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cmsPages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return null;
  }
  return session;
}

// GET /api/admin/cms/pages/[slug]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await params;
  // The slug comes URL-encoded since it contains slashes (e.g. "for%2Fsolopreneurs")
  const decodedSlug = decodeURIComponent(slug);

  const page = await db.query.cmsPages.findFirst({
    where: eq(cmsPages.slug, decodedSlug),
  });

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  return NextResponse.json({ page });
}

// PUT /api/admin/cms/pages/[slug]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const body = await request.json();

  // Verify page exists
  const existing = await db.query.cmsPages.findFirst({
    where: eq(cmsPages.slug, decodedSlug),
  });

  if (!existing) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const now = new Date();
  const updateData: Record<string, unknown> = { updatedAt: now };

  // SEO fields
  if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle;
  if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription;
  if (body.seoKeywords !== undefined) updateData.seoKeywords = body.seoKeywords;
  if (body.ogTitle !== undefined) updateData.ogTitle = body.ogTitle;
  if (body.ogDescription !== undefined) updateData.ogDescription = body.ogDescription;
  if (body.ogImage !== undefined) updateData.ogImage = body.ogImage;
  if (body.canonicalUrl !== undefined) updateData.canonicalUrl = body.canonicalUrl;

  // Content
  if (body.content !== undefined) {
    updateData.content = typeof body.content === "string" ? body.content : JSON.stringify(body.content);
  }

  // FAQ
  if (body.faq !== undefined) {
    updateData.faq = typeof body.faq === "string" ? body.faq : JSON.stringify(body.faq);
  }

  // Translations (content + faq + SEO per language)
  if (body.translations !== undefined) {
    updateData.translations = typeof body.translations === "string"
      ? body.translations
      : JSON.stringify(body.translations);
  }

  // Status + publish
  if (body.status !== undefined) {
    updateData.status = body.status;
    if (body.status === "published" && !existing.publishedAt) {
      updateData.publishedAt = now;
    }
  }

  // Slug change (permalink)
  if (body.slug !== undefined && body.slug !== decodedSlug) {
    // Check the new slug doesn't conflict
    const conflict = await db.query.cmsPages.findFirst({
      where: eq(cmsPages.slug, body.slug),
    });
    if (conflict) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    updateData.slug = body.slug;
    updateData.canonicalUrl = `https://linkedgrow.ai/${body.slug}`;
  }

  await db.update(cmsPages).set(updateData).where(eq(cmsPages.slug, decodedSlug));

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/cms/pages/[slug]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const existing = await db.query.cmsPages.findFirst({
    where: eq(cmsPages.slug, decodedSlug),
  });

  if (!existing) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  await db.delete(cmsPages).where(eq(cmsPages.slug, decodedSlug));

  return NextResponse.json({ success: true });
}
