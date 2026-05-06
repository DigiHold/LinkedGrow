/**
 * Admin endpoint to manually trigger cross-posting of one article.
 * Used by the BlogCrossPostBox card under each published post.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { crossPostArticle, type CrossPostTarget } from "@/lib/cross-post";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { slug?: string; force?: boolean; only?: CrossPostTarget };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = payload.slug?.trim();
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  if (payload.only && payload.only !== "devto" && payload.only !== "hashnode") {
    return NextResponse.json({ error: "Invalid only" }, { status: 400 });
  }

  try {
    const result = await crossPostArticle(slug, {
      force: payload.force === true,
      only: payload.only,
    });
    const ok = result.devto.ok && result.hashnode.ok;
    return NextResponse.json({ ok, result }, { status: ok ? 200 : 207 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
