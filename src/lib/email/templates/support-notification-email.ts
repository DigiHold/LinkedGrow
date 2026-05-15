// Compact email template for the support-ticket lifecycle. One shared shell,
// six call-sites driven by parameters. Mirrors the existing transactional
// styling (Inter font, slate palette, R2-hosted logo) so admin + customer
// inboxes see consistent LinkedGrow branding.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://linkedgrow.ai";
const LOGO_URL = "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/email/logo.png";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface ShellParams {
  preheader: string;
  heading: string;
  intro: string;
  detailsHtml?: string;
  bodyQuoteHtml?: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
  title: string;
}

function shell(params: ShellParams): string {
  const { preheader, heading, intro, detailsHtml, bodyQuoteHtml, ctaText, ctaUrl, footerNote, title } = params;
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
body{margin:0;padding:0;background:#F4F7FA;font-family:'Inter',sans-serif;}
.btn{display:inline-block;background:linear-gradient(90deg,#06b6d4,#2563eb);color:#fff!important;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:8px;font-size:15px;}
@media(max-width:639px){.container{width:100%!important;}.row{padding:0 20px!important;}}
</style></head>
<body style="margin:0;padding:0;background:#F4F7FA;">
<div style="display:none;font-size:0;line-height:0;color:#F4F7FA;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:20px 8px;">
  <table class="container" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background:#fff;border:1px solid #EAECED;border-radius:8px;">
    <tr><td class="row" align="center" style="padding:40px 50px 24px;">
      <img src="${LOGO_URL}" alt="LinkedGrow" width="200" style="max-width:200px;display:block;">
    </td></tr>
    <tr><td class="row" style="padding:8px 50px 0;">
      <h1 style="margin:0 0 16px;color:#0F172B;font-size:28px;line-height:130%;font-weight:700;">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 20px;color:#45556C;font-size:16px;line-height:160%;">${intro}</p>
      ${detailsHtml || ""}
      ${bodyQuoteHtml ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;"><tr><td style="background:#F8FAFC;border:1px solid #EAECED;border-radius:8px;padding:16px;color:#45556C;font-size:15px;line-height:160%;white-space:pre-wrap;">${bodyQuoteHtml}</td></tr></table>` : ""}
      ${ctaText && ctaUrl ? `<div style="margin:8px 0 24px;"><a href="${escapeHtml(ctaUrl)}" class="btn">${escapeHtml(ctaText)}</a></div>` : ""}
      ${footerNote ? `<p style="margin:24px 0 0;color:#64748B;font-size:13px;line-height:160%;">${footerNote}</p>` : ""}
    </td></tr>
    <tr><td class="row" align="center" style="padding:32px 50px 40px;border-top:1px solid #EAECED;margin-top:24px;">
      <p style="margin:16px 0 0;color:#64748B;font-size:13px;line-height:150%;">LinkedGrow - AI-Powered LinkedIn Content Platform<br>78 Avenue des Champs-Elysees, Paris, France</p>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

// Common detail row used in multiple templates
function detailRow(label: string, value: string): string {
  return `<p style="margin:0 0 8px;color:#45556C;font-size:15px;line-height:160%;"><strong style="color:#0F172B;">${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}

// ============================================================================
// 1. ADMIN: new ticket created by user
// ============================================================================
export function newTicketAdminEmail(p: {
  ticketId: string;
  subject: string;
  category: string;
  source: "dashboard" | "chatbot";
  userName: string;
  userEmail: string;
  userPlan: string;
  body: string;
}): { html: string; text: string; subject: string } {
  const adminUrl = `${APP_URL}/dashboard/admin/support/${p.ticketId}`;
  const html = shell({
    title: `New ticket: ${p.subject}`,
    preheader: `${p.userName}: ${p.body.substring(0, 80)}`,
    heading: "New support ticket",
    intro: `<strong>${escapeHtml(p.userName)}</strong> just opened a ticket via the ${p.source === "chatbot" ? "chatbot" : "dashboard"}.`,
    detailsHtml:
      detailRow("Subject", p.subject) +
      detailRow("Category", p.category) +
      detailRow("From", `${p.userName} <${p.userEmail}>`) +
      detailRow("Plan", p.userPlan),
    bodyQuoteHtml: escapeHtml(p.body),
    ctaText: "Reply to ticket",
    ctaUrl: adminUrl,
  });
  return {
    html,
    text: `New support ticket from ${p.userName} (${p.userEmail}) - ${p.userPlan} plan\n\nSubject: ${p.subject}\nCategory: ${p.category}\nSource: ${p.source}\n\n${p.body}\n\nReply: ${adminUrl}`,
    subject: `[Support] ${p.subject}`,
  };
}

// ============================================================================
// 2. ADMIN: user replied to existing ticket
// ============================================================================
export function userReplyAdminEmail(p: {
  ticketId: string;
  subject: string;
  userName: string;
  userEmail: string;
  body: string;
}): { html: string; text: string; subject: string } {
  const adminUrl = `${APP_URL}/dashboard/admin/support/${p.ticketId}`;
  const html = shell({
    title: `Reply on: ${p.subject}`,
    preheader: `${p.userName}: ${p.body.substring(0, 80)}`,
    heading: "User replied to a ticket",
    intro: `<strong>${escapeHtml(p.userName)}</strong> sent a new message on their ticket.`,
    detailsHtml: detailRow("Subject", p.subject) + detailRow("From", `${p.userName} <${p.userEmail}>`),
    bodyQuoteHtml: escapeHtml(p.body),
    ctaText: "View & reply",
    ctaUrl: adminUrl,
  });
  return {
    html,
    text: `${p.userName} (${p.userEmail}) replied:\n\n${p.body}\n\nView: ${adminUrl}`,
    subject: `[Support] Re: ${p.subject}`,
  };
}

// ============================================================================
// 3. ADMIN: user marked the ticket as resolved
// ============================================================================
export function userResolvedAdminEmail(p: {
  ticketId: string;
  subject: string;
  userName: string;
  userEmail: string;
}): { html: string; text: string; subject: string } {
  const adminUrl = `${APP_URL}/dashboard/admin/support/${p.ticketId}`;
  const html = shell({
    title: `Resolved: ${p.subject}`,
    preheader: `${p.userName} marked their ticket as resolved.`,
    heading: "Ticket marked as resolved",
    intro: `<strong>${escapeHtml(p.userName)}</strong> marked their ticket as resolved. If they're happy, you can send them a review request from the ticket page.`,
    detailsHtml: detailRow("Subject", p.subject) + detailRow("From", `${p.userName} <${p.userEmail}>`),
    ctaText: "Open ticket",
    ctaUrl: adminUrl,
  });
  return {
    html,
    text: `${p.userName} (${p.userEmail}) marked their ticket as resolved.\n\nOpen: ${adminUrl}`,
    subject: `[Support] Resolved: ${p.subject}`,
  };
}

// ============================================================================
// 4. USER: admin replied to your ticket
// ============================================================================
export function adminReplyUserEmail(p: {
  ticketId: string;
  subject: string;
  body: string;
}): { html: string; text: string; subject: string } {
  const userUrl = `${APP_URL}/dashboard/support/${p.ticketId}`;
  const html = shell({
    title: `New reply: ${p.subject}`,
    preheader: p.body.substring(0, 80),
    heading: "We replied to your support ticket",
    intro: `Your support ticket got a new reply.`,
    detailsHtml: detailRow("Subject", p.subject),
    bodyQuoteHtml: escapeHtml(p.body),
    ctaText: "View reply",
    ctaUrl: userUrl,
    footerNote: "Reply directly on the ticket page to keep the conversation in one place.",
  });
  return {
    html,
    text: `New reply on your ticket "${p.subject}":\n\n${p.body}\n\nView: ${userUrl}`,
    subject: `Re: ${p.subject}`,
  };
}

// ============================================================================
// 5. USER: ticket auto-closed after inactivity
// ============================================================================
export function autoCloseUserEmail(p: {
  ticketId: string;
  subject: string;
}): { html: string; text: string; subject: string } {
  const userUrl = `${APP_URL}/dashboard/support/${p.ticketId}`;
  const html = shell({
    title: `Closed: ${p.subject}`,
    preheader: "We're closing this ticket since we haven't heard back.",
    heading: "Closing your support ticket",
    intro: `Since we haven't heard back from you in 14 days, we're closing this ticket. You can reopen it anytime by replying.`,
    detailsHtml: detailRow("Subject", p.subject),
    ctaText: "Reopen ticket",
    ctaUrl: userUrl,
  });
  return {
    html,
    text: `Since we haven't heard back, we're closing your ticket "${p.subject}". Reopen anytime: ${userUrl}`,
    subject: `Closed: ${p.subject}`,
  };
}

// ============================================================================
// 6. USER: ticket resolved + review request (admin-triggered, happy customers)
// ============================================================================
// Uses card-style buttons with the actual brand logos (Google, Trustpilot,
// G2) inlined as SVG. Most modern email clients render inline SVG correctly
// (Gmail, Apple Mail, iOS, Yahoo). Outlook desktop falls back to alt text -
// the link still works either way.
export function reviewRequestUserEmail(p: {
  subject: string;
  userName: string;
}): { html: string; text: string; subject: string } {
  const googleLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`;
  const trustpilotLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="32" height="32"><path d="M240,91.7177h-91.6463L120.0457,0l-28.3994,91.7237-91.6463-.0962,74.2226,56.745-28.3994,91.6275,74.2226-56.6488,74.1311,56.6488-28.3079-91.6275,74.1311-56.6548Z" fill="#00b67a"/><path d="M172.237,169.1169l-6.3681-20.7444-45.8232,34.9787,52.1913-14.2343Z" fill="#005128"/></svg>`;
  const g2Logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 512" width="32" height="32"><path d="M350.3667,364.7733c18.8338,32.6825,37.4575,64.994,56.0672,97.2704-82.4065,63.0896-210.616,70.7141-305.527-1.9394C-8.3149,376.4306-26.2665,233.6582,32.2092,130.8846,99.4646,12.6731,225.3217-13.4702,306.3559,5.6997c-2.1914,4.761-50.7251,105.448-50.7251,105.448,0,0-3.8368.2521-6.0072.2941-23.9518,1.0152-41.7913,6.5883-60.9122,16.4743-42.5955,22.2267-71.4016,64.1245-76.9033,111.8543-2.8272,23.8393.4692,48.0058,9.5779,70.217,7.7015,18.7778,18.5957,35.4551,33.2006,49.5349,22.4045,21.6203,49.0658,35.007,79.97,39.4389,29.2658,4.2008,57.4115.042,83.7857-13.2116,9.893-4.964,18.3086-10.4461,28.1456-17.9656,1.2533-.8121,2.3665-1.8414,3.8788-3.0106h0Z" fill="#ff492c"/><path d="M350.5487,78.1431c-4.7819-4.7049-9.2138-9.0458-13.6247-13.4147-2.6325-2.6045-5.167-5.3141-7.8626-7.8556-.9662-.9172-2.1004-2.1704-2.1004-2.1704,0,0,.9172-1.9464,1.3093-2.7445,5.16-10.3551,13.2467-17.9236,22.8386-23.9448,10.6068-6.7088,22.9646-10.1223,35.5111-9.809,16.0542.3151,30.9812,4.3129,43.5767,15.081,9.2979,7.9466,14.0658,18.0286,14.906,30.064,1.4003,20.3041-7.0014,35.8542-23.6857,46.7063-9.802,6.3853-20.374,11.3213-30.9742,17.1674-5.8461,3.2276-10.8452,6.0632-16.5583,11.9024-5.027,5.8602-5.2721,11.3843-5.2721,11.3843l75.9441-.098v33.8238h-117.2244v-3.2697c-.4481-16.6213,1.4913-32.2624,9.1018-47.3575,7.0014-13.8488,17.8816-23.9868,30.9532-31.7933,10.068-6.0142,20.6681-11.1322,30.7571-17.1184,6.2243-3.6897,10.6211-9.1018,10.5861-16.9504,0-6.7353-4.901-12.7215-11.9024-14.5909-16.5093-4.4529-33.3127,2.6535-42.0504,17.7625-1.2743,2.2054-2.5765,4.3969-4.2288,7.2254h0ZM497.445,328.8212l-63.9998-110.524h-126.6483l-64.4129,111.6653h127.5794l62.9566,109.9989,64.5249-111.1402Z" fill="#ff492c"/></svg>`;

  const reviewCard = (href: string, logo: string, label: string) => `
    <tr>
      <td align="center" style="padding:6px 0;">
        <a href="${href}" style="display:block;padding:16px 20px;background:#fff;border:1px solid #EAECED;border-radius:12px;text-decoration:none;color:#45556C;">
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
            <tr>
              <td style="padding-right:14px;vertical-align:middle;">${logo}</td>
              <td style="vertical-align:middle;font-family:'Inter',sans-serif;font-weight:600;font-size:15px;color:#0F172B;">${label}</td>
            </tr>
          </table>
        </a>
      </td>
    </tr>`;

  const reviewLinks = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
      ${reviewCard("https://g.page/r/CchpLmmQPKcZEAI/review?utm_source=linkedgrow&utm_medium=support_email", googleLogo, "Review us on Google")}
      ${reviewCard("https://www.trustpilot.com/review/linkedgrow.ai?utm_source=linkedgrow&utm_medium=support_email", trustpilotLogo, "Review us on Trustpilot")}
      ${reviewCard("https://www.g2.com/products/linkedgrow/reviews?utm_source=linkedgrow&utm_medium=support_email", g2Logo, "Review us on G2")}
    </table>`;
  const html = shell({
    title: `Glad we could help! 🎉`,
    preheader: "Could you take 30 seconds to leave us a review?",
    heading: `Glad we could help, ${p.userName}!`,
    intro: `Your ticket on "<strong>${escapeHtml(p.subject)}</strong>" is now closed. If LinkedGrow has been useful for you, a quick review would mean the world to a small team like ours - it takes 30 seconds and helps other founders discover us.`,
    detailsHtml: reviewLinks,
    footerNote: "Pick whichever platform you already use. No pressure if you don't have time.",
  });
  return {
    html,
    text: `Glad we could help, ${p.userName}! Your ticket "${p.subject}" is closed.\n\nIf LinkedGrow has been useful, a quick review would help us a lot:\n\n- Google: https://g.page/r/CchpLmmQPKcZEAI/review\n- Trustpilot: https://www.trustpilot.com/review/linkedgrow.ai\n- G2: https://www.g2.com/products/linkedgrow/reviews\n\nThanks!`,
    subject: `Glad we could help! 🎉`,
  };
}

// ============================================================================
// 8. USER: thank-you closing message (admin-triggered, no review ask)
// ============================================================================
// For tickets resolved by the user OR by the admin where we don't want to
// push for a review (e.g. customer was civil but not over-the-moon happy).
export function thankYouCloseUserEmail(p: {
  ticketId: string;
  subject: string;
  userName: string;
}): { html: string; text: string; subject: string } {
  const userUrl = `${APP_URL}/dashboard/support/${p.ticketId}`;
  const html = shell({
    title: `Thanks ${p.userName}!`,
    preheader: "We're closing this ticket. Open another one anytime.",
    heading: `Thanks for reaching out, ${p.userName}!`,
    intro: `We're closing your ticket on "<strong>${escapeHtml(p.subject)}</strong>". If you run into anything else - a bug, a question, a feature idea - open another ticket from your dashboard and we'll be right here.`,
    detailsHtml: detailRow("Subject", p.subject),
    ctaText: "Open another ticket",
    ctaUrl: `${APP_URL}/dashboard/support`,
    footerNote: `You can also reply on the original ticket page anytime to reopen it: <a href="${userUrl}" style="color:#0182f2;">View ticket</a>`,
  });
  return {
    html,
    text: `Thanks for reaching out, ${p.userName}! We're closing your ticket "${p.subject}".\n\nIf you need anything else, open another ticket: ${APP_URL}/dashboard/support\nOr reopen this one: ${userUrl}`,
    subject: `Thanks ${p.userName}!`,
  };
}

// ============================================================================
// 7. USER: neutral close (admin closed, no review ask)
// ============================================================================
export function neutralCloseUserEmail(p: {
  ticketId: string;
  subject: string;
  userName: string;
}): { html: string; text: string; subject: string } {
  const userUrl = `${APP_URL}/dashboard/support/${p.ticketId}`;
  const html = shell({
    title: `Closed: ${p.subject}`,
    preheader: "Your ticket has been closed.",
    heading: `Your ticket has been closed`,
    intro: `Hi ${escapeHtml(p.userName)}, we've closed your ticket on "<strong>${escapeHtml(p.subject)}</strong>". If anything else comes up or this issue resurfaces, just reply on the ticket page and we'll reopen it.`,
    detailsHtml: detailRow("Subject", p.subject),
    ctaText: "View ticket",
    ctaUrl: userUrl,
  });
  return {
    html,
    text: `Hi ${p.userName}, we've closed your ticket "${p.subject}". Reopen anytime by replying: ${userUrl}`,
    subject: `Closed: ${p.subject}`,
  };
}
