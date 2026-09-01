import "dotenv/config";
import { db } from "../db.ts";
import { log } from "../logger.ts";
import { addressForOrder, checkExit, credentialsForOrder, encryptFor } from "./fulfil.ts";

/**
 * Bringing an address that was paid for into the database by hand.
 *
 * A purchase can succeed and still not land: the supplier provisions the
 * address a moment after taking the money, and anything that fails in between
 * leaves an order nobody is using. That happened twice on 2026-07-30, five
 * minutes apart, because the address lookup ran too soon and the loop retried.
 * The loop no longer can, and this is how the orders it already made are
 * recovered rather than written off.
 *
 * Two shapes:
 *
 *   adopt <orderId> <allocationId>   attach it to the row waiting for an address
 *   adopt <orderId>                  put it in the buffer, for whoever needs it next
 *
 * Idempotent by order id: running it twice on the same order updates the same
 * row rather than making a second one.
 */

async function main(): Promise<void> {
  const orderId = process.argv[2];
  const allocationId = process.argv[3];
  if (!orderId) {
    console.error("usage: adopt <orderId> [allocationId]");
    process.exit(2);
  }

  const mine = await addressForOrder(orderId);
  if (!mine?.ip) {
    console.error(`Order ${orderId} has no address listed. Nothing was changed.`);
    process.exit(1);
  }

  const host = String(mine.ip);
  const port = Number(mine.port_http ?? mine.port_socks ?? 0);
  const auth = await credentialsForOrder(orderId);
  const user = auth?.login ?? String(mine.login ?? "");
  const pass = auth?.password ?? String(mine.password ?? "");

  // The same check a bought address gets. An address that cannot answer is
  // worse than no address, because the account would try to use it.
  const exit = await checkExit(host, port, user, pass);
  if (exit.error || !exit.ip) {
    console.error(`${host} did not answer: ${exit.error ?? "no exit"}. Nothing was changed.`);
    process.exit(1);
  }
  // Said rather than refused, because this command exists to rescue an order
  // that has already been paid for and refusing it would strand the money.
  // See registryCountry: geolocation and registration disagreeing is what had
  // one address reported as Paris and Vilnius on the same night.
  if (exit.registryCountry && exit.country && exit.registryCountry !== exit.country.toUpperCase()) {
    console.error(
      `WARNING: ${host} geolocates to ${exit.country} but is registered in ${exit.registryCountry}. Platforms follow the registration. Adopting anyway.`
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const end = mine.date_end ? parseEnd(String(mine.date_end)) : null;
  const fields = {
    host,
    port,
    username: await encryptFor(user),
    password: await encryptFor(pass),
    expiresAt: end ?? now + 30 * 86_400,
    exitIp: exit.ip,
    asn: exit.asn,
    asnOrg: exit.asnOrg,
    hosted: exit.looksHosted ? 1 : 0,
  };

  // Already adopted? Update in place rather than adding a second row for the
  // same purchase, which is the mistake this whole command exists to undo.
  const existing = await db().execute({
    sql: `SELECT id FROM proxy_allocations WHERE provider_ref = ? LIMIT 1`,
    args: [String(orderId)],
  });
  const target = allocationId ?? (existing.rows[0]?.id ? String(existing.rows[0].id) : null);

  if (target) {
    await db().execute({
      sql: `UPDATE proxy_allocations
               SET host = ?, port = ?, username_encrypted = ?, password_encrypted = ?,
                   provider_ref = ?, status = 'active', source = 'managed', expires_at = ?,
                   last_checked_at = ?, last_exit_ip = ?, last_asn = ?, last_asn_org = ?,
                   exit_looks_hosted = ?, updated_at = ?
             WHERE id = ?`,
      args: [
        fields.host, fields.port, fields.username, fields.password, String(orderId),
        fields.expiresAt, now, fields.exitIp, fields.asn, fields.asnOrg, fields.hosted,
        now, target,
      ],
    });
    log("address adopted onto an existing allocation", { allocation: target, exit: exit.ip });
    console.log(`${host} is now the address for allocation ${target} (exits at ${exit.ip}).`);
    return;
  }

  // No row waiting: it goes in the buffer, account-less, and the next account
  // in this country takes it instead of buying.
  //
  // It still needs a workspace, because the column is a foreign key onto the
  // owner and an empty string is not a user. The one that paid for it holds it
  // until somebody claims it, and claiming re-points the row, so the buffer is
  // still fleet-wide in behaviour.
  const holder = await db().execute(
    `SELECT workspace_id FROM proxy_allocations ORDER BY created_at DESC LIMIT 1`
  );
  const workspaceId = holder.rows[0]?.workspace_id
    ? String(holder.rows[0].workspace_id)
    : "";
  if (!workspaceId) {
    console.error(
      "No workspace to hold this address. Connect an account first, or pass one explicitly."
    );
    process.exit(1);
  }

  const id = crypto.randomUUID();
  await db().execute({
    sql: `INSERT INTO proxy_allocations
            (id, workspace_id, country, provider, host, port, username_encrypted,
             password_encrypted, provider_ref, status, source, linkedin_account_id,
             expires_at, auto_renew, last_checked_at, last_exit_ip, last_asn, last_asn_org,
             exit_looks_hosted, created_at, updated_at)
          VALUES (?, ?, ?, 'proxy-seller', ?, ?, ?, ?, ?, 'active', 'managed', NULL,
                  ?, 1, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id, workspaceId, exit.country ?? "", fields.host, fields.port, fields.username, fields.password,
      String(orderId), fields.expiresAt, now, fields.exitIp, fields.asn, fields.asnOrg,
      fields.hosted, now, now,
    ],
  });
  log("address adopted into the buffer", { allocation: id, exit: exit.ip });
  console.log(`${host} is in the buffer (exits at ${exit.ip}); the next ${exit.country} account takes it.`);
}

/** The supplier writes dates as dd.mm.yyyy, which Date does not read. */
function parseEnd(value: string): number | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());
  if (!m) {
    const loose = new Date(value.replace(" ", "T"));
    return Number.isNaN(loose.getTime()) ? null : Math.floor(loose.getTime() / 1000);
  }
  return Math.floor(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])) / 1000);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
