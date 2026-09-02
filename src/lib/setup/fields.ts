/**
 * Field readers for the setup routes.
 *
 * Every reader takes the raw body value and answers the parsed one, or throws
 * a ValidationError the route turns into a 400. An absent field (undefined)
 * comes back as undefined so a PATCH can leave it alone; the readers never
 * invent a default, the routes do that where one exists.
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOSTNAME_SHAPE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
const SECRET_MAX = 1000;

export function text(value: unknown, label: string, max: number, min = 1): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new ValidationError(`${label} must be text.`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw new ValidationError(`${label} is required.`);
  if (trimmed.length > max) throw new ValidationError(`${label} must be ${max} characters or fewer.`);
  return trimmed;
}

/**
 * A secret follows three rules: absent leaves the stored value alone, the
 * literal empty string clears it, anything else replaces it.
 */
export function secret(value: unknown, label: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new ValidationError(`${label} must be text.`);
  if (value === "") return null;
  if (value.length > SECRET_MAX) throw new ValidationError(`${label} is too long.`);
  return value;
}

export function email(value: unknown, label: string): string | undefined {
  const raw = text(value, label, 254);
  if (raw === undefined) return undefined;
  const lowered = raw.toLowerCase();
  if (!EMAIL_SHAPE.test(lowered)) throw new ValidationError(`${label} is not a valid email address.`);
  return lowered;
}

export function hostname(value: unknown, label: string): string | undefined {
  const raw = text(value, label, 253);
  if (raw === undefined) return undefined;
  if (!HOSTNAME_SHAPE.test(raw)) throw new ValidationError(`${label} is not a valid host name.`);
  return raw.toLowerCase();
}

export function port(value: unknown, label: string): number | undefined {
  if (value === undefined) return undefined;
  const n = typeof value === "string" ? Number(value.trim()) : value;
  if (typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > 65535) {
    throw new ValidationError(`${label} must be a number between 1 and 65535.`);
  }
  return n;
}

export function boolean(value: unknown, label: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") throw new ValidationError(`${label} must be true or false.`);
  return value;
}

/** A spending ceiling in dollars: at least 10 cents, at most 1000. */
export function cap(value: unknown, label: string): number | undefined {
  if (value === undefined) return undefined;
  const n = typeof value === "string" ? Number(value.trim()) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0.1 || n > 1000) {
    throw new ValidationError(`${label} must be between 0.1 and 1000.`);
  }
  return Math.round(n * 100) / 100;
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[], label: string): T | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    throw new ValidationError(`${label} must be one of ${allowed.join(", ")}.`);
  }
  return value as T;
}

export function timezone(value: unknown): string | undefined {
  const raw = text(value, "Timezone", 64);
  if (raw === undefined) return undefined;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: raw });
  } catch {
    throw new ValidationError("Timezone is not a known time zone.");
  }
  return raw;
}

/** The origin people type to open the instance: http or https, no path, no trailing slash. */
export function appUrl(value: unknown): string | undefined {
  const raw = text(value, "App URL", 300);
  if (raw === undefined) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ValidationError("App URL must be a full address, starting with http:// or https://.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ValidationError("App URL must start with http:// or https://.");
  }
  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new ValidationError("App URL is the address without a path.");
  }
  return parsed.origin;
}

/** An https (or http, when allowed) URL, stored without its trailing slash. */
export function httpUrl(value: unknown, label: string, allowHttp: boolean): string | undefined {
  const raw = text(value, label, 500);
  if (raw === undefined) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ValidationError(`${label} must be a full address.`);
  }
  const okProtocol = parsed.protocol === "https:" || (allowHttp && parsed.protocol === "http:");
  if (!okProtocol) throw new ValidationError(`${label} must start with ${allowHttp ? "http:// or https://" : "https://"}.`);
  return parsed.toString().replace(/\/+$/, "");
}
