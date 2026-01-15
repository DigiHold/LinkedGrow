import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        linkedinCommunityAccessToken: true,
        linkedinCommunityTokenExpiry: true,
      },
    });

    // Check if community token exists and is not expired
    const connected = !!(
      user?.linkedinCommunityAccessToken &&
      (!user.linkedinCommunityTokenExpiry || user.linkedinCommunityTokenExpiry > new Date())
    );

    return NextResponse.json({ connected });
  } catch (error) {
    console.error("Failed to check community status:", error);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}
