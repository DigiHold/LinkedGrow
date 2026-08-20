import { db } from "../db.ts";
import { log } from "../logger.ts";
import { call } from "../proxy/fulfil.ts";
import { optionalEnv } from "../config.ts";

/**
 * The daily renewal of the dedicated addresses, and the only thing in the
 * whole system that ever renews one.
 *
 * The supplier auto-renews nothing: every API order is born with
 * auto_renew: N (verified live on 2026-08-20, all 8 orders), and this pass
 * asserts that stays true. So the rule has exactly one bit: an address bound
 * to a LinkedIn account whose workspace still pays is renewed at ten days
 * before its term ends; everything else is renewed by nobody and lapses on
 * its own. Both failure directions land on the cheap side: renewing a churned
 * customer once too often costs $3, and a paying customer's address takes ten
 * consecutive daily failures to be at risk, with alerts from day three.
 *
 * "Still pays" mirrors the connect gate (mayConnect in the dashboard):
 * a live Stripe subscription, a lifetime deal, or an admin house account.
 * Churn is not an event this pass listens to, it is a state it re-reads every
 * morning, so cancellations, refunds and failed trials all collapse into the
 * same test with no webhook to forget.
 *
 * Facts this code is built on, each verified against the live API:
 * - Renewing early adds the new term AFTER the current end (29.08 + 1m came
 *   back 28.09 on the real renewal of 2026-08-20). "1m" is 30 days.
 * - The proxy `id` CHANGES on renewal (37479404 became 38598894); only
 *   order_id and ip are stable. Everything here matches by order_id.
 * - An expired order cannot be renewed. There is no grace period worth
 *   planning for: expired means a support lottery, so expiry is the one
 *   outcome this pass exists to prevent.
 *
 * Run daily by cron on the VPS (/etc/cron.d/linkedgrow-proxy-renew), because
 * the supplier API is IP-allowlisted to this box alone.
 */

const RENEW_WITHIN_DAYS = 10;
const ALERT_WITHIN_DAYS = 7;
const PERIOD = "1m"; // 30 days for ~$3, discounts for longer are not worth churn risk
const DAY_MS = 86_400_000;

interface SupplierRow {
  id: string;
  order_id: string;
  ip: string;
  country: string;
  date_end?: string;
  auto_renew?: string;
  status_type?: string;
}

/** Their dates are DD.MM.YYYY. */
function parseEnd(value: string | undefined): Date | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value ?? "");
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 23, 59, 59);
}

