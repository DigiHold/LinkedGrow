import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { linkedinAccounts } from "@/lib/db/schema";
import { loadSessionUser } from "@/lib/auth-user";
import { encryptApiKey } from "@/lib/encryption";
import { AUTH_RATE_LIMITS, rateLimit } from "@/lib/rate-limit";

/**
 * The six digits LinkedIn asks for, handed to a browser that is waiting.
 *
 * This exists because asking a customer for their authenticator **setup key**
 * is unusable: LinkedIn shows it once and never again, so anybody who already
 * has two-factor switched on cannot produce it without turning 2FA off and back
 * on. The code is the thing people already know how to read off their phone.
 *
 * The shape is a live handoff rather than storage. A worker is sitting on
 * LinkedIn's verification page right now with the session half open; it polls
 * this row every couple of seconds, takes the code, and clears it. A TOTP code
 * lasts 30 seconds, so nothing here is allowed to be slow or cached.
 *
 * GET reports whether a code is being waited on, so the dialog can show the
 * input without the customer having to guess.
 */

async function resolve(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" as const, status: 401 };
  const data = await loadSessionUser(session.user.id);
  if (!data) return { error: "Unauthorized" as const, status: 401 };
  const workspaceId = data.teamOwnerId ?? data.user.id;

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
    const resolved = await resolve(id);
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }
    const { account } = resolved;
    return NextResponse.json({
      state: account.challengeState,
      kind: account.challengeKind,
      askedAt: account.challengeAskedAt,
      status: account.status,
      // Never the code, in either direction.
      reason: account.statusReason,
    });
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
    const resolved = await resolve(id);
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }
    const { workspaceId, account } = resolved;

    // Six digits guessed at speed is the one attack this endpoint has, so the
    // limit is tight and keyed to the account rather than the workspace.
    const limit = rateLimit(`li-challenge:${id}`, AUTH_RATE_LIMITS.challengeCode);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many attempts. Wait a minute and try again." },
        { status: 429 }
      );
    }

    if (account.challengeState !== "awaiting_code") {
      return NextResponse.json(
        { error: "Nothing is waiting for a code on this account right now." },
        { status: 409 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as { code?: unknown };
    const code = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";
    if (code.length < 4 || code.length > 8) {
      return NextResponse.json(
        { error: "Enter the code exactly as LinkedIn shows it." },
        { status: 400 }
      );
    }

    // Encrypted even though it lives for seconds, because it is a credential
    // while it exists and the worker reads it with the same key as everything
    // else.
    await db
      .update(linkedinAccounts)
      .set({
        challengeCodeEncrypted: encryptApiKey(code),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(linkedinAccounts.id, id),
          eq(linkedinAccounts.workspaceId, workspaceId)
        )
      );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
