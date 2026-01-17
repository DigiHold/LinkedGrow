import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteFromR2, isR2Configured } from "@/lib/storage/r2";

/**
 * Extract R2 storage key from URL
 */
function extractR2KeyFromUrl(url: string): string | null {
  try {
    // R2 URLs look like: https://bucket.account.r2.cloudflarestorage.com/users/xxx/uploads/...
    // or custom domain: https://cdn.example.com/users/xxx/uploads/...
    const urlObj = new URL(url);
    // The key is everything after the first /
    const key = urlObj.pathname.slice(1);
    return key || null;
  } catch {
    return null;
  }
}

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user to find the image URL
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { image: true },
    });

    // Delete profile picture from R2 if it exists
    if (user?.image && isR2Configured()) {
      const r2Key = extractR2KeyFromUrl(user.image);
      if (r2Key) {
        try {
          await deleteFromR2(r2Key);
        } catch (error) {
          console.error("Failed to delete profile picture from R2:", error);
          // Continue even if delete fails
        }
      }
    }

    // Clear LinkedIn tokens, profile data, and organization data from database
    await db
      .update(users)
      .set({
        linkedinAccessToken: null,
        linkedinRefreshToken: null,
        linkedinTokenExpiry: null,
        linkedinProfileId: null,
        linkedinProfileName: null,
        linkedinPostingTarget: null,
        linkedinSelectedOrgId: null,
        linkedinSelectedOrgName: null,
        linkedinOrganizations: null,
        image: null,
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
