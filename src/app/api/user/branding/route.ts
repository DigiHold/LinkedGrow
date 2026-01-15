import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessFeature } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

// GET /api/user/branding - Get branding settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has access to custom branding
    const userPlan = (user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "customBranding")) {
      return NextResponse.json(
        { error: "Custom branding requires Business plan" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      logoUrl: user.brandLogoUrl || null,
      primaryColor: user.brandPrimaryColor || "#0a66c2",
      secondaryColor: user.brandSecondaryColor || "#057642",
      fontFamily: user.brandFontFamily || "inter",
    });
  } catch (error) {
    console.error("Failed to fetch branding settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch branding settings" },
      { status: 500 }
    );
  }
}

// PUT /api/user/branding - Update branding settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has access to custom branding
    const userPlan = (user.plan || "free") as PlanId;
    if (!canAccessFeature(userPlan, "customBranding")) {
      return NextResponse.json(
        { error: "Custom branding requires Business plan" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { primaryColor, secondaryColor, fontFamily } = body;

    // Validate hex colors
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (primaryColor && !hexColorRegex.test(primaryColor)) {
      return NextResponse.json(
        { error: "Invalid primary color format" },
        { status: 400 }
      );
    }
    if (secondaryColor && !hexColorRegex.test(secondaryColor)) {
      return NextResponse.json(
        { error: "Invalid secondary color format" },
        { status: 400 }
      );
    }

    // Validate font family
    const validFonts = ["inter", "roboto", "poppins", "montserrat", "playfair", "merriweather"];
    if (fontFamily && !validFonts.includes(fontFamily)) {
      return NextResponse.json(
        { error: "Invalid font family" },
        { status: 400 }
      );
    }

    // Update branding settings
    await db
      .update(users)
      .set({
        brandPrimaryColor: primaryColor,
        brandSecondaryColor: secondaryColor,
        brandFontFamily: fontFamily,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update branding settings:", error);
    return NextResponse.json(
      { error: "Failed to update branding settings" },
      { status: 500 }
    );
  }
}
