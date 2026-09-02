import { chromium, type BrowserContext, type Page } from "patchright";
import { accessSync, constants, mkdirSync, rmSync } from "node:fs";
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

export const PROFILE_ROOT = optionalEnv("PROFILE_ROOT") ?? "profiles";

/**
 * How big the virtual display actually is.
 *
 * The fingerprint pool contains machines up to 2560x1440, and the window is
 * sized from the machine. A window larger than the X screen does not get
 * clipped: Chrome dies at launch, so an account whose id happened to hash to
 * the biggest machine could never open a browser at all, for ever, while its
 * neighbour worked. One account in five, and it took a real sign-in to find.
 *
 * Set alongside DISPLAY in the unit file so the two cannot drift.
 */
function displaySize(): { width: number; height: number } {
  const raw = optionalEnv("SCREEN_SIZE") ?? "1920x1080";
  const [w, h] = raw.split("x").map(Number);
  return {
    width: Number.isFinite(w) && w ? (w as number) : 1920,
    height: Number.isFinite(h) && h ? (h as number) : 1080,
  };
}

/**
 * The window this account opens, never bigger than the screen it opens on.
 *
 * Clamping the window rather than the reported screen size is also what is
 * true of a real machine: a window is smaller than the display, and the page
 * still reads the full screen resolution.
 */
function windowFor(fp: ReturnType<typeof fingerprintFor>): { width: number; height: number } {
  const screen = displaySize();
  return {
    width: Math.min(fp.viewport.width, screen.width),
    height: Math.min(fp.viewport.height, screen.height),
  };
}

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

/**
 * Chrome needs a home it can write to, and says so very badly when it has none.
 *
 * --user-data-dir does not cover it: the crashpad handler resolves its database
 * from HOME, and so do ~/.config, ~/.cache and ~/.pki. Under the unit's
 * sandboxing the service account's own home is either blanked by
 * ProtectHome=yes or read-only under ProtectSystem=strict, and Chrome then dies
 * on SIGTRAP with one warning line about crashpad and nothing else. It cost a
 * whole night on 2026-07-31 and it looked, from the dashboard, like the account
 * was simply slow to sign in.
 *
 * Failing here instead turns that into one sentence naming the cause, for
 * whatever machine this runs on next.
 */
function assertWritableHome(): void {
  const home = process.env.HOME;
  if (!home) {
    throw new Error(
      "HOME is not set, and Chrome cannot start without a writable home. Set Environment=HOME=<dir inside ReadWritePaths> in the unit."
    );
  }
  try {
    mkdirSync(home, { recursive: true });
    accessSync(home, constants.W_OK);
  } catch {
    throw new Error(
      `HOME (${home}) is not writable, so Chrome will die at launch with a crashpad error and nothing else. Point HOME at a directory inside the unit's ReadWritePaths.`
    );
  }
}

export async function openSession(
  target: SessionTarget,
  proxy: ProxyAllocation | null
): Promise<Session> {
  assertWritableHome();
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

  // Chrome's first launch on a brand-new profile fails often enough to matter,
  // and it fails hard: the process dies on SIGTRAP with crashpad complaining
  // about its own socket, and nothing about the second attempt is different
  // except that it works. It cost the first real sign-in on 2026-07-31.
  //
  // The profile is never deleted between attempts. It may already hold the
  // session cookie, and throwing that away to fix a launch would turn a hiccup
  // into a fresh sign-in that LinkedIn has to verify all over again.
  let context: Awaited<ReturnType<typeof chromium.launchPersistentContext>>;
  try {
    context = await launchChrome(userDataDir, fp, proxy);
  } catch (error) {
    log(`account ${target.linkedinAccountId}: Chrome did not start, trying once more`, {
      reason: error instanceof Error ? error.message.split("\n")[0] : String(error),
    });
    await new Promise((r) => setTimeout(r, 3000));
    for (const lock of ["SingletonLock", "SingletonSocket", "SingletonCookie"]) {
      rmSync(resolve(userDataDir, lock), { force: true });
    }
    context = await launchChrome(userDataDir, fp, proxy);
  }


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

/** One attempt at starting Chrome for this account, exactly as configured. */
function launchChrome(
  userDataDir: string,
  fp: ReturnType<typeof fingerprintFor>,
  proxy: ProxyAllocation | null
) {
  // Google Chrome ships for amd64 only. An arm64 host points CHROME_PATH at a
  // Chromium binary instead; nothing else about the launch changes, and the
  // fingerprint keeps reporting a Chrome user agent.
  const chromePath = optionalEnv("CHROME_PATH");
  return chromium.launchPersistentContext(userDataDir, {
    ...(chromePath ? { executablePath: chromePath } : { channel: "chrome" }),
    // Headful under a virtual display. Section 8a layer 2.
    headless: false,
    viewport: windowFor(fp),
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
      `--window-size=${windowFor(fp).width},${windowFor(fp).height}`,
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
}
