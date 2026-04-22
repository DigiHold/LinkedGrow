import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStats } from "@/lib/redemption-codes";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stats = await getStats();
  return NextResponse.json({ stats });
}
