import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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
    console.log(`2FA disable attempt for user ${session.user.id}, password length: ${password.length}`);
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log(`2FA disable password validation: ${isValidPassword}`);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 400 }
      );
    }

    // Disable 2FA
    await db
      .update(users)
      .set({
        twoFactorEnabled: false,
        twoFactorSecret: null,
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication disabled",
    });
  } catch (error) {
    console.error("2FA disable error:", error);
    return NextResponse.json(
      { error: "Failed to disable 2FA" },
      { status: 500 }
    );
  }
}
