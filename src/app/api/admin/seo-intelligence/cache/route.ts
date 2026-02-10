import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { seoCache } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const CACHE_ID = "latest";

// GET - Load cached SEO intelligence data
export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await db
    .select()
    .from(seoCache)
    .where(eq(seoCache.id, CACHE_ID))
    .limit(1);

  if (!row.length) {
    return NextResponse.json({ cached: false });
  }

  try {
    return NextResponse.json({
      cached: true,
      data: JSON.parse(row[0].data),
      updatedAt: row[0].updatedAt,
    });
  } catch {
    return NextResponse.json({ cached: false });
  }
}

// PUT - Save SEO intelligence data
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const now = new Date().toISOString();

  await db
    .insert(seoCache)
    .values({
      id: CACHE_ID,
      data: JSON.stringify(body),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: seoCache.id,
      set: {
        data: JSON.stringify(body),
        updatedAt: now,
      },
    });

  return NextResponse.json({ success: true, updatedAt: now });
}
