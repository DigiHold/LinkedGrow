import { mkdir, rm, writeFile } from "node:fs/promises";
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

/** The absolute path of a key, or a throw when it would land outside the root. */
function pathFor(key: string): string {
  const root = resolve(storageRoot());
  const target = resolve(root, key);
  if (!key || target === root || !target.startsWith(root + sep)) {
    throw new Error("key resolves outside the storage root");
  }
  return target;
}

async function appUrl(): Promise<string | null> {
  const url = (await instance()).appUrl ?? optionalEnv("APP_URL");
  return url ? url.replace(/\/+$/, "") : null;
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
