import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Reports which environment variables the running deployment can actually see.
 *
 * Vercel bakes variables into a deployment, so "I set it in the dashboard" and
 * "the running code has it" are different facts, and the only way to tell them
 * apart from the outside is to ask the deployment. Diagnosing this by guessing
 * cost a whole afternoon on 2026-07-26.
 *
 * Never returns a value. Presence, length and a four-character fingerprint are
 * enough to answer "is it set" and "is it the one I pasted", and none of them
 * leak the secret.
 */
const EXPECTED = [
  "ENCRYPTION_KEY",
  "AUTH_SECRET",
  "AUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "TURSO_DATABASE_URL",
  "TURSO_AUTH_TOKEN",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "QSTASH_TOKEN",
  "QSTASH_CURRENT_SIGNING_KEY",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "BREVO_API_KEY",
] as const;

function fingerprint(value: string): string {
  // Last 4 characters only, so two environments can be compared without the
  // secret ever appearing in full.
  return value.length <= 4 ? "****" : `...${value.slice(-4)}`;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const vars = EXPECTED.map((name) => {
      const raw = process.env[name];
      const set = typeof raw === "string" && raw.length > 0;
      return {
        name,
        set,
        length: set ? raw.length : 0,
        tail: set ? fingerprint(raw) : null,
      };
    });

    return NextResponse.json({
      // Which database this deployment talks to, so staging and production
      // can never be confused for one another again.
      database: process.env.TURSO_DATABASE_URL?.split("//")[1]?.split(".")[0] ?? null,
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? "not on vercel",
      vercelBranch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      missing: vars.filter((v) => !v.set).map((v) => v.name),
      vars,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to read environment" },
      { status: 500 }
    );
  }
}
