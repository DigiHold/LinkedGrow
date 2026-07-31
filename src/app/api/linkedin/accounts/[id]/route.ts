import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { linkedinAccounts, agents, proxyAllocations } from "@/lib/db/schema";
import { and, count, eq, isNull, or } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";

/**
 * Disconnect a LinkedIn account.
 *
 * The proxy allowlists /api/linkedin/ so the route guards itself rather than
 * relying on the middleware.
 *
 * Refuses while an agent still sends from it. Deleting the account would take
 * its agents with it through the cascade, and losing an agent and its whole
 * lead history to a click meant as "stop using this profile" is not a trade
 * anyone would choose. Removing the agents first is a deliberate second step.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await loadSessionUser(session.user.id);
    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const workspaceId = data.teamOwnerId ?? data.user.id;

    const [attached] = await db
      .select({ total: count() })
      .from(agents)
      .where(
        and(eq(agents.linkedinAccountId, id), eq(agents.workspaceId, workspaceId))
      );

    if ((attached?.total ?? 0) > 0) {
      return NextResponse.json(
        {
          error: `${attached.total} agent${attached.total === 1 ? "" : "s"} still send from this account. Delete ${attached.total === 1 ? "it" : "them"} first.`,
        },
        { status: 409 }
      );
    }

    // Ownership is in the WHERE clause, so a wrong id deletes nothing.
    const removed = await db
      .delete(linkedinAccounts)
      .where(
        and(
          eq(linkedinAccounts.id, id),
          eq(linkedinAccounts.workspaceId, workspaceId)
        )
      )
      .returning({ id: linkedinAccounts.id });

    if (!removed.length) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // The address goes back to the buffer rather than being cancelled at the
    // provider, per plan section 5b: addresses are inventory, and the next
    // account in that country takes it instead of buying one.
    //
    // Done here explicitly rather than left to the foreign key. The column
    // declares onDelete: "set null", SQLite does not enforce foreign keys
    // unless asked to, and it is not asked to, so every disconnection was
    // quietly orphaning an address somebody had paid for. Found 2026-07-31.
    await db
      .update(proxyAllocations)
      .set({ linkedinAccountId: null, updatedAt: new Date() })
      .where(
        and(
          eq(proxyAllocations.linkedinAccountId, id),
          eq(proxyAllocations.status, "active")
        )
      );

    // An order that never completed bought nothing, so there is nothing to keep.
    // One that did carries the supplier's order id and stays as a buffer row.
    await db
      .delete(proxyAllocations)
      .where(
        and(
          eq(proxyAllocations.linkedinAccountId, id),
          eq(proxyAllocations.status, "ordering"),
          or(isNull(proxyAllocations.providerRef), eq(proxyAllocations.providerRef, ""))
        )
      );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to disconnect the account" },
      { status: 500 }
    );
  }
}
