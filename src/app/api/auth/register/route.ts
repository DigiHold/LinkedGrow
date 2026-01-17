import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { sendWelcomeEmail } from "@/lib/email";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { rateLimit, AUTH_RATE_LIMITS, getClientIP } from "@/lib/rate-limit";

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
    const { name, email, password, subscribeNewsletter } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userId = randomUUID();
    await db.insert(users).values({
      id: userId,
      name: name || null,
      email: email,
      password: hashedPassword,
      plan: "free",
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail({ to: email, name: name || undefined }).catch((err) => {
      console.error("Failed to send welcome email:", err);
    });

    // Subscribe to newsletter if opted in (non-blocking)
    if (subscribeNewsletter) {
      subscribeToNewsletter({ email, name, source: "email_signup" }).catch((err) => {
        console.error("Failed to subscribe to newsletter:", err);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
