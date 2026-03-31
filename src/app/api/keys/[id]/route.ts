import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, apiKeys, users } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { canAccessFeature, PlanId } from "@/lib/plans";

// DELETE - Delete an API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check Business plan
    if (!canAccessFeature(user.plan as PlanId, "apiAccess")) {
      return NextResponse.json({ error: "API access requires Business plan" }, { status: 403 });
    }

    // Find and delete the key (only if it belongs to this user)
    const key = await db.query.apiKeys.findFirst({
      where: and(eq(apiKeys.id, id), eq(apiKeys.userId, user.id)),
    });

    if (!key) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    await db.delete(apiKeys).where(eq(apiKeys.id, id));

    return NextResponse.json({ message: "API key deleted successfully" });
  } catch (error) {
return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 });
  }
}
