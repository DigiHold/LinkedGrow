import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { linkedinAccounts, agents, agentEvents } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { loadSessionUser } from "@/lib/auth-user";
import { isProxyCountry, countryName } from "@/lib/proxy-countries";

/**
 * Move a connected account to a different country.
 *
 * This is an allocation event, not a setting. LinkedIn compares where an
 * account signs in from against everywhere it has ever signed in from, so a
 * move throws away the trust the old address had built and the account starts
 * its warm-up again. Plan section 5b bounds how often that can happen, and
 * this route is where the bound lives, in the database rather than in the
 * interface alone.
 *
 * Every agent on the account is paused by the same call. Continuing to send
 * from an address the profile has never used is the exact shape that gets it
 * restricted.
 */

/** Section 5b. Two is enough for a genuine move and few enough to notice abuse. */
const MAX_CHANGES_PER_MONTH = 2;

export async function PATCH(
  request: NextRequest,
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

    const body = await request.json();
    const country =
      typeof body?.country === "string" ? body.country.trim().toUpperCase() : "";
    if (!isProxyCountry(country)) {
      return NextResponse.json(
        { error: "We cannot allocate an address in that country." },
        { status: 400 }
      );
    }

    // Ownership is in the WHERE clause, never a check on the row that returns.
    const [account] = await db
      .select({
        id: linkedinAccounts.id,
        country: linkedinAccounts.country,
        countryChanges: linkedinAccounts.countryChanges,
        lastCountryChangeAt: linkedinAccounts.lastCountryChangeAt,
      })
      .from(linkedinAccounts)
      .where(
        and(
          eq(linkedinAccounts.id, id),
          eq(linkedinAccounts.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    if (account.country === country) {
      return NextResponse.json(
        { error: `That account is already in ${countryName(country)}.` },
        { status: 400 }
      );
    }

    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const used =
      account.lastCountryChangeAt && account.lastCountryChangeAt > monthAgo
        ? account.countryChanges ?? 0
        : 0;
    if (used >= MAX_CHANGES_PER_MONTH) {
      return NextResponse.json(
        {
          error:
            "This account has already moved twice in the last 30 days. Each move throws away the trust its address had built, so the next one has to wait.",
        },
        { status: 429 }
      );
    }

    const now = new Date();
    const attached = await db
      .select({ id: agents.id })
      .from(agents)
      .where(
        and(eq(agents.linkedinAccountId, id), eq(agents.workspaceId, workspaceId))
      );

    await db.batch([
      db
        .update(linkedinAccounts)
        .set({
          country,
          countryChanges: used + 1,
          lastCountryChangeAt: now,
          // The ramp belongs to the address as much as to the account.
          warmupStartedAt: null,
          status: "pending",
          statusReason: `Moving to ${countryName(country)}. A new address is being allocated.`,
          updatedAt: now,
        })
        .where(
          and(
            eq(linkedinAccounts.id, id),
            eq(linkedinAccounts.workspaceId, workspaceId)
          )
        ),
      db
        .update(agents)
        .set({
          status: "paused",
          pausedReason: `Paused while this account moves to ${countryName(country)}. It starts its warm-up again on the new address.`,
          updatedAt: now,
        })
        .where(
          and(
            eq(agents.linkedinAccountId, id),
            eq(agents.workspaceId, workspaceId)
          )
        ),
    ]);

    if (attached.length) {
      await db.insert(agentEvents).values(
        attached.map((row) => ({
          id: crypto.randomUUID(),
          workspaceId,
          agentId: row.id,
          leadId: null,
          type: "country",
          message: `This account moved to ${countryName(country)} and starts its warm-up again on the new address.`,
          createdAt: now,
        }))
      );
    }

    return NextResponse.json({
      country,
      pausedAgents: attached.length,
      changesUsed: used + 1,
      changesAllowed: MAX_CHANGES_PER_MONTH,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to change the country" },
      { status: 500 }
    );
  }
}
