import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clear LinkedIn tokens from database
    await db
      .update(users)
      .set({
        linkedinAccessToken: null,
        linkedinRefreshToken: null,
        linkedinTokenExpiry: null,
        linkedinProfileId: null,
        linkedinProfileName: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    const response = NextResponse.json({
      success: true,
      message: "LinkedIn disconnected successfully",
    });

    // Also clear cookies
    response.cookies.delete("linkedin_connected");
    response.cookies.delete("linkedin_profile_name");

    return response;
  } catch (error) {
    console.error("Failed to disconnect LinkedIn:", error);
    return NextResponse.json(
      { error: "Failed to disconnect LinkedIn" },
      { status: 500 }
    );
  }
}
