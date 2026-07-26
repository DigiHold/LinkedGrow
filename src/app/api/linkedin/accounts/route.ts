import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { linkedinAccounts, agents } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";

/**
 * The connected LinkedIn accounts in this workspace, for the agent wizard's
 * sender picker.
 *
 * The proxy allowlists /api/linkedin/ so the OAuth callback can land without
 * a session, which means this route cannot rely on the middleware and guards
 * itself. Verified with an unauthenticated request returning 401.
 *
 * Never returns passwordEncrypted, totpSecretEncrypted, sessionRef or
 * proxyAllocationId. Those are the credentials themselves and the picker only
 * needs to show a person and say whether the account is free.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await loadSessionUser(session.user.id);
    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const workspaceId = data.teamOwnerId ?? data.user.id;

    // One left join instead of a query per account: an account already driving
    // an agent cannot drive a second one, and the picker has to show that.
    const rows = await db
      .select({
        id: linkedinAccounts.id,
        fullName: linkedinAccounts.fullName,
        headline: linkedinAccounts.headline,
        avatarUrl: linkedinAccounts.avatarUrl,
        country: linkedinAccounts.country,
        status: linkedinAccounts.status,
        warmupStartedAt: linkedinAccounts.warmupStartedAt,
        agentId: agents.id,
      })
      .from(linkedinAccounts)
      .leftJoin(agents, eq(agents.linkedinAccountId, linkedinAccounts.id))
      .where(eq(linkedinAccounts.workspaceId, workspaceId))
      .orderBy(asc(linkedinAccounts.createdAt));

    return NextResponse.json({
      accounts: rows.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        headline: r.headline,
        avatarUrl: r.avatarUrl,
        country: r.country,
        status: r.status,
        warmupStartedAt: r.warmupStartedAt,
        inUse: r.agentId !== null,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load LinkedIn accounts" },
      { status: 500 }
    );
  }
}
