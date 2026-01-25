// Abandoned cart recovery email templates - 3-email sequence
// Follows the same branding as welcome/reset-password emails
import { PLANS, type PlanId } from "@/lib/plans";

interface AbandonedCartEmailParams {
  name?: string;
  planId: PlanId;
  recoveryUrl: string;
}

// Helper to get plan features for display
function getPlanFeatures(planId: PlanId): string[] {
  const features: string[] = [];
  const plan = PLANS[planId];

  if (planId === "starter") {
    features.push("Unlimited AI-powered posts");
    features.push("Advanced editor with rich formatting");
    features.push("Content calendar & scheduling");
    features.push("Reddit idea sourcing");
  } else if (planId === "pro") {
    features.push("Unlimited AI-powered posts");
    features.push("AI image generation (Banana Pro, DALL-E, Flux, more)");
    features.push("Carousel generator for viral content");
    features.push("Analytics dashboard & engagement tools");
    features.push("Algorithm optimizer for maximum reach");
  } else if (planId === "business") {
    features.push("Everything in Pro, plus:");
    features.push("Team collaboration with role-based access");
    features.push("A/B testing to optimize engagement");
    features.push("Custom branding for exports");
    features.push("API access for custom integrations");
    features.push("Priority support");
  }

  return features;
}

