import { db } from "../db.ts";
import { decryptSecret } from "../crypto.ts";
import { log } from "../logger.ts";
import type { ProxyAllocation } from "../browser/driver.ts";

/**
 * Where a LinkedIn account's address comes from.
 *
 * The dashboard orders the address the moment the customer picks a country and
 * binds it to their LinkedIn account, so the worker only ever reads. It reads
 * by **LinkedIn account**, never by agent and never by workspace, because the
 * invariant in plan section 5c is one account and one address however many
 * agents drive it, and publishing a post has no agent behind it at all.
 *
 * A missing or inactive row is not an error to route around. In production the
 * work is refused, because an account acting from the server's own address is
 * an account seen from a datacentre.
 */
export async function allocationFor(
  linkedinAccountId: string
): Promise<ProxyAllocation | null> {
  const { rows } = await db().execute({
    sql: `SELECT host, port, username_encrypted, password_encrypted, last_exit_ip
            FROM proxy_allocations
           WHERE linkedin_account_id = ? AND status = 'active'
           LIMIT 1`,
    args: [linkedinAccountId],
  });
  const row = rows[0];
  if (!row) return null;

  const username = decryptSecret(String(row.username_encrypted ?? ""));
  const password = decryptSecret(String(row.password_encrypted ?? ""));
  if (!username || !password) {
    log(`account ${linkedinAccountId}: address stored without credentials`);
    return null;
  }

  return {
    server: `http://${String(row.host)}:${Number(row.port)}`,
    username,
    password,
    // The driver asserts the observed exit against this before anything runs,
    // so an address that silently changed stops the session rather than acting
    // from somewhere the account has never been seen.
    expectedIp: String(row.last_exit_ip ?? ""),
  };
}

export function isProduction(): boolean {
  return process.env.WORKER_ENV === "production";
}
