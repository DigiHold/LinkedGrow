// Admin CMS API - List and Create pages
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cmsPages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { PAGE_TYPE_PREFIXES, type PageType } from "@/lib/cms";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return null;
  }
  return session;
}

// GET /api/admin/cms/pages - List all CMS pages
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const pageType = searchParams.get("type") as PageType | null;

  let pages;
  if (pageType) {
    pages = await db
      .select()
      .from(cmsPages)
      .where(eq(cmsPages.pageType, pageType))
      .orderBy(desc(cmsPages.updatedAt));
  } else {
    pages = await db.select().from(cmsPages).orderBy(desc(cmsPages.updatedAt));
  }

  return NextResponse.json({ pages });
}

// POST /api/admin/cms/pages - Create a new CMS page
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { pageType, slugSegment, seoTitle, seoDescription } = body;

  if (!pageType || !slugSegment) {
    return NextResponse.json(
      { error: "pageType and slugSegment are required" },
      { status: 400 }
    );
  }

  // Build full slug from prefix + segment
  const prefix = PAGE_TYPE_PREFIXES[pageType as PageType];
  if (!prefix) {
    return NextResponse.json({ error: "Invalid page type" }, { status: 400 });
  }

  const slug = `${prefix}/${slugSegment}`;

  // Check for duplicate slug
  const existing = await db.query.cmsPages.findFirst({
    where: eq(cmsPages.slug, slug),
  });

  if (existing) {
    return NextResponse.json(
      { error: "A page with this slug already exists" },
      { status: 409 }
    );
  }

  const id = nanoid();
  const now = new Date();

  await db.insert(cmsPages).values({
    id,
    slug,
    pageType: pageType as PageType,
    status: "draft",
    seoTitle: seoTitle || null,
    seoDescription: seoDescription || null,
    canonicalUrl: `https://linkedgrow.ai/${slug}`,
    content: JSON.stringify([]),
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id, slug }, { status: 201 });
}
