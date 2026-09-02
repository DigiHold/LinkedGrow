import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { optionalEnv } from "../config.ts";
import { instance } from "../instance.ts";
import { log } from "../logger.ts";

/**
 * The disk the app serves, written from this side of the shared volume.
 *
 * A self hosted instance keeps its files under `STORAGE_ROOT` and the app
 * answers for them at `${appUrl}/uploads/<key>`. The worker mounts the same
 * directory, so an avatar it stores is readable by the dashboard the moment
 * the write returns, with nothing to sign and nothing to upload.
 */

export function storageRoot(): string {
  return optionalEnv("STORAGE_ROOT") ?? "/data/uploads";
}

/**
 * The absolute path of a key, or a throw when it would land outside the root.
 * A null byte is refused with the rest: the filesystem would cut the path there.
 */
function pathFor(key: string): string {
  const root = resolve(storageRoot());
  const target = resolve(root, key);
  if (!key || key.includes("\0") || target === root || !target.startsWith(root + sep)) {
    throw new Error("key resolves outside the storage root");
  }
  return target;
}

async function appUrl(): Promise<string | null> {
  const url = (await instance()).appUrl ?? optionalEnv("APP_URL");
  return url ? url.replace(/\/+$/, "") : null;
}

/**
 * The key behind one of the app's own `/uploads/` URLs, when this instance
 * keeps its files on the disk this worker shares with it. Null for every other
 * URL, and for every URL when the files live in a bucket.
 */
export async function localKeyFromUrl(url: string): Promise<string | null> {
  if ((await instance()).storageProvider !== "local") return null;
  const base = await appUrl();
  if (!base) return null;
  const prefix = `${base}/uploads/`;
  if (!url.startsWith(prefix)) return null;
  const key = url.slice(prefix.length).split(/[?#]/)[0] ?? "";
  return key ? key : null;
}

/**
 * The bytes under a key, or null when there is no such file. A key that would
 * leave the root throws, the same way a write would.
 */
export async function readObject(key: string): Promise<Buffer | null> {
  const file = pathFor(key);
  try {
    return await readFile(file);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "ENOENT" || code === "EISDIR" || code === "ENOTDIR") return null;
    throw error;
  }
}

/** Writes one file and returns the URL the app serves it at, or null. */
export async function putObject(
  key: string,
  body: Buffer,
  _contentType: string
): Promise<string | null> {
  const base = await appUrl();
  if (!base) {
    log("could not store a file: no app url to serve it from", { key });
    return null;
  }
  try {
    const file = pathFor(key);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, body);
  } catch (error) {
    log("could not store a file", { key, reason: error instanceof Error ? error.message : String(error) });
    return null;
  }
  return `${base}/uploads/${key}`;
}

/** Removes one file. A key that was never there counts as gone. */
export async function deleteObject(key: string): Promise<boolean> {
  try {
    await rm(pathFor(key), { force: true });
    return true;
  } catch (error) {
    log("could not remove a file", { key, reason: error instanceof Error ? error.message : String(error) });
    return false;
  }
}
