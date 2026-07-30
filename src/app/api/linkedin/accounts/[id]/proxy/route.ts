import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agents, linkedinAccounts } from "@/lib/db/schema";
import { loadSessionUser } from "@/lib/auth-user";
import { isProxyCountry } from "@/lib/proxy-countries";
import {
  allocationForAccount,
  requestAllocation,
  attachCustomProxy,
  releaseForAccount,
  toView,
} from "@/lib/proxy/allocate";
import { ProxyProviderError } from "@/lib/proxy/provider";
import { AUTH_RATE_LIMITS, rateLimit } from "@/lib/rate-limit";

/**
 * The dedicated address bound to one LinkedIn account.
 *
 * GET reports what is bound, without ever returning credentials.
 * POST allocates one, either ordered for us or supplied by the customer.
 * DELETE unbinds, returning a managed address to the pool for reuse.
 *
 * The invariant these three serve, plan section 5c: one LinkedIn account, one
 * address, permanently, never shared with a second account.
 */

async function resolve(request: NextRequest, id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" as const, status: 401 };

  const data = await loadSessionUser(session.user.id);
  if (!data) return { error: "Unauthorized" as const, status: 401 };
  const workspaceId = data.teamOwnerId ?? data.user.id;

  // Ownership in the WHERE clause, never as a separate check afterwards.
  const [account] = await db
    .select()
    .from(linkedinAccounts)
    .where(
      and(eq(linkedinAccounts.id, id), eq(linkedinAccounts.workspaceId, workspaceId))
    )
    .limit(1);
  if (!account) return { error: "Not found" as const, status: 404 };

  return { workspaceId, account };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resolved = await resolve(request, id);
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const row = await allocationForAccount(id);
    return NextResponse.json({ allocation: row ? toView(row) : null });
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resolved = await resolve(request, id);
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }
    const { workspaceId, account } = resolved;

    // Keyed by workspace rather than by user, because a team is one wallet and
    // this endpoint spends from it.
    const limit = rateLimit(`proxy-buy:${workspaceId}`, AUTH_RATE_LIMITS.proxyPurchase);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many address requests. Try again shortly." },
        { status: 429 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      custom?: { host?: unknown; port?: unknown; username?: unknown; password?: unknown };
    };

    if (body.custom) {
      const host = typeof body.custom.host === "string" ? body.custom.host.trim() : "";
      const port = Number(body.custom.port);
      const username =
        typeof body.custom.username === "string" ? body.custom.username.trim() : "";
      const password =
        typeof body.custom.password === "string" ? body.custom.password : "";

      // Manual validation, matching the house style. A hostname is checked for
      // shape rather than resolved here, because the exit test that follows
      // proves reachability far better than a regex can.
      if (!host || host.length > 253 || /[^\w.:-]/.test(host)) {
        return NextResponse.json({ error: "Enter a valid proxy host" }, { status: 400 });
      }
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        return NextResponse.json({ error: "Enter a valid port" }, { status: 400 });
      }
      if (username.length > 200 || password.length > 200) {
        return NextResponse.json({ error: "Credentials are too long" }, { status: 400 });
      }

      const result = await attachCustomProxy(workspaceId, id, account.country, {
        host,
        port,
        username,
        password,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (!isProxyCountry(account.country)) {
      return NextResponse.json(
        { error: "We cannot allocate an address in that country." },
        { status: 400 }
      );
    }

    // Records the intent only. The worker owns the purchase, because the
    // supplier's allowlist holds 3 addresses and Vercel has hundreds.
    const result = await requestAllocation(workspaceId, id, account.country);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ProxyProviderError) {
      // The supplier's own wording is more useful to a customer than ours, and
      // it is the difference between "no stock in Ireland" and "try again".
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resolved = await resolve(request, id);
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    // Every agent on the account stops, because an agent whose address just
    // went away must not fall back to anything.
    await db
      .update(agents)
      .set({ status: "paused", updatedAt: new Date() })
      .where(
        and(
          eq(agents.linkedinAccountId, id),
          eq(agents.workspaceId, resolved.workspaceId)
        )
      );

    await releaseForAccount(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
