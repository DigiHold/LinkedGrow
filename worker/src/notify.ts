import { log, logError } from "./logger.ts";
import { instance } from "./instance.ts";
import { EDITION } from "./edition.ts";
import { optionalEnv } from "./config.ts";
import { appBaseUrl } from "./cron/pass.ts";

/**
 * An operations email from the worker.
 *
 * The cloud sends it itself through Brevo, to us. A self hosted install has
 * no mail provider in the worker's environment: the app holds the provider in
 * its instance settings, so the worker asks the app to send it, over the same
 * cron secret the scheduled routes accept. Either way a failure is logged and
 * never thrown: an alert that cannot go out must not take the pass down with it.
 */
export async function notifyOps(subject: string, lines: string[]): Promise<void> {
  try {
    if (EDITION === "cloud") {
      const brevo = optionalEnv("BREVO_API_KEY");
      if (!brevo) return;
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": brevo, "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: { name: "LinkedGrow worker", email: "contact@linkedgrow.ai" },
          to: [{ email: "contact@linkedgrow.ai" }],
          subject,
          htmlContent: `<p>${lines.join("</p><p>")}</p>`,
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`Brevo answered ${res.status}`);
      return;
    }

    const i = await instance();
    if (!i.cronSecret) {
      log("the alert email did not go out: no cron secret in instance settings yet", { subject });
      return;
    }
    const res = await fetch(`${await appBaseUrl()}/api/internal/notify`, {
      method: "POST",
      headers: { "x-linkedgrow-cron": i.cronSecret, "content-type": "application/json" },
      body: JSON.stringify({ subject, lines }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`the app answered ${res.status}`);
  } catch (error) {
    logError("the alert email did not go out", error, { subject });
  }
}
