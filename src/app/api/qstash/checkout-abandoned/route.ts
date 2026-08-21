import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/ses-client";
import { baseEmailTemplate } from "@/lib/email/templates/base-template";
import { p, lead, button, small } from "@/lib/email/templates/parts";

/**
 * Fires one hour after a checkout opened and was not finished.
 *
 * Sends only when the account still has no subscription, and at most once
 * every 24 hours whatever happens, so retrying the checkout three times never
 * means three emails. The message sells the next step, not a discount: the
 * discount rule says the first mail of a sequence never carries one.
 */

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY ?? "",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY ?? "",
});

const APP = process.env.NEXT_PUBLIC_APP_URL || "https://linkedgrow.ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("upstash-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
    let isValid = false;
    try {
      isValid = await receiver.verify({
        signature,
        body,
        url: `${APP}/api/qstash/checkout-abandoned`,
      });
    } catch {
      isValid = false;
    }
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { userId, returnTo } = JSON.parse(body) as {
      userId?: string;
      returnTo?: string | null;
    };
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const [user] = await db
      .select({
        email: users.email,
        name: users.name,
        stripeSubscriptionId: users.stripeSubscriptionId,
        abandonEmailedAt: users.abandonEmailedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Paid in the meantime, or already reminded today: stay silent.
    if (!user || (user.stripeSubscriptionId && user.stripeSubscriptionId.length > 0)) {
      return NextResponse.json({ ok: true, sent: false });
    }
    const now = Math.floor(Date.now() / 1000);
    if (user.abandonEmailedAt && now - user.abandonEmailedAt < 24 * 3600) {
      return NextResponse.json({ ok: true, sent: false });
    }

    const firstName = (user.name || user.email.split("@")[0]).split(" ")[0];
    const resume =
      typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//")
        ? `${APP}${returnTo}`
        : `${APP}/dashboard/agents/new?resume=1`;

    await sendEmail({
      to: user.email,
      subject: "Your agent is built and waiting",
      html: baseEmailTemplate({
        preheader: "Everything you set up is saved. Launching takes one step.",
        content: `
${p(`Hello ${firstName},`)}
${lead("Your agent is saved, exactly as you configured it.")}
${p("Nothing was lost when you left the payment page. The trial is 7 days, you pay nothing today, and you can cancel any time before day 7 from the dashboard.")}
${button(resume, "Launch my agent")}
${p(`Rather see it live first? <a href="${APP}/book-demo" style="color:#0A66C2;text-decoration:underline;">Book a 15-minute demo</a> and I will build an agent on your business while you watch.`)}
${small("Questions? Reply to this email, a human reads it.")}
`,
      }),
      text: `Hello ${firstName},

Your agent is saved, exactly as you configured it. Nothing was lost when you left the payment page.

The trial is 7 days, you pay nothing today, and you can cancel any time before day 7.

Launch it: ${resume}

Rather see it live first? Book a 15-minute demo: ${APP}/book-demo

Questions? Reply to this email, a human reads it.`,
    });

    await db.update(users).set({ abandonEmailedAt: now }).where(eq(users.id, userId));
    return NextResponse.json({ ok: true, sent: true });
  } catch (error) {
    return NextResponse.json({ error: "Reminder not sent" }, { status: 500 });
  }
}
