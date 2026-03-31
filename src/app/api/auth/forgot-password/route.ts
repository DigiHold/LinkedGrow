// Forgot password API - sends password reset email
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, AUTH_RATE_LIMITS, getClientIP } from "@/lib/rate-limit";

// Token expiry time (1 hour)
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

// Helper to hash token with SHA-256
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 3 requests per hour per IP
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(
      `forgot-password:${clientIP}`,
      AUTH_RATE_LIMITS.forgotPassword
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    // Always return success to prevent email enumeration
    // Even if user doesn't exist, we don't reveal that
    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "If an account exists with this email, you will receive a password reset link.",
      });
    }

    // Invalidate all previous unused tokens for this user
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.userId, user.id));

    // Generate secure random token
    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expires = new Date(Date.now() + TOKEN_EXPIRY_MS);

    // Store hashed token in database
    await db.insert(passwordResetTokens).values({
      id: randomBytes(16).toString("hex"),
      userId: user.id,
      tokenHash, // Store hash, not plain token
      expires,
    });

    // Send password reset email with plain token (user needs it to reset)
    try {
      await sendPasswordResetEmail({
        to: normalizedEmail,
        name: user.name || undefined,
        resetToken: token, // Send plain token in email
      });
    } catch (emailError) {
// Don't expose email sending errors to the user
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists with this email, you will receive a password reset link.",
    });
  } catch (error) {
return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
