import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { linkedinAccounts, agents } from "@/lib/db/schema";
import { and, asc, count, eq } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";
import { encryptApiKey, EncryptionNotConfiguredError } from "@/lib/encryption";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { agentQuotaFor } from "@/lib/plans";
import { effectivePlan } from "@/lib/plans";

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
 * needs to show a person, how many agents already send from them, and the daily
 * budget those agents share.
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

    // One grouped join instead of a query per account. An account can drive
    // several agents, one per ICP, and they share its daily budget, so the
    // picker shows the count and the budget rather than free or taken.
    const rows = await db
      .select({
        id: linkedinAccounts.id,
        // A freshly connected account has no name until the session layer
        // signs in, so the pickers would show two rows both reading "LinkedIn
        // account". The address the workspace owner typed is what tells them
        // apart. It is their own account, inside their own workspace.
        email: linkedinAccounts.email,
        fullName: linkedinAccounts.fullName,
        headline: linkedinAccounts.headline,
        avatarUrl: linkedinAccounts.avatarUrl,
        country: linkedinAccounts.country,
        status: linkedinAccounts.status,
        // The sentence behind the badge. A row reading "LinkedIn asked for a
        // verification" and nothing else leaves the person with no idea what to
        // do next; the worker writes the what and the why into this column.
        statusReason: linkedinAccounts.statusReason,
        warmupStartedAt: linkedinAccounts.warmupStartedAt,
        dailyInviteCap: linkedinAccounts.dailyInviteCap,
        agentCount: count(agents.id),
      })
      .from(linkedinAccounts)
      .leftJoin(agents, eq(agents.linkedinAccountId, linkedinAccounts.id))
      .where(eq(linkedinAccounts.workspaceId, workspaceId))
      .groupBy(linkedinAccounts.id)
      .orderBy(asc(linkedinAccounts.createdAt));

    return NextResponse.json({
      accounts: rows.map((r) => ({
        id: r.id,
        // Selected above for a reason and then dropped here, which took the
        // dashboard down the first time an account was ever connected: a
        // freshly created row has no fullName, so the client had nothing at all
        // to label it with and crashed on the empty value.
        email: r.email,
        fullName: r.fullName,
        headline: r.headline,
        avatarUrl: r.avatarUrl,
        country: r.country,
        status: r.status,
        statusReason: r.statusReason,
        warmupStartedAt: r.warmupStartedAt,
        dailyInviteCap: r.dailyInviteCap,
        agentCount: r.agentCount,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load LinkedIn accounts" },
      { status: 500 }
    );
  }
}

/**
 * Connect a LinkedIn account with its own credentials.
 *
 * This is the single place credentials are entered. v2 drops the LinkedIn API
 * entirely, posting included, so the same connection serves the agents and
 * the content side; there is no second form in settings.
 *
 * The password is stored encrypted because it is the source of truth for
 * automatic re-login, so the user is never asked again. That makes this route
 * security-critical: nothing here is logged, and no credential is ever read
 * back out by the API.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Credential submission is expensive and abusable, so it is capped per IP
    // as well as being behind a session.
    const limited = rateLimit(`li-connect:${getClientIP(request)}`, {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.success) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 }
      );
    }

    const data = await loadSessionUser(session.user.id);
    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const workspaceId = data.teamOwnerId ?? data.user.id;

    const body = await request.json();
    const email =
      typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const country =
      typeof body?.country === "string" ? body.country.trim().toUpperCase() : "";
    const totpSecret =
      typeof body?.totpSecret === "string" ? body.totpSecret.trim() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (!password || password.length > 256) {
      return NextResponse.json({ error: "A password is required" }, { status: 400 });
    }
    // ISO 3166-1 alpha-2. Country is the level ISP proxies are sold at, so
    // there is no city anywhere in the product.
    if (!/^[A-Z]{2}$/.test(country)) {
      return NextResponse.json({ error: "Pick a country" }, { status: 400 });
    }

    // One account per agent slot: connecting more than the plan allows would
    // leave accounts stranded with no agent to run them.
    const plan = effectivePlan({ plan: data.user.plan, isAdmin: data.user.isAdmin });
    const quota = agentQuotaFor(plan);
    if (quota === 0) {
      return NextResponse.json(
        { error: "Connecting an account needs a paid plan", feature: "agents" },
        { status: 403 }
      );
    }

    const [existingSame] = await db
      .select({ id: linkedinAccounts.id })
      .from(linkedinAccounts)
      .where(
        and(
          eq(linkedinAccounts.workspaceId, workspaceId),
          eq(linkedinAccounts.email, email)
        )
      )
      .limit(1);
    if (existingSame) {
      return NextResponse.json(
        { error: "That account is already connected" },
        { status: 409 }
      );
    }

    const current = await db
      .select({ id: linkedinAccounts.id })
      .from(linkedinAccounts)
      .where(eq(linkedinAccounts.workspaceId, workspaceId));
    if (current.length >= quota) {
      return NextResponse.json(
        {
          error: `Your plan covers ${quota} account${quota === 1 ? "" : "s"}`,
          quota: { used: current.length, limit: quota },
        },
        { status: 403 }
      );
    }

    const now = new Date();
    const id = crypto.randomUUID();
    await db.insert(linkedinAccounts).values({
      id,
      workspaceId,
      createdBy: session.user.id,
      email,
      passwordEncrypted: encryptApiKey(password)!,
      totpSecretEncrypted: totpSecret ? encryptApiKey(totpSecret) : null,
      country,
      // Nothing is verified until the session layer signs in for the first
      // time and handles LinkedIn's approval prompt.
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id, status: "pending" }, { status: 201 });
  } catch (error) {
    if (error instanceof EncryptionNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Failed to connect the account" },
      { status: 500 }
    );
  }
}
