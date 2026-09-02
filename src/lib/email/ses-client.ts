// Transactional email: one seam, the provider chosen by the edition.
//
// The cloud keeps sending through Brevo from its environment. A self hosted
// instance sends through whatever its settings name: Brevo, Resend, an SMTP
// server, or nothing at all, which is the default and stays silent.
import { isCloud } from "@/lib/edition";
import { getInstanceSettings, instanceSecrets } from "@/lib/instance-settings";
import {
  buildBrevoRequest,
  buildResendRequest,
  sendViaHttp,
  sendViaSmtp,
  type From,
  type SmtpConfig,
} from "./providers";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

type Transport =
  | { kind: "none" }
  | { kind: "brevo" | "resend"; apiKey: string; from: From }
  | { kind: "smtp"; smtp: SmtpConfig; from: From };

/**
 * Addresses no mail server will ever accept.
 *
 * RFC 2606 reserves .test, .example, .invalid and .localhost so they can never
 * resolve, and Brevo tries anyway: 498 soft bounces on 2026-08-06 from one
 * afternoon of billing tests, all of them against the sending domain's own
 * reputation for no possible benefit. Dropping them here costs nothing in
 * production, where no real customer can have one, and keeps the statistics
 * honest.
 */
const UNDELIVERABLE = /@(?:[^@]+\.)?(?:test|example|invalid|localhost)$/i;

function skipped() {
  return { success: true, skipped: true as const, messageId: null };
}

async function resolveTransport(): Promise<Transport> {
  if (isCloud()) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) throw new Error("BREVO_API_KEY is not configured");
    const address = process.env.FROM_EMAIL || "noreply@linkedgrow.ai";
    return { kind: "brevo", apiKey, from: { name: "LinkedGrow", address } };
  }

  const settings = await getInstanceSettings();
  if (settings.emailProvider === "none") return { kind: "none" };

  const from: From = {
    name: settings.emailFromName || settings.instanceName || "LinkedGrow",
    address: settings.emailFromAddress ?? "",
  };
  if (!from.address) throw new Error("The sender address is not configured");

  const secrets = await instanceSecrets();
  if (settings.emailProvider === "smtp") {
    if (!settings.smtpHost) throw new Error("The SMTP host is not configured");
    return {
      kind: "smtp",
      from,
      smtp: {
        host: settings.smtpHost,
        port: settings.smtpPort ?? 587,
        user: settings.smtpUser ?? "",
        password: secrets.smtpPassword ?? "",
        tls: settings.smtpTls,
      },
    };
  }

  if (!secrets.emailKey) throw new Error(`The ${settings.emailProvider} API key is not configured`);
  return { kind: settings.emailProvider, apiKey: secrets.emailKey, from };
}

export async function sendEmail({ to, subject, html, text, replyTo }: SendEmailParams) {
  if (UNDELIVERABLE.test(to.trim())) return skipped();

  const transport = await resolveTransport();
  if (transport.kind === "none") return skipped();

  const mail = { to, subject, html, text, replyTo };
  const { messageId } =
    transport.kind === "smtp"
      ? await sendViaSmtp(transport.smtp, transport.from, mail)
      : await sendViaHttp(
          transport.kind === "resend"
            ? buildResendRequest({ ...mail, apiKey: transport.apiKey, from: transport.from })
            : buildBrevoRequest({ ...mail, apiKey: transport.apiKey, from: transport.from })
        );
  return { success: true, messageId };
}

/** Where operations mail goes: us in the cloud, the instance admin at home. Empty means nobody. */
export async function opsRecipient(): Promise<string> {
  if (isCloud()) return "contact@linkedgrow.ai";
  const settings = await getInstanceSettings();
  return settings.adminEmail || settings.emailFromAddress || "";
}

/** Whether a send could go anywhere at all, for callers that would rather not try. */
export async function isEmailConfigured(): Promise<boolean> {
  if (isCloud()) return !!process.env.BREVO_API_KEY;
  return (await getInstanceSettings()).emailProvider !== "none";
}
