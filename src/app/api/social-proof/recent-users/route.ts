import { NextRequest, NextResponse } from "next/server";
import { desc, isNotNull } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const limit = rateLimit(`social-proof:${ip}`, {
    maxRequests: 60,
    windowMs: 60 * 1000,
  });

  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const recent = await db
      .select({
        name: users.name,
        plan: users.plan,
        isLifetimeDeal: users.isLifetimeDeal,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(isNotNull(users.name))
      .orderBy(desc(users.createdAt))
      .limit(10);

    const data = recent
      .filter((u) => u.name && u.name.trim().length > 0)
      .map((u) => {
        const raw = u.name!.trim().split(/\s+/)[0].slice(0, 20);
        const firstName = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
        return {
          firstName,
          plan: u.plan ?? "free",
          isLifetimeDeal: u.isLifetimeDeal ?? false,
          createdAt:
            u.createdAt instanceof Date ? u.createdAt.getTime() : Date.now(),
        };
      });

    return NextResponse.json(
      { users: data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("[social-proof/recent-users] error:", error);
    return NextResponse.json({ users: [] }, { status: 200 });
  }
}
