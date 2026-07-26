import { createHash } from "node:crypto";

/**
 * A stable device identity per LinkedIn account.
 *
 * Plan section 8a layer 2: the fingerprint is fixed per account and never
 * regenerated. Randomising it per session is worse than having none, because a
 * device that changes its GPU every morning does not exist. It is derived from
 * the account id, so the same account produces the same machine on every run
 * and after every redeploy, with nothing to store.
 *
 * Section 5c adds the second reason it matters: several accounts of one
 * customer share an address, and identical fingerprints behind one address is
 * the giveaway. Different devices behind one router is what a household looks
 * like, so these values must differ per account even when the IP does not.
 */

export interface Fingerprint {
  userAgent: string;
  viewport: { width: number; height: number };
  screen: { width: number; height: number };
  hardwareConcurrency: number;
  deviceMemory: number;
  platform: string;
  webglVendor: string;
  webglRenderer: string;
  locale: string;
  timezone: string;
}

/** Deterministic 32-bit value from a seed and a label. */
function hash(seed: string, label: string): number {
  const digest = createHash("sha256").update(`${seed}:${label}`).digest();
  return digest.readUInt32BE(0);
}

function pick<T>(seed: string, label: string, options: readonly T[]): T {
  return options[hash(seed, label) % options.length] as T;
}

// Real combinations only. A machine reporting 3 cores and 6 GB does not exist,
// and an impossible device is a stronger signal than an unusual one.
const MACHINES = [
  {
    platform: "MacIntel",
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    screen: { width: 1728, height: 1117 },
    cores: 10,
    memory: 16,
    webglVendor: "Google Inc. (Apple)",
    webglRenderer: "ANGLE (Apple, ANGLE Metal Renderer: Apple M3, Unspecified Version)",
  },
  {
    platform: "MacIntel",
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    screen: { width: 1512, height: 982 },
    cores: 8,
    memory: 8,
    webglVendor: "Google Inc. (Apple)",
    webglRenderer: "ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)",
  },
  {
    platform: "Win32",
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    screen: { width: 1920, height: 1080 },
    cores: 12,
    memory: 16,
    webglVendor: "Google Inc. (NVIDIA)",
    webglRenderer:
      "ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0, D3D11)",
  },
  {
    platform: "Win32",
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    screen: { width: 2560, height: 1440 },
    cores: 16,
    memory: 32,
    webglVendor: "Google Inc. (AMD)",
    webglRenderer: "ANGLE (AMD, AMD Radeon RX 7700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)",
  },
  {
    platform: "Win32",
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    screen: { width: 1536, height: 864 },
    cores: 8,
    memory: 8,
    webglVendor: "Google Inc. (Intel)",
    webglRenderer: "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics, D3D11)",
  },
] as const;

/** The browser locale follows the address, never the server. Section 8a layer 1. */
const LOCALE_BY_COUNTRY: Record<string, string> = {
  US: "en-US", CA: "en-CA", GB: "en-GB", IE: "en-IE", AU: "en-AU", NZ: "en-NZ",
  FR: "fr-FR", BE: "fr-BE", CH: "fr-CH", DE: "de-DE", AT: "de-AT",
  NL: "nl-NL", ES: "es-ES", MX: "es-MX", IT: "it-IT", PT: "pt-PT", BR: "pt-BR",
  SE: "sv-SE", NO: "nb-NO", DK: "da-DK", FI: "fi-FI", PL: "pl-PL", CZ: "cs-CZ",
  RO: "ro-RO", SG: "en-SG", JP: "ja-JP", IN: "en-IN", ZA: "en-ZA",
  AE: "en-AE", IL: "he-IL",
};

export function fingerprintFor(
  accountId: string,
  country: string,
  timezone: string
): Fingerprint {
  const machine = pick(accountId, "machine", MACHINES);
  // A window is smaller than the screen by a variable amount, the way a real
  // one is: browser chrome, a dock, a taskbar.
  const widthTrim = 0 + (hash(accountId, "w") % 120);
  const heightTrim = 90 + (hash(accountId, "h") % 180);

  return {
    userAgent: machine.ua,
    screen: { width: machine.screen.width, height: machine.screen.height },
    viewport: {
      width: machine.screen.width - widthTrim,
      height: machine.screen.height - heightTrim,
    },
    hardwareConcurrency: machine.cores,
    deviceMemory: machine.memory,
    platform: machine.platform,
    webglVendor: machine.webglVendor,
    webglRenderer: machine.webglRenderer,
    locale: LOCALE_BY_COUNTRY[country] ?? "en-US",
    timezone,
  };
}

/**
 * The patch applied before any page script runs.
 *
 * Patchright already removes the automation surface. This only pins the values
 * that must agree with the User-Agent and with each other, because a
 * disagreement between navigator.platform, the UA and the GPU is trivially
 * detectable and is the usual way a patched browser gives itself away.
 */
export function fingerprintInitScript(fp: Fingerprint): string {
  return `
(() => {
  const def = (obj, prop, value) => {
    try { Object.defineProperty(obj, prop, { get: () => value, configurable: true }); } catch {}
  };
  def(navigator, 'hardwareConcurrency', ${fp.hardwareConcurrency});
  def(navigator, 'deviceMemory', ${fp.deviceMemory});
  def(navigator, 'platform', ${JSON.stringify(fp.platform)});
  def(screen, 'width', ${fp.screen.width});
  def(screen, 'height', ${fp.screen.height});
  def(screen, 'availWidth', ${fp.screen.width});
  def(screen, 'availHeight', ${fp.screen.height - 40});

  const UNMASKED_VENDOR = 0x9245;
  const UNMASKED_RENDERER = 0x9246;
  for (const ctx of [WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!ctx) continue;
    const original = ctx.prototype.getParameter;
    ctx.prototype.getParameter = function (parameter) {
      if (parameter === UNMASKED_VENDOR) return ${JSON.stringify(fp.webglVendor)};
      if (parameter === UNMASKED_RENDERER) return ${JSON.stringify(fp.webglRenderer)};
      return original.apply(this, [parameter]);
    };
  }
})();
`;
}
