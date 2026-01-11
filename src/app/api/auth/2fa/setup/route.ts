import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateTOTPSecret, generateTOTPUri } from "@/lib/totp";
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
