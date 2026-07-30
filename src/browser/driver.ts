import { chromium, type BrowserContext, type Page } from "patchright";
import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import type { AgentContext } from "../config.ts";
import { optionalEnv } from "../config.ts";
import { fingerprintFor, fingerprintInitScript } from "./fingerprint.ts";
import { usePersona } from "./human.ts";
import { log } from "../logger.ts";

/**
 * Opens the browser for one LinkedIn account.
 *
 * Plan section 7g: this is the one file in the browser layer that is replaced
 * rather than ported. The original parks a window off-screen on Nicolas's Mac
 * and hands focus back to whatever he was typing in, which has no cloud
 * equivalent. Everything above this file keeps receiving a page handle and does
 * not know the difference.
 *
 * What it must guarantee, from section 8a:
 *  - Real Chrome under a virtual display, never headless. Headless has its own
 *    set of tells and there is no reason to accept them.
 *  - One persistent profile per ACCOUNT, so the session survives and the
 *    account signs in rarely. A fresh login every morning is abnormal by itself.
 *  - Every byte leaves through that account's own address, with no WebRTC and
 *    no IPv6 to leak around it.
 *  - Clock, locale and geolocation follow the address, not the server.
 *  - The observed public IP is asserted before the session does anything.
 */

export interface Session {
  context: BrowserContext;
  page: Page;
  /** The address this session is actually going out through. */
  observedIp: string;
}

export class ProxyMismatchError extends Error {
  constructor(expected: string, observed: string) {
    super(
      `This session came out at ${observed} instead of ${expected}. Refusing to touch LinkedIn from the wrong address.`
    );
    this.name = "ProxyMismatchError";
  }
}

export interface ProxyAllocation {
  server: string;
  username: string;
  password: string;
  /** The address the provider says this allocation exits at. */
  expectedIp: string;
}

const PROFILE_ROOT = optionalEnv("PROFILE_ROOT") ?? "profiles";

/**
 * Everything opening a browser needs to know, which is less than an agent.
 *
 * Publishing a post has no agent behind it: a content-only customer never
 * created one, and their session opens for the two minutes it takes to write a
 * post and then closes. Narrowing the parameter is what lets that path reuse
 * this file rather than grow a second, subtly different launcher.
 */
export interface SessionTarget {
  linkedinAccountId: string;
  country: string;
  timezone: string;
}

export function sessionTargetFor(ctx: AgentContext): SessionTarget {
  return {
    linkedinAccountId: ctx.linkedinAccountId,
    country: ctx.country,
    timezone: ctx.cfg.account.timezone,
  };
}

export async function openSession(
  target: SessionTarget,
  proxy: ProxyAllocation | null
): Promise<Session> {
  const fp = fingerprintFor(target.linkedinAccountId, target.country, target.timezone);
  // The behaviour persona is derived the same way as the device, so this
  // account types and moves like the same person on every run.
  usePersona(target.linkedinAccountId);
  const userDataDir = resolve(PROFILE_ROOT, target.linkedinAccountId);
  mkdirSync(userDataDir, { recursive: true });

  // A worker killed mid-session leaves Chrome's own lock behind, and the next launch on that
  // profile either fails or quietly starts a second browser beside a process that no longer
  // exists. Nothing else can be using this directory: the account's slot is held for the whole
  // group and only one process ever holds it, so a lock found here is always stale.
  for (const lock of ["SingletonLock", "SingletonSocket", "SingletonCookie"]) {
    rmSync(resolve(userDataDir, lock), { force: true });
  }

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chrome",
    // Headful under a virtual display. Section 8a layer 2.
    headless: false,
    viewport: fp.viewport,
    userAgent: fp.userAgent,
    locale: fp.locale,
    timezoneId: fp.timezone,
    ...(proxy
      ? {
          proxy: {
            server: proxy.server,
            username: proxy.username,
            password: proxy.password,
          },
        }
      : {}),
    args: [
      `--window-size=${fp.viewport.width},${fp.viewport.height}`,
      // WebRTC would announce the real address regardless of the proxy, and
      // IPv6 would route around it entirely. Both are the classic leak.
      "--force-webrtc-ip-handling-policy=disable_non_proxied_udp",
      "--disable-features=WebRtcHideLocalIpsWithMdns",
      "--disable-ipv6",
      // A container has no compositor telling Chrome it is visible, and a
      // throttled renderer stalls the session.
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
      "--disable-features=CalculateNativeWinOcclusion",
      "--no-first-run",
      "--no-default-browser-check",
    ],
  });

  await context.addInitScript(fingerprintInitScript(fp));

  const page = context.pages()[0] ?? (await context.newPage());
  // Patchright defaults to 30 seconds per action. LinkedIn is slower than most sites and every
  // call here goes through a residential address, so the default produces spurious failures on a
  // healthy page. Long enough to be patient, short enough that a dead page is noticed.
  page.setDefaultTimeout(45_000);
  page.setDefaultNavigationTimeout(60_000);

  // The assertion, before anything else touches the network. Section 8a: if
  // the observed address is not the one allocated to this account, the session
  // does not run. Sending from a substitute address is worse than not sending.
  const observedIp = await publicIp(page);
  if (proxy && observedIp !== proxy.expectedIp) {
    await context.close().catch(() => {});
    throw new ProxyMismatchError(proxy.expectedIp, observedIp);
  }
  log(`account ${target.linkedinAccountId}: session up at ${observedIp} (${target.country})`);

  return { context, page, observedIp };
}

/**
 * The address this browser actually goes out at, read through the browser
 * itself rather than through Node, because Node does not use the proxy and
 * would happily report the server's own address.
 */
async function publicIp(page: Page): Promise<string> {
  const endpoints = ["https://api.ipify.org?format=json", "https://ifconfig.co/json"];
  for (const url of endpoints) {
    try {
      const value = await page.evaluate(async (u) => {
        const res = await fetch(u, { cache: "no-store" });
        const body = (await res.json()) as { ip?: string };
        return body.ip ?? "";
      }, url);
      if (value) return value;
    } catch {
      // Try the next one. Two providers, because one being down must not stop
      // every agent on the fleet.
    }
  }
  throw new Error("Could not establish which address this session goes out at");
}

/** True when the session still holds a signed-in LinkedIn cookie. */
export async function isSignedIn(context: BrowserContext): Promise<boolean> {
  const cookies = await context.cookies("https://www.linkedin.com");
  return cookies.some((c) => c.name === "li_at" && !!c.value);
}

export async function closeSession(session: Session): Promise<void> {
  await session.context.close().catch(() => {});
}

/**
 * The original engine's name for the same check, kept so miner.ts and
 * sources.ts port without an edit. LinkedIn is the only platform here, so the
 * host and cookie arguments are accepted and ignored.
 */
export async function hasSessionCookie(
  context: BrowserContext,
  _host: string,
  cookieName: string
): Promise<boolean> {
  const cookies = await context.cookies("https://www.linkedin.com");
  return cookies.some((c) => c.name === cookieName && !!c.value);
}
