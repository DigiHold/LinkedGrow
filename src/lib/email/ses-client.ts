// Brevo API Client for transactional emails

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@linkedgrow.ai";
const FROM_NAME = "LinkedGrow";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  if (!BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: FROM_NAME,
          email: FROM_EMAIL,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, messageId: data.messageId };
    }

    console.error("Brevo API error:", data);
    throw new Error(data.message || "Failed to send email");
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}
