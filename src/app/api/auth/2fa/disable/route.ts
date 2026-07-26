import { NextRequest, NextResponse } from "next/server";
import { invalidateSessionUser } from "@/lib/auth-user";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { rateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const rateLimitResult = rateLimit(`2fa-disable:${session.user.id}`, AUTH_RATE_LIMITS.twoFactor);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required to disable 2FA" },
        { status: 400 }
      );
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user?.password) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 400 }
      );
    }

    // Disable 2FA and invalidate all existing sessions
    await db
      .update(users)
      .set({
        twoFactorEnabled: false,
        twoFactorSecret: null,
        passwordChangedAt: new Date().toISOString(),
      })
      .where(eq(users.id, session.user.id));

    // The session cache must not serve the pre-change row for even a
    // moment: invalidation has to be immediate, not eventually consistent.
    invalidateSessionUser(user.id);

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication disabled",
    });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to disable 2FA" },
      { status: 500 }
    );
  }
}
