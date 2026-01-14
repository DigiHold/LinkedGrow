// AWS SES SMTP Client for transactional emails
import nodemailer from "nodemailer";

// Create SMTP transporter using your existing SES SMTP credentials
const transporter = nodemailer.createTransport({
  host: process.env.SES_SMTP_HOST || "email-smtp.us-east-1.amazonaws.com",
  port: parseInt(process.env.SES_SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SES_SMTP_USER,
    pass: process.env.SES_SMTP_PASSWORD,
  },
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL || "noreply@linkedgrow.ai";
const FROM_NAME = "LinkedGrow";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  try {
    const info = await transporter.sendMail({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    });

    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

export { transporter };
