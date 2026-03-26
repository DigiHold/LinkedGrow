import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateTOTPSecret, generateTOTPUri } from "@/lib/totp";
import { rateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";
import QRCode from "qrcode";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const rateLimitResult = rateLimit(`2fa-setup:${session.user.id}`, AUTH_RATE_LIMITS.twoFactorSetup);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)) } }
      );
    }

    // Generate new TOTP secret
    const secret = generateTOTPSecret();

    // Create otpauth URL for QR code
    const otpauthUrl = generateTOTPUri(
      session.user.email || "user",
      secret,
      "LinkedGrow"
    );

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Store secret temporarily (not enabled yet)
    await db
      .update(users)
      .set({ twoFactorSecret: secret })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      secret,
      qrCode: qrCodeDataUrl,
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup 2FA" },
      { status: 500 }
    );
  }
}
