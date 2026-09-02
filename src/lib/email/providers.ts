import nodemailer from "nodemailer";

export interface Mail { to: string; subject: string; html: string; text?: string; replyTo?: string }
export interface From { name: string; address: string }
export type Built = { url: string; headers: Record<string, string>; body: string };

export function buildBrevoRequest(m: Mail & { apiKey: string; from: From }): Built {
  return {
    url: "https://api.brevo.com/v3/smtp/email",
    headers: { "Content-Type": "application/json", Accept: "application/json", "api-key": m.apiKey },
    body: JSON.stringify({
      sender: { name: m.from.name, email: m.from.address },
      to: [{ email: m.to }],
      ...(m.replyTo ? { replyTo: { email: m.replyTo } } : {}),
      subject: m.subject,
      htmlContent: m.html,
      textContent: m.text,
    }),
  };
}

export function buildResendRequest(m: Mail & { apiKey: string; from: From }): Built {
  return {
    url: "https://api.resend.com/emails",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${m.apiKey}` },
    body: JSON.stringify({
      from: `${m.from.name} <${m.from.address}>`,
      to: [m.to],
      subject: m.subject,
      html: m.html,
      ...(m.text ? { text: m.text } : {}),
      ...(m.replyTo ? { reply_to: m.replyTo } : {}),
    }),
  };
}

export async function sendViaHttp(built: Built): Promise<{ messageId: string | null }> {
  const response = await fetch(built.url, { method: "POST", headers: built.headers, body: built.body });
  const data = (await response.json().catch(() => ({}))) as { id?: string; messageId?: string; message?: string; name?: string };
  if (!response.ok) throw new Error(data.message || data.name || `Email provider answered ${response.status}`);
  return { messageId: data.id ?? data.messageId ?? null };
}

export interface SmtpConfig { host: string; port: number; user: string; password: string; tls: boolean }

export async function sendViaSmtp(cfg: SmtpConfig, from: From, m: Mail): Promise<{ messageId: string | null }> {
  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.tls && cfg.port === 465,
    requireTLS: cfg.tls && cfg.port !== 465,
    auth: cfg.user ? { user: cfg.user, pass: cfg.password } : undefined,
  });
  const info = await transport.sendMail({ from: `"${from.name}" <${from.address}>`, to: m.to, subject: m.subject, html: m.html, text: m.text, replyTo: m.replyTo });
  return { messageId: info.messageId ?? null };
}
