import "dotenv/config";
import { db } from "../db.ts";
import { decryptSecret } from "../crypto.ts";
import { closeSession, openSession, type ProxyAllocation } from "../browser/driver.ts";
import { timezoneForCountry } from "../browser/fingerprint.ts";
import { registryCountry } from "../proxy/fulfil.ts";

/**
 * Proving the machine can do the job, without spending a LinkedIn sign-in on it.
 *
 * The whole browser chain has one property worth checking before any account
 * touches it: a real Chrome starts under the unit's sandboxing, reaches the
 * virtual display, goes out through a residential address, and that address is
 * the one we bought rather than the server's own. Every one of those failed at
 * some point on 2026-07-30 and 07-31, and each time the only symptom visible
 * anywhere was an account that seemed slow to connect.
 *
 * It reaches nothing but an address-echo endpoint, so it can be run as often as
 * anyone likes, on a box with no customers on it, after any change to the unit,
 * the display, the image or the driver.
 *
 *   node --experimental-strip-types src/tools/smoke.ts            first spare address
 *   node --experimental-strip-types src/tools/smoke.ts <accountId>  that account's own
 *
 * It must be run the way the worker runs, or it proves nothing about the worker:
 *
 *   systemd-run --uid=linkedgrow --property=... (the unit's own properties)
 *
 * The exit code is the answer: 0 means this box can drive LinkedIn.
 */

/** Any usable address, preferring one already bound to the given account. */
async function anyAllocation(accountId: string | undefined): Promise<{
  allocation: ProxyAllocation;
  country: string;
  boundTo: string;
} | null> {
  const { rows } = await db().execute({
    sql: `SELECT host, port, username_encrypted, password_encrypted, last_exit_ip,
                 country, COALESCE(linkedin_account_id, '') AS bound
            FROM proxy_allocations
           WHERE status = 'active' AND last_exit_ip IS NOT NULL
           ORDER BY (COALESCE(linkedin_account_id, '') = ?) DESC, created_at
           LIMIT 1`,
    args: [accountId ?? ""],
  });
  const row = rows[0];
  if (!row) return null;

  return {
    allocation: {
      server: `http://${String(row.host)}:${Number(row.port)}`,
      username: decryptSecret(String(row.username_encrypted ?? "")),
      password: decryptSecret(String(row.password_encrypted ?? "")),
      expectedIp: String(row.last_exit_ip ?? ""),
    },
    country: String(row.country ?? "FR"),
    boundTo: String(row.bound ?? "") || "the spare pool",
  };
}

async function main(): Promise<void> {
  const accountId = process.argv[2];
  const found = await anyAllocation(accountId);
  if (!found) {
    console.error("No active address with a known exit. Nothing to test against.");
    process.exit(2);
  }

  // The server's own address, for the comparison that matters: if the session
  // comes out here, the proxy did nothing and every account is exposed.
  const direct = await fetch("https://api.ipify.org?format=json")
    .then((r) => r.json() as Promise<{ ip?: string }>)
    .then((b) => b.ip ?? "unknown")
    .catch(() => "unknown");

  console.log(`this server        ${direct}`);
  console.log(`address expected   ${found.allocation.expectedIp} (${found.country}, held for ${found.boundTo})`);

  // Sold as one country, registered in another, is not a detail. LinkedIn
  // reported the same address as Paris once and Vilnius twice on 2026-07-31,
  // and an account that appears to move between countries is an account that
  // keeps being asked to prove itself.
  const registered = await registryCountry(found.allocation.expectedIp);
  console.log(`registered in      ${registered ?? "unknown"}`);
  if (registered && registered !== found.country.toUpperCase()) {
    console.log(
      `WARNING: sold as ${found.country} but registered in ${registered}. Platforms follow the registration.`
    );
  }

  const session = await openSession(
    {
      // A fixed id when none is given, so repeat runs reuse one throwaway
      // profile instead of littering the profile root.
      linkedinAccountId: accountId ?? "smoke-test",
      country: found.country,
      timezone: timezoneForCountry(found.country),
    },
    found.allocation
  );

  try {
    console.log(`session came out   ${session.observedIp}`);
    if (session.observedIp === direct) {
      console.error("FAIL: the session came out at the server's own address.");
      process.exit(1);
    }
    // openSession already refuses a mismatch, so reaching here means the
    // observed address is the allocated one. Say it plainly anyway.
    console.log("PASS: Chrome started under this unit and went out through the dedicated address.");
  } finally {
    await closeSession(session);
  }
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
);
