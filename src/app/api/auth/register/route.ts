import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

import { rateLimit, AUTH_RATE_LIMITS, getClientIP } from "@/lib/rate-limit";
import { newUserPolicy, SIGNUPS_CLOSED_MESSAGE } from "@/lib/registration";


export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 3 registrations per hour per IP
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(
      `register:${clientIP}`,
      AUTH_RATE_LIMITS.register
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    const body = await request.json();
    const { name: rawName, email: rawEmail, password } = body;

    if (!rawEmail || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const email = String(rawEmail).toLowerCase().trim();
    const name = rawName ? String(rawName).trim().slice(0, 100) : null;

    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: "Password must be 128 characters or less" },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one uppercase letter" },
        { status: 400 }
      );
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one number" },
        { status: 400 }
      );
    }

    // Self hosted: the first account is the administrator and sign ups may be
    // closed. The cloud path answers plan free, never admin, never closed.
    // Checked before the email lookup, so a closed instance never confirms
    // which addresses already hold an account.
    const policy = await newUserPolicy();
    if (policy.closed) {
      return NextResponse.json({ error: SIGNUPS_CLOSED_MESSAGE }, { status: 403 });
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Unable to create account. Please try a different email or sign in." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const userId = randomUUID();
    await db.insert(users).values({
      id: userId,
      name: name,
      email: email,
      password: hashedPassword,
      // Cloud: no plan until Stripe says so. The trial is granted by Checkout
      // and its dates are written back by the webhook, so an account created
      // here can sign in and reach nothing except the plan picker.
      // Self hosted: business, and the first account is the administrator.
      plan: policy.plan,
      isAdmin: policy.isAdmin,
      hasUsedTrial: false,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
    });
  } catch (error) {
return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
