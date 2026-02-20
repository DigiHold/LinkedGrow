// Subscription welcome email - sent when a user subscribes to a paid plan
import { baseEmailTemplate } from "./base-template";

interface SubscriptionWelcomeEmailParams {
  name?: string;
  planName: string;
}

function formatPlanName(plan: string): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export function subscriptionWelcomeEmailTemplate({
  name,
  planName,
}: SubscriptionWelcomeEmailParams): string {
  const greeting = name ? `Hey ${name}!` : "Hey there!";
  const displayPlan = formatPlanName(planName);

  const content = `
    <h1 style="color: #0F172B; font-size: 28px; line-height: 1.3; font-weight: 700; margin: 0 0 20px 0;">
      ${greeting} Welcome to LinkedGrow ${displayPlan}!
    </h1>

    <p style="color: #45556C; font-size: 16px; line-height: 1.65; margin: 0 0 16px 0;">
      Thank you for subscribing! You now have full access to all <strong>${displayPlan}</strong> features. We're excited to help you grow on LinkedIn.
    </p>

    <p style="color: #45556C; font-size: 16px; line-height: 1.65; margin: 0 0 16px 0;">
      <strong>One quick thing to get started:</strong> LinkedGrow uses a <strong>Bring Your Own Key</strong> model for AI features. This means you connect your own API key from OpenAI, Claude, Google, or any other provider you prefer. It gives you unlimited content generation at a fraction of what other tools charge - typically just <strong>$2-4/month</strong> in API costs.
    </p>

    <!-- CTA Button -->
    <table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td align="center" bgcolor="#0182f2" style="border-radius: 8px;">
          <a href="https://linkedgrow.ai/dashboard/settings/ai-api" target="_blank" style="display: block; padding: 16px 32px; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; text-align: center;">
            Connect Your AI API Key
          </a>
        </td>
      </tr>
    </table>

    <p style="color: #45556C; font-size: 16px; line-height: 1.65; margin: 0 0 16px 0;">
      Once your API key is connected, head over to your dashboard to create your first AI-powered LinkedIn post, schedule content, and start growing your audience.
    </p>

    <!-- Secondary CTA -->
    <table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td align="center" style="border-radius: 8px; border: 2px solid #0182f2;">
          <a href="https://linkedgrow.ai/dashboard" target="_blank" style="display: block; padding: 14px 32px; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 600; color: #0182f2; text-decoration: none; border-radius: 6px; text-align: center;">
            Go to Dashboard
          </a>
        </td>
      </tr>
    </table>

    <p style="color: #45556C; font-size: 16px; line-height: 1.65; margin: 0 0 8px 0;">
      If you have any questions, just reply to this email. We read every message.
    </p>

    <!-- Divider -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
      <tr><td style="border-top: 1px solid #e2e8f0;"></td></tr>
    </table>

    <p style="color: #45556C; font-size: 16px; line-height: 1.65; margin: 0 0 4px 0;">
      See you soon,
    </p>
    <p style="color: #0F172B; font-size: 16px; line-height: 1.65; font-weight: 600; margin: 0;">
      Nicolas & Maria
    </p>
    <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">
      Founders of LinkedGrow
    </p>
  `;

  return baseEmailTemplate({
    preheader: `Welcome to LinkedGrow ${displayPlan}! Set up your AI API key to get started.`,
    content,
  });
}

export function subscriptionWelcomeEmailText({
  name,
  planName,
}: SubscriptionWelcomeEmailParams): string {
  const greeting = name ? `Hey ${name}!` : "Hey there!";
  const displayPlan = formatPlanName(planName);

  return `${greeting} Welcome to LinkedGrow ${displayPlan}!

Thank you for subscribing! You now have full access to all ${displayPlan} features. We're excited to help you grow on LinkedIn.

One quick thing to get started: LinkedGrow uses a Bring Your Own Key model for AI features. This means you connect your own API key from OpenAI, Claude, Google, or any other provider you prefer. It gives you unlimited content generation at a fraction of what other tools charge - typically just $2-4/month in API costs.

Connect Your AI API Key: https://linkedgrow.ai/dashboard/settings/ai-api

Once your API key is connected, head over to your dashboard to create your first AI-powered LinkedIn post, schedule content, and start growing your audience.

Go to Dashboard: https://linkedgrow.ai/dashboard

If you have any questions, just reply to this email. We read every message.

See you soon,
Nicolas & Maria
Founders of LinkedGrow

---

LinkedGrow - AI-Powered LinkedIn Content Platform
A product of Vayalis, Paris, France

Privacy Policy: https://linkedgrow.ai/privacy
Cookie Policy: https://linkedgrow.ai/cookies
`;
}
