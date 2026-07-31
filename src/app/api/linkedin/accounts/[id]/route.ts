import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { linkedinAccounts, agents, proxyAllocations } from "@/lib/db/schema";
import { and, count, eq, isNull, or } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";
import { AUTH_RATE_LIMITS, rateLimit } from "@/lib/rate-limit";

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
/**
 * Try the sign-in again, on purpose rather than on a timer.
 *
 * The worker gives up after three failures and after a verification code goes
 * unanswered, both deliberately: retrying a bad password every few seconds from
 * one address is how a real LinkedIn profile gets restricted. Giving up needs a
 * way back, though, or a customer who simply mistyped once is stuck looking at
 * an account that will never try again.
 *
 * It only resets. The worker picks the account up within seconds, because
 * `pending` with a clean attempt count is exactly what its connect pass reads.
 */
export async function POST(
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

    // A slow hand on this button must not become a way to hammer LinkedIn's
    // login form through us.
    const limit = rateLimit(`li-retry:${id}`, AUTH_RATE_LIMITS.challengeCode);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Give it a moment before trying again." },
        { status: 429 }
      );
    }

    const reset = await db
      .update(linkedinAccounts)
      .set({
        status: "pending",
        statusReason: null,
        signInAttempts: 0,
        lastCheckAt: null,
        challengeState: "none",
        challengeKind: null,
        challengeCodeEncrypted: null,
        challengeAskedAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(linkedinAccounts.id, id),
          eq(linkedinAccounts.workspaceId, workspaceId)
        )
      )
      .returning({ id: linkedinAccounts.id });

    if (!reset.length) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "That account could not be retried" },
      { status: 500 }
    );
  }
}

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
