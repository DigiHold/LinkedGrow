/** Writes one small file through the saved driver, reads it back, and deletes it. */
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSelfHosted } from "@/lib/edition";
import { getInstanceSettings } from "@/lib/instance-settings";
import { rateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";
import { getStorage } from "@/lib/storage";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!session.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!isSelfHosted()) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const limit = rateLimit(`setup:${session.user.id}`, AUTH_RATE_LIMITS.setup);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
      );
    }

    await getInstanceSettings(true);
    const key = `healthcheck/${randomUUID()}.txt`;
    try {
      const storage = await getStorage();
      const { url } = await storage.put(key, Buffer.from("ok"), "text/plain");
      const back = await storage.read(key);
      if (!back || back.body.toString("utf8") !== "ok") {
        throw new Error("The file was written but could not be read back.");
      }
      await storage.delete(key);
      return NextResponse.json({ ok: true, url });
    } catch (error) {
      return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "The storage did not answer." });
    }
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
