import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateBatch, type RedemptionSource } from "@/lib/redemption-codes";

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

  const { source, count, batch } = (body || {}) as {
    source?: unknown;
    count?: unknown;
    batch?: unknown;
  };

  if (source !== "dealify" && source !== "dealmirror") {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }
  if (typeof count !== "number" || !Number.isInteger(count) || count < 1 || count > 10000) {
    return NextResponse.json({ error: "count must be between 1 and 10000" }, { status: 400 });
  }
  if (typeof batch !== "string" || !/^[a-z0-9-]{1,64}$/.test(batch)) {
    return NextResponse.json(
      { error: "batch must be lowercase letters/numbers/dashes, max 64 chars" },
      { status: 400 }
    );
  }

  const codes = await generateBatch(source as RedemptionSource, count, batch);

  return NextResponse.json({
    success: true,
    count: codes.length,
    batch,
    source,
    csv: codes.join("\n") + "\n",
  });
}
