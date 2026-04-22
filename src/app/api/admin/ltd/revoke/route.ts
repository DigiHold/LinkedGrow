import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revokeCode } from "@/lib/redemption-codes";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { codes } = (body || {}) as { codes?: unknown };
  if (typeof codes !== "string") {
    return NextResponse.json({ error: "codes must be a string" }, { status: 400 });
  }

  const lines = codes
    .split(/[\r\n,;\s]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.length <= 64)
    .slice(0, 5000);

  if (lines.length === 0) {
    return NextResponse.json({ error: "No codes provided" }, { status: 400 });
  }

  const results = [];
  let revoked = 0;
  let unused_blocked = 0;
  let already_revoked = 0;
  let not_found = 0;

  for (const raw of lines) {
    const r = await revokeCode(raw);
    results.push(r);
    if (r.status === "revoked") revoked++;
    else if (r.status === "still_unused") unused_blocked++;
    else if (r.status === "already_revoked") already_revoked++;
    else if (r.status === "not_found") not_found++;
  }

  return NextResponse.json({
    summary: { total: lines.length, revoked, unused_blocked, already_revoked, not_found },
    results,
  });
}
