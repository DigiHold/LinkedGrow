import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { deleteUserData } from "@/lib/user-deletion";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

// GDPR Article 17 - right to erasure.
// Fully deletes the authenticated user's account and every piece of data
// linked to them. Password confirmation is required to make sure a stolen
// session or CSRF can't trigger the destruction.
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admins shouldn't nuke themselves via the user-facing endpoint - use the
    // admin tools instead.
    if (session.user.isAdmin) {
      return NextResponse.json(
        { error: "Admin accounts cannot be self-deleted. Contact another admin." },
        { status: 400 }
      );
    }

    const limit = rateLimit(`user-delete:${session.user.id}:${getClientIP(request)}`, {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 }
      );
    }

    const { password, confirm } = await request.json();

    if (confirm !== "DELETE") {
      return NextResponse.json(
        { error: "Please type DELETE to confirm." },
        { status: 400 }
      );
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user has a password (credentials auth), verify it.
    // If no password (OAuth-only), the "DELETE" confirmation is sufficient.
    if (user.password) {
      if (!password || typeof password !== "string") {
        return NextResponse.json({ error: "Password is required" }, { status: 400 });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
      }
    }

    await deleteUserData(user.id);

    return NextResponse.json({
      success: true,
      message: "Your account and all associated data have been deleted.",
    });
  } catch (error) {
    console.error("[user-delete] Failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Failed to delete account: ${error.message}`
            : "Failed to delete account",
      },
      { status: 500 }
    );
  }
}
