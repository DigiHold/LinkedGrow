/**
 * Does this address actually look like somebody's home connection?
 *
 * Plan section 5b: never buy on the marketing claim. A published comparison
 * found a "dedicated IP" promise served by a shared HostRoyale datacenter
 * exit, and re-resolving three competitors' addresses on 2026-07-30 put two of
 * them on hosting networks. The claim and the product diverge often enough in
 * this industry that the only evidence worth having is our own.
 *
 * This runs twice: once before an address is ever bound to an account, and once
 * a month afterwards, because an address that was residential when bought can
 * be reclassified later and we want to move before LinkedIn notices.
 *
 * It never blocks by itself. A hosting classification raises a flag and an
 * alert; pulling an address out from under a live account is a bigger event
 * than a bad score and stays a decision, not an automatic action.
 */

export interface ExitCheck {
  /** What the world sees when this proxy makes a request. */
  ip: string;
  asn: string | null;
  asnOrg: string | null;
  country: string | null;
  /** True when the network reads as a hosting company rather than an ISP. */
  looksHosted: boolean;
  /** Filled when the check could not complete, in which case nothing else is
   *  trustworthy and the caller should retry rather than conclude. */
  error?: string;
}

/**
 * Words that appear in the organisation name of hosting networks and almost
 * never in a consumer ISP's. Deliberately conservative: a false negative costs
 * us a monthly re-check, a false positive would move a healthy account.
 */
const HOSTING_WORDS = [
  "hosting", "host", "datacenter", "data center", "datacentre", "server",
  "cloud", "vps", "dedicated", "colocation", "colo ", "llc hosting",
  "digital ocean", "digitalocean", "linode", "vultr", "ovh", "hetzner",
  "contabo", "leaseweb", "choopa", "quadranet", "psychz", "hostroyale",
  "m247", "gcore", "scaleway", "aws", "amazon", "azure", "google cloud",
];

function readsAsHosting(org: string | null): boolean {
  if (!org) return false;
  const lower = org.toLowerCase();
  return HOSTING_WORDS.some((w) => lower.includes(w));
}

export interface ProxyCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
}

/**
 * Routes one request through the proxy and reports what came out the other
 * side. Node's fetch cannot use an HTTP proxy on its own, so this shells the
 * work to curl, which is present on every box the worker runs on and avoids
 * adding a dependency for six lines of behaviour.
 */
export async function checkExit(
  proxy: ProxyCredentials,
  timeoutMs = 20_000
): Promise<ExitCheck> {
  const empty: ExitCheck = {
    ip: "",
    asn: null,
    asnOrg: null,
    country: null,
    looksHosted: false,
  };

  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const run = promisify(execFile);

  const auth = `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}`;
  const proxyUrl = `http://${auth}@${proxy.host}:${proxy.port}`;

  try {
    const { stdout } = await run(
      "curl",
      [
        "--silent",
        "--show-error",
        "--max-time",
        String(Math.ceil(timeoutMs / 1000)),
        "--proxy",
        proxyUrl,
        "https://ipinfo.io/json",
      ],
      { timeout: timeoutMs + 5_000 }
    );
    const data = JSON.parse(stdout) as {
      ip?: string;
      org?: string;
      country?: string;
    };
    // ipinfo returns org as "AS12322 Free SAS", so the number and the name
    // come apart on the first space.
    const org = data.org ?? null;
    const match = org?.match(/^(AS\d+)\s+(.*)$/);
    const asn = match?.[1] ?? null;
    const asnOrg = match?.[2] ?? org;
    return {
      ip: data.ip ?? "",
      asn,
      asnOrg,
      country: data.country ?? null,
      looksHosted: readsAsHosting(asnOrg),
    };
  } catch (error) {
    return {
      ...empty,
      error: error instanceof Error ? error.message : "exit check failed",
    };
  }
}

/**
 * The gate before an address is bound to a customer's LinkedIn account.
 *
 * Unreachable is a hard no, because an address that cannot answer now will not
 * carry a session later. A wrong country is a hard no, since the whole point is
 * that the account signs in from where its owner is. A hosting classification
 * is a warning rather than a refusal: it is a judgement about reputation and
 * refusing on it would leave some countries unservable.
 */
export function acceptForBinding(
  check: ExitCheck,
  expectedCountry: string
): { ok: boolean; reason?: string; warn?: string } {
  if (check.error) return { ok: false, reason: `Address unreachable: ${check.error}` };
  if (!check.ip) return { ok: false, reason: "Address returned no exit IP" };
  if (
    check.country &&
    check.country.toUpperCase() !== expectedCountry.toUpperCase()
  ) {
    return {
      ok: false,
      reason: `Address exits in ${check.country}, not ${expectedCountry}`,
    };
  }
  if (check.looksHosted) {
    return {
      ok: true,
      warn: `Exit ${check.ip} resolves to ${check.asnOrg}, which reads as a hosting network rather than a consumer ISP`,
    };
  }
  return { ok: true };
}
