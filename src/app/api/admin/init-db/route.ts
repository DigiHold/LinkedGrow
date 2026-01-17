import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// One-time endpoint to create missing tables
// DELETE THIS FILE AFTER USE
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create cookie_consents table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS cookie_consents (
        id TEXT PRIMARY KEY NOT NULL,
        visitor_id TEXT NOT NULL,
        user_id TEXT,
        necessary INTEGER DEFAULT 1,
        analytics INTEGER DEFAULT 0,
        marketing INTEGER DEFAULT 0,
        status TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        country TEXT,
        created_at INTEGER,
        updated_at INTEGER
      )
    `);

    return NextResponse.json({ success: true, message: "Tables created" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create tables", details: String(error) },
      { status: 500 }
    );
  }
}
