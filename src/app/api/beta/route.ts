// Beta Tester API - Email capture for beta testers with Brevo + Database storage
import { NextRequest, NextResponse } from "next/server";
import { db, betaUsers } from "@/lib/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_BETA_LIST_ID = 10; // Beta testers list
const MIN_SUBMIT_TIME_MS = 1000; // Minimum 1 second to submit (bot protection)

// POST /api/beta - Add email to Brevo beta testers list and database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, _hp, _ts } = body;

    // Honeypot check - if filled, it's a bot
    if (_hp) {
      // Silently accept to not reveal detection
      return NextResponse.json({
        success: true,
        message: "You're in!",
      });
    }

    // Time-based check - if submitted too fast, it's a bot
    if (_ts) {
      const submitTime = Date.now() - parseInt(_ts, 10);
      if (submitTime < MIN_SUBMIT_TIME_MS) {
        // Silently accept to not reveal detection
        return NextResponse.json({
          success: true,
          message: "You're in!",
        });
      }
    }

    // Validate email
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!BREVO_API_KEY) {
      console.error("Brevo API key not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists in database
    const existingBetaUser = await db.query.betaUsers.findFirst({
      where: eq(betaUsers.email, normalizedEmail),
    });

    // Save to database if not already there
    if (!existingBetaUser) {
      await db.insert(betaUsers).values({
        id: randomUUID(),
        email: normalizedEmail,
        name: name?.trim() || null,
        converted: false,
        createdAt: new Date(),
      });
    }

    // Add contact to Brevo
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        email: normalizedEmail,
        attributes: {
          FIRSTNAME: name?.trim() || "",
        },
        listIds: [BREVO_BETA_LIST_ID],
        updateEnabled: true, // Update if contact exists
      }),
    });

    const data = await response.json();

    if (response.ok || response.status === 204) {
      return NextResponse.json({
        success: true,
        message: "You're in!",
      });
    }

    // Handle duplicate contact
    if (response.status === 400 && data.code === "duplicate_parameter") {
      return NextResponse.json({
        success: true,
        message: "You're already registered!",
      });
    }

    // Handle validation errors from Brevo
    if (response.status === 400) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    console.error("Brevo API error:", data);
    return NextResponse.json(
      { error: "Failed to register" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Beta signup error:", error);
    return NextResponse.json(
      { error: "Failed to register" },
      { status: 500 }
    );
  }
}
