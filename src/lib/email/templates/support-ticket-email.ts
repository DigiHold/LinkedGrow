import { baseEmailTemplate } from "./base-template";

interface SupportTicketEmailParams {
  name: string;
  email: string;
  message: string;
  conversationSummary?: string;
  isLoggedIn?: boolean;
  userPlan?: string;
}

export function supportTicketEmailTemplate({
  name,
  email,
  message,
  conversationSummary,
  isLoggedIn,
  userPlan,
}: SupportTicketEmailParams): string {
  const content = `
    <h2 style="font-family: 'Inter', sans-serif; color: #0F172B; font-size: 24px; font-weight: 700; margin-bottom: 20px;">New Support Ticket</h2>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
      <tr>
        <td style="padding: 8px 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #64748b; font-weight: 600; width: 100px;">Name</td>
        <td style="padding: 8px 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #0F172B;">${name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #64748b; font-weight: 600;">Email</td>
        <td style="padding: 8px 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #0F172B;"><a href="mailto:${email}" style="color: #06B6D4; text-decoration: none;">${email}</a></td>
      </tr>
      ${isLoggedIn !== undefined ? `<tr>
        <td style="padding: 8px 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #64748b; font-weight: 600;">Status</td>
        <td style="padding: 8px 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #0F172B;">${isLoggedIn ? "Logged-in user" : "Visitor (not logged in)"}${userPlan ? ` - ${userPlan} plan` : ""}</td>
      </tr>` : ""}
    </table>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #64748b; font-weight: 600; margin-bottom: 8px;">Message</p>
      <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #0F172B; line-height: 1.6; white-space: pre-wrap;">${message}</p>
    </div>

    ${conversationSummary ? `
    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px;">
      <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #64748b; font-weight: 600; margin-bottom: 8px;">Chat Context</p>
      <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-wrap;">${conversationSummary}</p>
    </div>` : ""}

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
      <tr>
        <td align="center" bgcolor="#0182f2" style="border-radius: 8px;">
          <a href="mailto:${email}" style="display: block; padding: 14px 28px; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; text-align: center;">Reply to ${name}</a>
        </td>
      </tr>
    </table>
  `;

  return baseEmailTemplate({
    preheader: `Support ticket from ${name}: ${message.substring(0, 80)}...`,
    content,
  });
}

export function supportTicketEmailText({
  name,
  email,
  message,
  conversationSummary,
  isLoggedIn,
  userPlan,
}: SupportTicketEmailParams): string {
  return `New Support Ticket

Name: ${name}
Email: ${email}
${isLoggedIn !== undefined ? `Status: ${isLoggedIn ? "Logged-in user" : "Visitor"}${userPlan ? ` - ${userPlan} plan` : ""}` : ""}

Message:
${message}
${conversationSummary ? `\nChat Context:\n${conversationSummary}` : ""}

Reply to: ${email}
`;
}
