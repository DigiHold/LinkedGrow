// Beta Tester API - Beta program is now closed
import { NextResponse } from "next/server";

// POST /api/beta - Beta program closed, no new signups accepted
export async function POST() {
  return NextResponse.json(
    { error: "The beta program has ended. Thank you for your interest!" },
    { status: 410 }
  );
}
