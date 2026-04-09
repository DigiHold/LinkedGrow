// Email Course API - Subscribe to 7-day LinkedIn growth course (Brevo list #14)
import { NextRequest, NextResponse } from "next/server";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_EMAIL_COURSE_LIST_ID = 14;

// POST /api/email-course - Add contact to Brevo email course list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, _hp } = body;

    // Honeypot check - if filled, it's a bot
    if (_hp) {
      console.warn("[EmailCourse] Honeypot triggered for email:", email);
      return NextResponse.json({
        success: true,
        message: "You're in! Check your inbox.",
      });
    }

    // Validate email
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Validate name
    if (!name || name.trim().length < 1) {
      return NextResponse.json(
        { error: "Please enter your first name" },
        { status: 400 }
      );
    }

    if (!BREVO_API_KEY) {
return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

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
          FIRSTNAME: name.trim(),
        },
        listIds: [BREVO_EMAIL_COURSE_LIST_ID],
        updateEnabled: true,
      }),
    });

    // 204 = existing contact updated (no body), 201 = new contact created
    if (response.status === 204 || response.status === 201) {
      return NextResponse.json({
        success: true,
        message: "You're in! Check your inbox for Day 1.",
      });
    }

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "You're in! Check your inbox for Day 1.",
      });
    }

    // Handle duplicate contact (already on this exact list)
    if (response.status === 400 && data.code === "duplicate_parameter") {
      return NextResponse.json({
        success: true,
        message: "You're already enrolled! Check your inbox.",
      });
    }

    // Handle validation errors from Brevo
    if (response.status === 400) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  } catch (error) {
return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
