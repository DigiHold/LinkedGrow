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
export function reviewRequestUserEmail(p: {
  subject: string;
  userName: string;
}): { html: string; text: string; subject: string } {
  const reviewLinks = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
      <tr>
        <td align="center" style="padding:8px;">
          <a href="https://g.page/r/CchpLmmQPKcZEAI/review?utm_source=linkedgrow&utm_medium=support_email" style="display:inline-block;padding:14px 24px;background:#fff;border:1px solid #EAECED;border-radius:8px;text-decoration:none;color:#45556C;font-weight:500;font-size:14px;">⭐ Review on Google</a>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:8px;">
          <a href="https://www.trustpilot.com/review/linkedgrow.ai?utm_source=linkedgrow&utm_medium=support_email" style="display:inline-block;padding:14px 24px;background:#fff;border:1px solid #EAECED;border-radius:8px;text-decoration:none;color:#45556C;font-weight:500;font-size:14px;">⭐ Review on Trustpilot</a>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:8px;">
          <a href="https://www.g2.com/products/linkedgrow/reviews?utm_source=linkedgrow&utm_medium=support_email" style="display:inline-block;padding:14px 24px;background:#fff;border:1px solid #EAECED;border-radius:8px;text-decoration:none;color:#45556C;font-weight:500;font-size:14px;">⭐ Review on G2</a>
        </td>
      </tr>
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
