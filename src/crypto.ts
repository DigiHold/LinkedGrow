import { createDecipheriv } from "node:crypto";
import { requireEnv } from "./config.ts";

/**
 * Reading what the app encrypted.
 *
 * The dashboard stores LinkedIn passwords, TOTP secrets and proxy credentials
 * with AES-256-GCM under `ENCRYPTION_KEY`, in the format
 * `iv:authTag:ciphertext`, all hex. The worker only ever needs to read them,
 * so this is the decrypt half of `src/lib/encryption.ts` in the app repo and
 * deliberately has no encrypt counterpart: the worker writing a secret would
 * mean a secret exists in two places.
 *
 * The two files have to agree on the format. If the app's encryption changes,
 * this changes with it in the same commit.
 */

const ALGORITHM = "aes-256-gcm";

function key(): Buffer {
  const raw = requireEnv("ENCRYPTION_KEY");
  const buf = Buffer.from(raw, "hex");
  if (buf.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be 64 hex characters (32 bytes), got ${buf.length}`
    );
  }
  return buf;
}

export function decryptSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  const parts = value.split(":");
  if (parts.length !== 3) {
    throw new Error("Encrypted value is not in iv:authTag:ciphertext form");
  }
  const [ivHex, tagHex, dataHex] = parts as [string, string, string];
  const decipher = createDecipheriv(ALGORITHM, key(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  let out = decipher.update(dataHex, "hex", "utf8");
  out += decipher.final("utf8");
  return out;
}