// Email 1: Friendly Reminder (Day 2)
export function abandonedCartEmail1Template({
  name,
  planId,
  recoveryUrl,
}: AbandonedCartEmailParams): string {
  const greeting = name ? `Hey ${name}!` : "Hey there!";
  const plan = PLANS[planId];
  const features = getPlanFeatures(planId);
  const featuresList = features.map(f => `<li style="margin-bottom: 8px;">${f}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="en" dir="ltr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
    <meta name="x-apple-disable-message-reformatting">
    <!--[if mso]>
    <style>
        * { font-family: sans-serif !important; }
    </style>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; }
        body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility;}
        img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        table { border-collapse: collapse; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        h1, h2, h3, h4, h5, p { margin: 0; word-break: break-word; }

        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }

        @media all and (max-width: 639px) {
            .wrapper { width: 100% !important; }
            .container { width: 100% !important; min-width: 100% !important; padding: 0 !important; }
            .row { padding-left: 20px !important; padding-right: 20px !important; }
            .img { width: 100% !important; height: auto !important; }
        }
    </style>
    <title>Your LinkedGrow upgrade is waiting</title>
</head>
<body style="margin: 0 !important; padding: 0 !important; background-color: #F4F7FA;">
    <div style="background-color: #F4F7FA; line-height: 100%; font-size: 16px;">
        <!-- Hidden preheader text -->
        <div style="display: none; font-size: 0px; color: #F4F7FA; line-height: 0px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
            &nbsp;Your ${plan.name} upgrade is saved and ready to complete.
        </div>

        <table width="100%" align="center" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td bgcolor="#F4F7FA" align="center" valign="top" style="padding: 0 8px;">

                    <!-- Top spacing -->
                    <table class="container" align="center" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width: 640px;">
                        <tr>
                            <td height="20" style="line-height: 20px;"></td>
                        </tr>
                    </table>

                    <!-- Main Content -->
                    <table width="640" class="wrapper" align="center" border="0" cellpadding="0" cellspacing="0" style="max-width: 640px; border: 1px solid #EAECED; border-radius: 8px; border-collapse: separate !important; overflow: hidden;">
                        <tr>
                            <td align="center">

                                <!-- Logo -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="40" style="line-height: 40px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" align="center" style="padding: 0 50px;">
                                            <img src="https://linkedgrow.ai/images/email/logo.png" border="0" alt="LinkedGrow" width="238" style="max-width: 238px; display: inline-block;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="30" style="line-height: 30px;"></td>
                                    </tr>
                                </table>

                                <!-- Title -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <h1 style="font-family: 'Inter', sans-serif; color: #0F172B; font-size: 32px; line-height: 125%; font-weight: bold; margin-bottom: 0;">${greeting}</h1>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Content -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 16px;">You started upgrading to <strong>LinkedGrow ${plan.name}</strong> but didn't finish - no worries, we saved everything for you.</p>

                                            <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 12px;"><strong>Here's what you'll unlock:</strong></p>

                                            <ul style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 16px; padding-left: 20px;">
                                                ${featuresList}
                                            </ul>

                                            <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 0;">Your checkout is still ready - just click below to pick up where you left off.</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- CTA Button -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="10" style="line-height: 10px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" align="center" style="padding: 0 50px;">
                                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                                <tr>
                                                    <td align="center" bgcolor="#0182f2" style="border-radius: 8px;">
                                                        <a href="${recoveryUrl}" target="_blank" style="display: block; padding: 16px 32px; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; text-align: center;">Complete Your Upgrade</a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="30" style="line-height: 30px;"></td>
                                    </tr>
                                </table>

                                <!-- Info Box -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <div style="background-color: #FEF3C7; border-radius: 8px; padding: 16px;">
                                                <p style="font-family: 'Inter', sans-serif; color: #92400E; font-size: 14px; line-height: 150%; margin: 0;">
                                                    <strong>Remember:</strong> You're using your own AI keys - so you get unlimited generations for just $2-4/month in API costs. No surprise bills, ever.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Divider -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;" align="center">
                                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%">
                                                <tr>
                                                    <td style="border-top: 1px solid #EAECED;"></td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Questions -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 0;">Questions? Just reply to this email - we read every message.</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Sign off -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 0;">Cheers,</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Photos -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td class="row" style="padding: 0 50px; line-height: 1;" align="left">
                                            <img src="https://linkedgrow.ai/images/email/photos.png" loading="lazy" border="0" alt="Nicolas & Maria - Founders of LinkedGrow" width="158" height="89" style="display: block; width: 158px; height: 89px;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Signature -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td class="row" style="padding: 0 50px; line-height: 1;" align="left">
                                            <img src="https://linkedgrow.ai/images/email/nicolas-maria.png" loading="lazy" border="0" alt="Nicolas & Maria" width="204" height="49" style="display: block; width: 204px; height: 49px;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Divider 2 -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;" align="center">
                                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%">
                                                <tr>
                                                    <td style="border-top: 1px solid #EAECED;"></td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Footer -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="40" style="line-height: 40px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <table align="center" width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td align="center">
                                                        <img src="https://linkedgrow.ai/images/email/logo.png" border="0" alt="LinkedGrow" width="180" style="max-width: 180px; display: inline-block;">
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td height="20" style="line-height: 20px;"></td>
                                                </tr>
                                                <tr>
                                                    <td align="center" style="text-align: center !important;">
                                                        <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 14px; line-height: 150%; margin-bottom: 0;">LinkedGrow - AI-Powered LinkedIn Content Platform<br>78 Avenue des Champs-Elysees, Paris, France</p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td height="16" style="line-height: 16px;"></td>
                                                </tr>
                                                <tr>
                                                    <td align="center">
                                                        <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 14px; line-height: 150%; margin-bottom: 0;">
                                                            <a href="https://linkedgrow.ai/privacy" style="color: #45556C; text-decoration: underline;">Privacy Policy</a>
                                                            <span style="color: #45556C;"> | </span>
                                                            <a href="https://linkedgrow.ai/cookies" style="color: #45556C; text-decoration: underline;">Cookie Policy</a>
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="40" style="line-height: 40px;"></td>
                                    </tr>
                                </table>

                            </td>
                        </tr>
                    </table>

                    <!-- Bottom spacing -->
                    <table cellpadding="0" cellspacing="0" border="0" align="center" width="640" style="max-width: 640px; width: 100%;">
                        <tr>
                            <td height="40" style="line-height: 40px;"></td>
                        </tr>
                    </table>

                </td>
            </tr>
        </table>
    </div>
</body>
</html>`;
}

// Email 2: Value Reminder (Day 5)
export function abandonedCartEmail2Template({
  name,
  planId,
  recoveryUrl,
}: AbandonedCartEmailParams): string {
  const greeting = name ? `Hey ${name}!` : "Hey there!";
  const plan = PLANS[planId];

  return `<!DOCTYPE html>
<html lang="en" dir="ltr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
    <meta name="x-apple-disable-message-reformatting">
    <!--[if mso]>
    <style>
        * { font-family: sans-serif !important; }
    </style>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; }
        body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility;}
        img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        table { border-collapse: collapse; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        h1, h2, h3, h4, h5, p { margin: 0; word-break: break-word; }

        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }

        @media all and (max-width: 639px) {
            .wrapper { width: 100% !important; }
            .container { width: 100% !important; min-width: 100% !important; padding: 0 !important; }
            .row { padding-left: 20px !important; padding-right: 20px !important; }
            .img { width: 100% !important; height: auto !important; }
        }
    </style>
    <title>Quick question about your upgrade</title>
</head>
<body style="margin: 0 !important; padding: 0 !important; background-color: #F4F7FA;">
    <div style="background-color: #F4F7FA; line-height: 100%; font-size: 16px;">
        <!-- Hidden preheader text -->
        <div style="display: none; font-size: 0px; color: #F4F7FA; line-height: 0px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
            &nbsp;Is something holding you back? Let us help.
        </div>

        <table width="100%" align="center" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td bgcolor="#F4F7FA" align="center" valign="top" style="padding: 0 8px;">

                    <!-- Top spacing -->
                    <table class="container" align="center" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width: 640px;">
                        <tr>
                            <td height="20" style="line-height: 20px;"></td>
                        </tr>
                    </table>

                    <!-- Main Content -->
                    <table width="640" class="wrapper" align="center" border="0" cellpadding="0" cellspacing="0" style="max-width: 640px; border: 1px solid #EAECED; border-radius: 8px; border-collapse: separate !important; overflow: hidden;">
                        <tr>
                            <td align="center">

                                <!-- Logo -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="40" style="line-height: 40px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" align="center" style="padding: 0 50px;">
                                            <img src="https://linkedgrow.ai/images/email/logo.png" border="0" alt="LinkedGrow" width="238" style="max-width: 238px; display: inline-block;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="30" style="line-height: 30px;"></td>
                                    </tr>
                                </table>

                                <!-- Title -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <h1 style="font-family: 'Inter', sans-serif; color: #0F172B; font-size: 32px; line-height: 125%; font-weight: bold; margin-bottom: 0;">${greeting}</h1>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Content -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 16px;">I noticed you haven't completed your upgrade yet, and I wanted to check in.</p>

                                            <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 16px;"><strong>Is something holding you back?</strong> Common questions I get:</p>
                                        </td>
                                    </tr>
                                </table>

                                <!-- FAQ Section -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <!-- Question 1 -->
                                            <div style="background-color: #F8FAFC; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                                                <p style="font-family: 'Inter', sans-serif; color: #0F172B; font-size: 15px; line-height: 150%; margin: 0 0 8px 0; font-weight: 600;">"Will it actually save me time?"</p>
                                                <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 14px; line-height: 150%; margin: 0;">Our users typically go from 2 hours to 15 minutes per post. The AI learns your voice and writes like you.</p>
                                            </div>

                                            <!-- Question 2 -->
                                            <div style="background-color: #F8FAFC; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                                                <p style="font-family: 'Inter', sans-serif; color: #0F172B; font-size: 15px; line-height: 150%; margin: 0 0 8px 0; font-weight: 600;">"What if I don't use it enough?"</p>
                                                <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 14px; line-height: 150%; margin: 0;">With your own API keys, you only pay for what you use. No monthly caps, no wasted subscription.</p>
                                            </div>

                                            <!-- Question 3 -->
                                            <div style="background-color: #F8FAFC; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                                                <p style="font-family: 'Inter', sans-serif; color: #0F172B; font-size: 15px; line-height: 150%; margin: 0 0 8px 0; font-weight: 600;">"Is it hard to set up?"</p>
                                                <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 14px; line-height: 150%; margin: 0;">Connect your AI key in 30 seconds. We support OpenAI, Claude, Google, Grok, and more.</p>
                                            </div>
                                        </td>
                                    </tr>
                                </table>

                                <!-- CTA -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 16px;">Your upgrade is still waiting:</p>
                                        </td>
                                    </tr>
                                </table>

                                <!-- CTA Button -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td class="row" align="center" style="padding: 0 50px;">
                                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                                <tr>
                                                    <td align="center" bgcolor="#0182f2" style="border-radius: 8px;">
                                                        <a href="${recoveryUrl}" target="_blank" style="display: block; padding: 16px 32px; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; text-align: center;">Resume Your Upgrade</a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="30" style="line-height: 30px;"></td>
                                    </tr>
                                </table>

                                <!-- Divider -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;" align="center">
                                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%">
                                                <tr>
                                                    <td style="border-top: 1px solid #EAECED;"></td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Questions -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 0;">If you have other questions, just hit reply - I personally respond to every email.</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Sign off -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 0;">Best,</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Photos -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td class="row" style="padding: 0 50px; line-height: 1;" align="left">
                                            <img src="https://linkedgrow.ai/images/email/photos.png" loading="lazy" border="0" alt="Nicolas & Maria - Founders of LinkedGrow" width="158" height="89" style="display: block; width: 158px; height: 89px;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Signature -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td class="row" style="padding: 0 50px; line-height: 1;" align="left">
                                            <img src="https://linkedgrow.ai/images/email/nicolas-maria.png" loading="lazy" border="0" alt="Nicolas & Maria" width="204" height="49" style="display: block; width: 204px; height: 49px;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Plan reminder -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <p style="font-family: 'Inter', sans-serif; color: #64748B; font-size: 14px; line-height: 150%; margin-top: 0; margin-bottom: 0;"><em>P.S. Here's what ${plan.name} includes: ${plan.description}</em></p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Divider 2 -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;" align="center">
                                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%">
                                                <tr>
                                                    <td style="border-top: 1px solid #EAECED;"></td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Footer -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="40" style="line-height: 40px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <table align="center" width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td align="center">
                                                        <img src="https://linkedgrow.ai/images/email/logo.png" border="0" alt="LinkedGrow" width="180" style="max-width: 180px; display: inline-block;">
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td height="20" style="line-height: 20px;"></td>
                                                </tr>
                                                <tr>
                                                    <td align="center" style="text-align: center !important;">
                                                        <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 14px; line-height: 150%; margin-bottom: 0;">LinkedGrow - AI-Powered LinkedIn Content Platform<br>78 Avenue des Champs-Elysees, Paris, France</p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td height="16" style="line-height: 16px;"></td>
                                                </tr>
                                                <tr>
                                                    <td align="center">
                                                        <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 14px; line-height: 150%; margin-bottom: 0;">
                                                            <a href="https://linkedgrow.ai/privacy" style="color: #45556C; text-decoration: underline;">Privacy Policy</a>
                                                            <span style="color: #45556C;"> | </span>
                                                            <a href="https://linkedgrow.ai/cookies" style="color: #45556C; text-decoration: underline;">Cookie Policy</a>
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="40" style="line-height: 40px;"></td>
                                    </tr>
                                </table>

                            </td>
                        </tr>
                    </table>

                    <!-- Bottom spacing -->
                    <table cellpadding="0" cellspacing="0" border="0" align="center" width="640" style="max-width: 640px; width: 100%;">
                        <tr>
                            <td height="40" style="line-height: 40px;"></td>
                        </tr>
                    </table>

                </td>
            </tr>
        </table>
    </div>
</body>
</html>`;
}

// Email 3: Final Push with Discount (Day 8)
interface AbandonedCartEmail3Params extends AbandonedCartEmailParams {
  discountCode: string;
  discountPercent: number;
  discountMonths: number;
}

export function abandonedCartEmail3Template({
  name,
  planId,
  recoveryUrl,
  discountCode,
  discountPercent,
  discountMonths,
}: AbandonedCartEmail3Params): string {
  const greeting = name ? `Hey ${name}!` : "Hey there!";
  const plan = PLANS[planId];
  const discountedPrice = Math.round(plan.price * (1 - discountPercent / 100));
  const features = getPlanFeatures(planId);
  const featuresList = features.map(f => `<li style="margin-bottom: 6px;">${f}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="en" dir="ltr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
    <meta name="x-apple-disable-message-reformatting">
    <!--[if mso]>
    <style>
        * { font-family: sans-serif !important; }
    </style>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; }
        body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility;}
        img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        table { border-collapse: collapse; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        h1, h2, h3, h4, h5, p { margin: 0; word-break: break-word; }

        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }

        @media all and (max-width: 639px) {
            .wrapper { width: 100% !important; }
            .container { width: 100% !important; min-width: 100% !important; padding: 0 !important; }
            .row { padding-left: 20px !important; padding-right: 20px !important; }
            .img { width: 100% !important; height: auto !important; }
        }
    </style>
    <title>Last chance: ${discountPercent}% off your LinkedGrow upgrade</title>
</head>
<body style="margin: 0 !important; padding: 0 !important; background-color: #F4F7FA;">
    <div style="background-color: #F4F7FA; line-height: 100%; font-size: 16px;">
        <!-- Hidden preheader text -->
        <div style="display: none; font-size: 0px; color: #F4F7FA; line-height: 0px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
            &nbsp;Your exclusive ${discountPercent}% discount expires in 48 hours.
        </div>

        <table width="100%" align="center" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td bgcolor="#F4F7FA" align="center" valign="top" style="padding: 0 8px;">

                    <!-- Top spacing -->
                    <table class="container" align="center" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width: 640px;">
                        <tr>
                            <td height="20" style="line-height: 20px;"></td>
                        </tr>
                    </table>

                    <!-- Main Content -->
                    <table width="640" class="wrapper" align="center" border="0" cellpadding="0" cellspacing="0" style="max-width: 640px; border: 1px solid #EAECED; border-radius: 8px; border-collapse: separate !important; overflow: hidden;">
                        <tr>
                            <td align="center">

                                <!-- Logo -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="40" style="line-height: 40px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" align="center" style="padding: 0 50px;">
                                            <img src="https://linkedgrow.ai/images/email/logo.png" border="0" alt="LinkedGrow" width="238" style="max-width: 238px; display: inline-block;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="30" style="line-height: 30px;"></td>
                                    </tr>
                                </table>

                                <!-- Title -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <h1 style="font-family: 'Inter', sans-serif; color: #0F172B; font-size: 32px; line-height: 125%; font-weight: bold; margin-bottom: 0;">${greeting}</h1>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Content -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 16px;">This is my last email about your upgrade - I promise!</p>

                                            <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 16px;">As a thank you for considering LinkedGrow, I'd like to offer you <strong>${discountPercent}% off your first ${discountMonths} months</strong>.</p>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Discount Code Box -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <div style="background: linear-gradient(135deg, #06B6D4 0%, #2563EB 100%); border-radius: 12px; padding: 24px; text-align: center;">
                                                <p style="font-family: 'Inter', sans-serif; color: #ffffff; font-size: 14px; line-height: 150%; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Use code</p>
                                                <p style="font-family: 'Inter', monospace; color: #ffffff; font-size: 28px; line-height: 100%; margin: 0 0 12px 0; font-weight: bold; letter-spacing: 2px;">${discountCode}</p>
                                                <p style="font-family: 'Inter', sans-serif; color: #ffffff; font-size: 16px; line-height: 150%; margin: 0;">
                                                    <strong>${plan.name}</strong> for just <strong>$${discountedPrice}/month</strong> <span style="text-decoration: line-through; opacity: 0.7;">$${plan.price}/month</span>
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Features -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 12px;"><strong>Here's what you'll get:</strong></p>
                                            <ul style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 15px; line-height: 165%; margin-top: 0; margin-bottom: 16px; padding-left: 20px;">
                                                ${featuresList}
                                            </ul>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Urgency Notice -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px;">
                                                <p style="font-family: 'Inter', sans-serif; color: #991B1B; font-size: 14px; line-height: 150%; margin: 0; text-align: center;">
                                                    <strong>This code expires in 48 hours.</strong>
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- CTA Button -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="10" style="line-height: 10px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" align="center" style="padding: 0 50px;">
                                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                                <tr>
                                                    <td align="center" bgcolor="#0182f2" style="border-radius: 8px;">
                                                        <a href="${recoveryUrl}" target="_blank" style="display: block; padding: 16px 32px; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; text-align: center;">Claim Your ${discountPercent}% Discount</a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="30" style="line-height: 30px;"></td>
                                    </tr>
                                </table>

                                <!-- Divider -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;" align="center">
                                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%">
                                                <tr>
                                                    <td style="border-top: 1px solid #EAECED;"></td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- No hard feelings -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 0;">If LinkedGrow isn't right for you, no hard feelings - I appreciate you checking us out.</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Sign off -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 0;">Wishing you LinkedIn success either way,</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Photos -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td class="row" style="padding: 0 50px; line-height: 1;" align="left">
                                            <img src="https://linkedgrow.ai/images/email/photos.png" loading="lazy" border="0" alt="Nicolas & Maria - Founders of LinkedGrow" width="158" height="89" style="display: block; width: 158px; height: 89px;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Signature -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td class="row" style="padding: 0 50px; line-height: 1;" align="left">
                                            <img src="https://linkedgrow.ai/images/email/nicolas-maria.png" loading="lazy" border="0" alt="Nicolas & Maria" width="204" height="49" style="display: block; width: 204px; height: 49px;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- PS -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <p style="font-family: 'Inter', sans-serif; color: #64748B; font-size: 14px; line-height: 150%; margin-top: 0; margin-bottom: 0;"><em>P.S. This is a one-time offer. After 48 hours, the code won't work anymore.</em></p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Divider 2 -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;" align="center">
                                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%">
                                                <tr>
                                                    <td style="border-top: 1px solid #EAECED;"></td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Footer -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="40" style="line-height: 40px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <table align="center" width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td align="center">
                                                        <img src="https://linkedgrow.ai/images/email/logo.png" border="0" alt="LinkedGrow" width="180" style="max-width: 180px; display: inline-block;">
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td height="20" style="line-height: 20px;"></td>
                                                </tr>
                                                <tr>
                                                    <td align="center" style="text-align: center !important;">
                                                        <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 14px; line-height: 150%; margin-bottom: 0;">LinkedGrow - AI-Powered LinkedIn Content Platform<br>78 Avenue des Champs-Elysees, Paris, France</p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td height="16" style="line-height: 16px;"></td>
                                                </tr>
                                                <tr>
                                                    <td align="center">
                                                        <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 14px; line-height: 150%; margin-bottom: 0;">
                                                            <a href="https://linkedgrow.ai/privacy" style="color: #45556C; text-decoration: underline;">Privacy Policy</a>
                                                            <span style="color: #45556C;"> | </span>
                                                            <a href="https://linkedgrow.ai/cookies" style="color: #45556C; text-decoration: underline;">Cookie Policy</a>
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="40" style="line-height: 40px;"></td>
                                    </tr>
                                </table>

                            </td>
                        </tr>
                    </table>

                    <!-- Bottom spacing -->
                    <table cellpadding="0" cellspacing="0" border="0" align="center" width="640" style="max-width: 640px; width: 100%;">
                        <tr>
                            <td height="40" style="line-height: 40px;"></td>
                        </tr>
                    </table>

                </td>
            </tr>
        </table>
    </div>
</body>
</html>`;
}

// Plain text versions
export function abandonedCartEmail1Text({
  name,
  planId,
  recoveryUrl,
}: AbandonedCartEmailParams): string {
  const greeting = name ? `Hey ${name}!` : "Hey there!";
  const plan = PLANS[planId];
  const features = getPlanFeatures(planId);

  return `${greeting}

You started upgrading to LinkedGrow ${plan.name} but didn't finish - no worries, we saved everything for you.

Here's what you'll unlock:
${features.map(f => `- ${f}`).join("\n")}

Your checkout is still ready - just click below to pick up where you left off:
${recoveryUrl}

Remember: You're using your own AI keys - so you get unlimited generations for just $2-4/month in API costs. No surprise bills, ever.

Questions? Just reply to this email - we read every message.

Cheers,
Nicolas & Maria
Founders of LinkedGrow

---

LinkedGrow - AI-Powered LinkedIn Content Platform
78 Avenue des Champs-Elysees, Paris, France

Privacy Policy: https://linkedgrow.ai/privacy
Cookie Policy: https://linkedgrow.ai/cookies
`;
}

export function abandonedCartEmail2Text({
  name,
  planId,
  recoveryUrl,
}: AbandonedCartEmailParams): string {
  const greeting = name ? `Hey ${name}!` : "Hey there!";
  const plan = PLANS[planId];

  return `${greeting}

I noticed you haven't completed your upgrade yet, and I wanted to check in.

Is something holding you back? Common questions I get:

"Will it actually save me time?"
Our users typically go from 2 hours to 15 minutes per post. The AI learns your voice and writes like you.

"What if I don't use it enough?"
With your own API keys, you only pay for what you use. No monthly caps, no wasted subscription.

"Is it hard to set up?"
Connect your AI key in 30 seconds. We support OpenAI, Claude, Google, Grok, and more.

Your upgrade is still waiting:
${recoveryUrl}

If you have other questions, just hit reply - I personally respond to every email.

Best,
Nicolas & Maria
Founders of LinkedGrow

P.S. Here's what ${plan.name} includes: ${plan.description}

---

LinkedGrow - AI-Powered LinkedIn Content Platform
78 Avenue des Champs-Elysees, Paris, France

Privacy Policy: https://linkedgrow.ai/privacy
Cookie Policy: https://linkedgrow.ai/cookies
`;
}

export function abandonedCartEmail3Text({
  name,
  planId,
  recoveryUrl,
  discountCode,
  discountPercent,
  discountMonths,
}: AbandonedCartEmail3Params): string {
  const greeting = name ? `Hey ${name}!` : "Hey there!";
  const plan = PLANS[planId];
  const discountedPrice = Math.round(plan.price * (1 - discountPercent / 100));
  const features = getPlanFeatures(planId);

  return `${greeting}

This is my last email about your upgrade - I promise!

As a thank you for considering LinkedGrow, I'd like to offer you ${discountPercent}% off your first ${discountMonths} months.

Use code: ${discountCode}

That's ${plan.name} for just $${discountedPrice}/month instead of $${plan.price}/month.

Here's what you'll get:
${features.map(f => `- ${f}`).join("\n")}

This code expires in 48 hours.

Claim your discount: ${recoveryUrl}

If LinkedGrow isn't right for you, no hard feelings - I appreciate you checking us out.

Wishing you LinkedIn success either way,
Nicolas & Maria
Founders of LinkedGrow

P.S. This is a one-time offer. After 48 hours, the code won't work anymore.

---

LinkedGrow - AI-Powered LinkedIn Content Platform
78 Avenue des Champs-Elysees, Paris, France

Privacy Policy: https://linkedgrow.ai/privacy
Cookie Policy: https://linkedgrow.ai/cookies
`;
}
