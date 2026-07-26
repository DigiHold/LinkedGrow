import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { linkedinAccounts, agents } from "@/lib/db/schema";
import { and, count, eq } from "drizzle-orm";
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

    // The address goes back to the pool rather than being cancelled at the
    // provider, per plan section 5b: IPs are inventory. Releasing it is the
    // proxy layer's job and happens when that layer exists.
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to disconnect the account" },
      { status: 500 }
    );
  }
}
