/**
 * One-time admin endpoint to create the daily media cleanup QStash schedule.
 * Call POST /api/admin/setup-cleanup-schedule once from the browser while logged in as admin.
 * Safe to call multiple times - it will list existing schedules to avoid duplicates.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { qstash } from "@/lib/qstash";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://linkedgrow.ai";
const CLEANUP_URL = `${APP_URL}/api/cron/cleanup-media`;

export async function POST() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if schedule already exists
    const schedules = await qstash.schedules.list();
    const existing = schedules.find(
      (s) => s.destination === CLEANUP_URL
    );

    if (existing) {
      return NextResponse.json({
        message: "Schedule already exists",
        scheduleId: existing.scheduleId,
        cron: existing.cron,
      });
    }

    // Create daily schedule at 4am UTC
    const schedule = await qstash.schedules.create({
      destination: CLEANUP_URL,
      cron: "0 4 * * *",
      retries: 3,
    });

    return NextResponse.json({
      message: "Cleanup schedule created",
      scheduleId: schedule.scheduleId,
      cron: "0 4 * * *",
    });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}
