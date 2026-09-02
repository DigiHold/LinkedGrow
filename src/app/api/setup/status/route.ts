/**
 * Everything the setup wizard and the instance settings page show, masked.
 *
 * The administrator's, before and after setup: the wizard page shows anybody
 * else a waiting card that never calls this. Self hosted only; the cloud has
 * no row to describe. `?ip=1` asks for this server's public address as well;
 * without it the address is looked up only when Proxy-Seller is the provider.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSelfHosted } from "@/lib/edition";
import { setupStatus } from "@/lib/setup/status";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!session.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!isSelfHosted()) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const status = await setupStatus({ withIp: request.nextUrl.searchParams.get("ip") === "1" });
    return NextResponse.json(status);
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
