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

    // Clear community tokens and organization data from database
    await db
      .update(users)
      .set({
        linkedinCommunityAccessToken: null,
        linkedinCommunityRefreshToken: null,
        linkedinCommunityTokenExpiry: null,
        linkedinOrganizations: null,
        linkedinPostingTarget: "profile",
        linkedinSelectedOrgId: null,
        linkedinSelectedOrgName: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      message: "Community Management API disconnected",
    });
  } catch (error) {
    console.error("Failed to disconnect community:", error);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}