async function heartbeat(summary: unknown): Promise<void> {
  await db().execute({
    sql: `INSERT INTO worker_flags (key, value, updated_at) VALUES ('proxy-renew-last-run', ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [JSON.stringify(summary), Math.floor(Date.now() / 1000)],
  });
}

async function alertEmail(subject: string, lines: string[]): Promise<void> {
  const brevo = optionalEnv("BREVO_API_KEY");
  if (!brevo) return;
  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": brevo, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "LinkedGrow worker", email: "contact@linkedgrow.ai" },
      to: [{ email: "contact@linkedgrow.ai" }],
      subject,
      htmlContent: `<p>${lines.join("</p><p>")}</p>`,
    }),
  }).catch((error) => log("the alert email did not go out", { error: String(error) }));
}

async function main(): Promise<void> {
  const alerts: string[] = [];

  // The supplier's list is the truth about what exists and when it ends.
  const listed = await call<{ items?: SupplierRow[] }>("GET", "proxy/list/isp");
  const supplier = listed?.items ?? [];
  const byOrder = new Map(supplier.map((s) => [String(s.order_id), s]));

  // Nothing may auto-renew on their side, ever. A flipped switch there would
  // spend money outside this pass's rule, so it is worth a loud alert.
  for (const s of supplier) {
    if ((s.auto_renew ?? "N") !== "N") {
      alerts.push(`Order ${s.order_id} (${s.ip}) has supplier auto-renewal ON. Turn it off in the Proxy-Seller dashboard: this pass is the only renewer.`);
    }
  }

  // Every managed allocation, with whether its workspace still pays.
  const { rows } = await db().execute({
    sql: `SELECT pa.id, pa.provider_ref, pa.last_exit_ip, pa.country, pa.status,
                 pa.linkedin_account_id,
                 u.stripe_subscription_id, u.is_lifetime_deal, u.is_admin
            FROM proxy_allocations pa
            LEFT JOIN linkedin_accounts la ON la.id = pa.linkedin_account_id
            LEFT JOIN users u ON u.id = COALESCE(la.workspace_id, pa.workspace_id)
           WHERE pa.source = 'managed'`,
    args: [],
  });

  const now = Date.now();
  let renewed = 0;
  let dueLater = 0;
  let lapsing = 0;

  for (const row of rows) {
    const ref = String(row.provider_ref ?? "");
    const item = ref ? byOrder.get(ref) : undefined;
    const bound = row.linkedin_account_id != null;
    const paying =
      Number(row.is_admin ?? 0) === 1 ||
      Number(row.is_lifetime_deal ?? 0) === 1 ||
      (row.stripe_subscription_id != null && String(row.stripe_subscription_id) !== "");
    const deserves = bound && paying && String(row.status) === "active";

    if (!item) {
      if (deserves) {
        // A paying customer's address is not at the supplier any more. That is
        // the disaster case, and no automation fixes it: say it immediately.
        alerts.push(`Allocation ${row.id} (${row.country}, exit ${row.last_exit_ip}) is bound to a paying customer but order ${ref} is GONE at Proxy-Seller.`);
      } else if (String(row.status) === "active" || String(row.status) === "released") {
        // Lapsed as designed. Close the row so the pool can never hand it out.
        await db().execute({
          sql: `UPDATE proxy_allocations SET status = 'released', linkedin_account_id = NULL, updated_at = ? WHERE id = ? AND status != 'released'`,
          args: [Math.floor(now / 1000), String(row.id)],
        });
      }
      continue;
    }

    const end = parseEnd(item.date_end);
    if (!end) {
      alerts.push(`Order ${ref}: unreadable end date "${item.date_end}".`);
      continue;
    }
    const daysLeft = Math.floor((end.getTime() - now) / DAY_MS);

    // Keep our copy of the term honest, whatever else happens today.
    await db().execute({
      sql: `UPDATE proxy_allocations SET expires_at = ? , updated_at = ? WHERE id = ?`,
      args: [Math.floor(end.getTime() / 1000), Math.floor(now / 1000), String(row.id)],
    });

    if (!deserves) {
      // Bound to nobody, or to a workspace that stopped paying. Nobody renews
      // it, so it lapses at its own term. That is the design, not a failure.
      lapsing++;
      continue;
    }

    if (daysLeft > RENEW_WITHIN_DAYS) {
      dueLater++;
      continue;
    }

    // Renewal window. Dry run first, because the one unforgivable outcome is
    // money leaving with no term arriving.
    const check = await call<{ warning?: string; total?: number; balance?: number }>(
      "POST",
      "prolong/calc/isp",
      { ids: [Number(item.id)], periodId: PERIOD, coupon: "" }
    );
    if (check?.warning) {
      alerts.push(`Order ${ref} (${item.ip}): renewal refused, "${check.warning}", ${daysLeft} days left. Balance $${check?.balance ?? "?"}.`);
      continue;
    }

    await call("POST", "prolong/make/isp", { ids: [Number(item.id)], periodId: PERIOD, coupon: "" });

    // Read back and verify the two things the customer actually depends on:
    // the same IP, and a later end.
    const after = await call<{ items?: SupplierRow[] }>("GET", "proxy/list/isp");
    const fresh = (after?.items ?? []).find((s) => String(s.order_id) === ref);
    const freshEnd = parseEnd(fresh?.date_end);
    if (!fresh || fresh.ip !== item.ip) {
      alerts.push(`Order ${ref}: renewed but the IP READ BACK DIFFERENT (${item.ip} -> ${fresh?.ip ?? "missing"}). The account must not run until this is understood.`);
      continue;
    }
    if (!freshEnd || freshEnd.getTime() <= end.getTime()) {
      alerts.push(`Order ${ref}: renewal paid but the end date did not move (${item.date_end} -> ${fresh?.date_end}).`);
      continue;
    }

    await db().execute({
      sql: `UPDATE proxy_allocations SET expires_at = ?, updated_at = ? WHERE id = ?`,
      args: [Math.floor(freshEnd.getTime() / 1000), Math.floor(now / 1000), String(row.id)],
    });
    renewed++;
    log("renewed", { order: ref, ip: item.ip, until: fresh.date_end, days_early: daysLeft });
  }

  // A bound, paying address inside the alert window that is somehow still not
  // renewed after the loop above is a daily page until somebody looks.
  const { rows: closeRows } = await db().execute({
    sql: `SELECT pa.provider_ref, pa.country, pa.last_exit_ip, pa.expires_at
            FROM proxy_allocations pa
            JOIN linkedin_accounts la ON la.id = pa.linkedin_account_id
            JOIN users u ON u.id = la.workspace_id
           WHERE pa.source = 'managed' AND pa.status = 'active'
             AND pa.linkedin_account_id IS NOT NULL
             AND (u.is_admin = 1 OR u.is_lifetime_deal = 1 OR (u.stripe_subscription_id IS NOT NULL AND u.stripe_subscription_id != ''))
             AND pa.expires_at IS NOT NULL AND pa.expires_at < ?`,
    args: [Math.floor(now / 1000) + ALERT_WITHIN_DAYS * 86_400],
  });
  for (const r of closeRows) {
    alerts.push(`STILL NOT RENEWED: ${r.country} address ${r.last_exit_ip} (order ${r.provider_ref}) ends ${new Date(Number(r.expires_at) * 1000).toISOString().slice(0, 10)} and belongs to a paying customer.`);
  }

  // Money forecast: what the next ten days of renewals need, against the balance.
  const balance = await call<{ summ?: number }>("GET", "balance/get");
  const usd = Number(balance?.summ ?? 0);
  const needed = closeRows.length * 3 + 3;
  if (usd < needed) {
    alerts.push(`Supplier balance $${usd} may not cover the coming renewals (~$${needed}). The daily top-up guard should have mailed a payment link; it needs the click.`);
  }

  const summary = { renewed, dueLater, lapsing, alerts: alerts.length, balance: usd, at: new Date().toISOString() };
  await heartbeat(summary);
  log("proxy renewal pass done", summary);

  if (alerts.length) {
    log("ALERTS", { alerts });
    await alertEmail(
      `Proxy renewal: ${alerts.length} thing${alerts.length === 1 ? "" : "s"} need${alerts.length === 1 ? "s" : ""} you`,
      alerts
    );
    process.exitCode = 1;
  }
}

main().then(
  () => process.exit(process.exitCode ?? 0),
  (error) => {
    log("proxy renewal pass failed", { error: String(error) });
    // The pass itself failing must not stay quiet either.
    alertEmail("Proxy renewal pass CRASHED", [String(error)]).finally(() => process.exit(1));
  }
);
