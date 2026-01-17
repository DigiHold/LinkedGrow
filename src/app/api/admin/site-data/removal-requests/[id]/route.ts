import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dataRemovalRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes } = body;

    if (!status || !["processing", "completed", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Update the request
    await db
      .update(dataRemovalRequests)
      .set({
        status,
        adminNotes: adminNotes || null,
        processedAt: status === "completed" || status === "rejected" ? new Date() : null,
        processedBy: session.user.id,
      })
      .where(eq(dataRemovalRequests.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating removal request:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}
