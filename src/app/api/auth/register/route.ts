import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { affiliates, affiliateReferrals } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

import { signUp, subscribeToNewsletter, brevoDate } from "@/lib/newsletter";
import { sendSignupWelcomeEmail } from "@/lib/email";
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
    const { name: rawName, email: rawEmail, password, subscribeNewsletter } = body;

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

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Unable to create account. Please try a different email or sign in." },
        { status: 400 }
      );
    }

    // Self hosted: the first account is the administrator and sign ups may be
    // closed. The cloud path answers plan free, never admin, never closed.
    const policy = await newUserPolicy();
    if (policy.closed) {
      return NextResponse.json({ error: SIGNUPS_CLOSED_MESSAGE }, { status: 403 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check for affiliate referral cookie
    const refCode = request.cookies.get("lg_ref")?.value;
    let validAffiliate: { id: string; referralCode: string } | null = null;
    if (refCode) {
      const aff = await db.query.affiliates.findFirst({
        where: and(
          eq(affiliates.referralCode, refCode),
          eq(affiliates.status, "approved"),
        ),
      });
      if (aff) {
        validAffiliate = { id: aff.id, referralCode: aff.referralCode };
      }
    }

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
      referredBy: validAffiliate?.referralCode || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Track affiliate referral
    if (validAffiliate) {
      await db.insert(affiliateReferrals).values({
        id: randomUUID(),
        affiliateId: validAffiliate.id,
        referredUserId: userId,
        status: "signed_up",
        createdAt: new Date(),
      });
      // Increment affiliate's signup count
      await db
        .update(affiliates)
        .set({
          totalSignups: sql`${affiliates.totalSignups} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(affiliates.id, validAffiliate.id));
    }

    // Add every new user to the Welcome list (#9) for segmentation. The
    // welcome email itself is ours (sendSignupWelcomeEmail below); the old
    // Brevo automation on this list is gone. Also add to the Blog list (#11)
    // if they opted in via the "Get growth tips" checkbox.
    // Seed free-user conversion attributes so the daily cron and real-time
    // hooks have a known starting state for every contact.
    signUp({
      email,
      name: name || undefined,
      source: "email_signup",
      attributes: {
        PLAN: "free",
        IS_PAID: false,
        SIGNUP_DATE: brevoDate(new Date()),
        LINKEDIN_CONNECTED: false,
        AI_KEY_ADDED: false,
        POSTS_CREATED: 0,
        POSTS_PUBLISHED: 0,
      },
    }).catch(() => {});
    if (subscribeNewsletter) {
      subscribeToNewsletter({ email, name: name || undefined, source: "email_signup" }).catch(() => {});
    }

    // Awaited on purpose: Vercel freezes the function when the response
    // returns, so a fire-and-forget send dies mid-flight (the ticket-email
    // incident). The failure stays silent; signup never breaks over an email.
    try {
      await sendSignupWelcomeEmail({ to: email, name: name || null });
    } catch {}

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
