// Admin CMS API - Upload images to R2
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToR2, isR2Configured } from "@/lib/storage/r2";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return null;
  }
  return session;
}

// POST /api/admin/cms/upload - Upload an image
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isR2Configured()) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (10MB max)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await uploadToR2(buffer, {
    fileName: file.name,
    contentType: file.type,
    userId: "cms", // CMS uploads use a shared prefix
  });

  return NextResponse.json({
    url: result.url,
    key: result.key,
    size: result.size,
  });
}
