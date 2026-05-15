// Admin updates ticket status / priority manually (e.g., bumping priority,
// or moving from in_progress back to open without sending a reply).
import { NextRequest, NextResponse } from "next/server";
import { db, supportTickets } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSupportSession } from "@/lib/support";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_STATUS = ["open", "in_progress", "resolved", "closed"] as const;
const VALID_PRIORITY = ["low", "normal", "high"] as const;

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getSupportSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.status === "string" && (VALID_STATUS as readonly string[]).includes(body.status)) {
    update.status = body.status;
    if (body.status === "resolved") update.resolvedAt = new Date();
    if (body.status === "closed") update.closedAt = new Date();
  }
  if (typeof body.priority === "string" && (VALID_PRIORITY as readonly string[]).includes(body.priority)) {
    update.priority = body.priority;
  }

  await db.update(supportTickets).set(update).where(eq(supportTickets.id, id));
  return NextResponse.json({ ok: true });
}
