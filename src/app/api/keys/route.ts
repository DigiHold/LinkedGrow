import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, apiKeys, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateApiKey, ALL_SCOPES, ApiScope } from "@/lib/api-auth";
import { canAccessFeature, PlanId } from "@/lib/plans";

// GET - List all API keys for the user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check Business plan
    if (!canAccessFeature(user.plan as PlanId, "apiAccess")) {
      return NextResponse.json({ error: "API access requires Business plan" }, { status: 403 });
    }

    // Fetch API keys (without the hash for security)
    const keys = await db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, user.id),
    });

    return NextResponse.json({
      keys: keys.map((key) => ({
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        scopes: key.scopes ? JSON.parse(key.scopes) : ALL_SCOPES,
        lastUsedAt: key.lastUsedAt?.toISOString() || null,
        expiresAt: key.expiresAt?.toISOString() || null,
        createdAt: key.createdAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch API keys:", error);
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
  }
}

// POST - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check Business plan
    if (!canAccessFeature(user.plan as PlanId, "apiAccess")) {
      return NextResponse.json({ error: "API access requires Business plan" }, { status: 403 });
    }

    const body = await request.json();
    const { name, scopes } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Validate scopes
    const validScopes = scopes?.filter((s: string) => ALL_SCOPES.includes(s as ApiScope)) || ALL_SCOPES;

    if (validScopes.length === 0) {
      return NextResponse.json({ error: "At least one valid scope is required" }, { status: 400 });
    }

    // Check key limit (max 10 keys per user)
    const existingKeys = await db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, user.id),
    });

    if (existingKeys.length >= 10) {
      return NextResponse.json({ error: "Maximum 10 API keys allowed per account" }, { status: 400 });
    }

    // Generate new API key
    const { key, prefix, hash } = generateApiKey();

    // Save to database
    await db.insert(apiKeys).values({
      id: nanoid(),
      userId: user.id,
      name: name.trim(),
      keyHash: hash,
      keyPrefix: prefix,
      scopes: JSON.stringify(validScopes),
      createdAt: new Date(),
    });

    // Return the key (only time it's shown)
    return NextResponse.json({
      key,
      message: "API key created successfully. Copy it now - you won't be able to see it again!",
    });
  } catch (error) {
    console.error("Failed to create API key:", error);
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}
