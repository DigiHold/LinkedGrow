import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { affiliates, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createHmac } from "crypto";
import {
  sendAffiliateApprovedEmail,
  sendAffiliateRejectedEmail,
} from "@/lib/email";

// Verify the HMAC token to ensure the link came from our email
function verifyActionToken(
  affiliateId: string,
  action: string,
  token: string
): boolean {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret)
    .update(`${affiliateId}:${action}`)
    .digest("hex");
  return token === expected;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const affiliateId = searchParams.get("id");
  const action = searchParams.get("action");
  const token = searchParams.get("token");

  if (!affiliateId || !action || !token) {
    return new NextResponse(errorPage("Missing parameters"), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  if (action !== "approve" && action !== "reject") {
    return new NextResponse(errorPage("Invalid action"), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  if (!verifyActionToken(affiliateId, action, token)) {
    return new NextResponse(errorPage("Invalid or expired token"), {
      status: 403,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Find the affiliate
  const affiliate = await db.query.affiliates.findFirst({
    where: eq(affiliates.id, affiliateId),
  });

  if (!affiliate) {
    return new NextResponse(errorPage("Affiliate not found"), {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Check if already processed
  if (affiliate.status !== "pending") {
    return new NextResponse(
      successPage(
        `This affiliate has already been ${affiliate.status}.`,
        affiliate.status || "processed"
      ),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  // Update affiliate status
  await db
    .update(affiliates)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(affiliates.id, affiliateId));

  // Get user info for notification email
  const user = await db.query.users.findFirst({
    where: eq(users.id, affiliate.userId),
  });

  // Send notification email to the affiliate
  if (user?.email) {
    if (action === "approve") {
      sendAffiliateApprovedEmail({
        to: user.email,
        name: user.name || "there",
        referralCode: affiliate.referralCode,
      }).catch(() => {});
    } else {
      sendAffiliateRejectedEmail({
        to: user.email,
        name: user.name || "there",
      }).catch(() => {});
    }
  }

  return new NextResponse(
    successPage(
      action === "approve"
        ? `${user?.name || "Affiliate"} has been approved! They will receive an email with their referral link.`
        : `${user?.name || "Affiliate"} has been rejected. They will receive a notification email.`,
      newStatus
    ),
    { headers: { "Content-Type": "text/html" } }
  );
}

function successPage(message: string, status: string): string {
  const color = status === "approved" ? "#16a34a" : "#dc2626";
  const icon = status === "approved" ? "&#10003;" : "&#10005;";
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Affiliate ${label} - LinkedGrow</title>
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background: #F4F7FA; margin: 0; padding: 40px 20px; }
    .card { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .icon { width: 64px; height: 64px; border-radius: 50%; background: ${color}; color: #fff; font-size: 32px; line-height: 64px; margin: 0 auto 20px; }
    h1 { color: #0F172B; font-size: 24px; margin: 0 0 12px; }
    p { color: #45556C; font-size: 16px; line-height: 1.6; margin: 0 0 24px; }
    a { display: inline-block; background: #0182f2; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>Affiliate ${label}</h1>
    <p>${message}</p>
    <a href="https://linkedgrow.ai/dashboard/admin/affiliates">Go to Admin Dashboard</a>
  </div>
</body>
</html>`;
}

function errorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Error - LinkedGrow</title>
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background: #F4F7FA; margin: 0; padding: 40px 20px; }
    .card { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .icon { width: 64px; height: 64px; border-radius: 50%; background: #f59e0b; color: #fff; font-size: 32px; line-height: 64px; margin: 0 auto 20px; }
    h1 { color: #0F172B; font-size: 24px; margin: 0 0 12px; }
    p { color: #45556C; font-size: 16px; line-height: 1.6; margin: 0 0 24px; }
    a { display: inline-block; background: #0182f2; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">!</div>
    <h1>Something Went Wrong</h1>
    <p>${message}</p>
    <a href="https://linkedgrow.ai/dashboard/admin/affiliates">Go to Admin Dashboard</a>
  </div>
</body>
</html>`;
}
