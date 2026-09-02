/**
 * Everything the setup wizard and the instance settings page show, masked.
 *
 * Before setup any signed in account may read it: the wizard page decides
 * what that account gets to see. After setup it is the administrator's.
 * Self hosted only; the cloud has no row to describe.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSelfHosted } from "@/lib/edition";
import { getInstanceSettings } from "@/lib/instance-settings";
import { serverPublicIp, setupStatus } from "@/lib/setup/status";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isSelfHosted()) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { setupCompleted } = await getInstanceSettings(true);
    if (setupCompleted && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const status = await setupStatus(await serverPublicIp());
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: "Could not read the instance settings", detail: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
