import { createReadStream } from "node:fs";
import type { Readable } from "node:stream";
import { copyFile, mkdir, readdir, rm, rmdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, posix, relative, resolve, sep } from "node:path";
import type { PutResult, StorageDriver } from "./index";

/** Where the local driver keeps its files. The Docker volume is mounted here. */
export function storageRoot(): string {
  return process.env.STORAGE_ROOT || "/data/uploads";
}

/**
 * The absolute path of a key under the root, or a throw when the key would land
 * anywhere else. Every read and write on disk goes through this one check.
 */
export function resolveUnderRoot(root: string, key: string): string {
  const base = resolve(root);
  const target = resolve(base, key);
  if (!key || target === base || !target.startsWith(base + sep)) {
    throw new Error("key resolves outside the storage root");
  }
  return target;
}

/**
 * Files on the disk the app serves itself, at `${appUrl}/uploads/<key>`.
 *
 * The self hosted default: nothing to sign up for, and the worker writes to
 * the same directory through the shared volume. No presigned URLs exist here,
 * so the browser uploads through the app instead of straight to the bucket.
 */
export class LocalStorage implements StorageDriver {
  readonly isConfigured = true;
  private readonly root: string;
  private readonly base: string;

  constructor(root: string, appUrl: string) {
    this.root = resolve(root);
    this.base = `${appUrl.replace(/\/+$/, "")}/uploads/`;
  }

  private pathFor(key: string): string {
    return resolveUnderRoot(this.root, key);
  }

  async put(key: string, body: Buffer, _contentType: string): Promise<PutResult> {
    const file = this.pathFor(key);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, body);
    return { key, url: this.publicUrl(key), size: body.length };
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.delete(key)));
  }

  /**
   * Removes every file whose key starts with the prefix and returns how many
   * went. Directories left empty behind them are pruned, quietly.
   */
  async deleteByPrefix(prefix: string): Promise<number> {
    if (!prefix || prefix.length < 3) {
      throw new Error("Refusing to delete files under an empty or short prefix");
    }
    const dirKey = prefix.endsWith("/") ? prefix.slice(0, -1) : posix.dirname(prefix);
    const dir = dirKey === "." || dirKey === "" ? this.root : this.pathFor(dirKey);
    if (dir === this.root) throw new Error("Refusing to delete from the storage root");

    let deleted = 0;
    const walk = async (current: string): Promise<void> => {
      let entries;
      try {
        entries = await readdir(current, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const full = join(current, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
          await rmdir(full).catch(() => undefined);
          continue;
        }
        const key = relative(this.root, full).split(sep).join("/");
        if (key.startsWith(prefix)) {
          await rm(full, { force: true });
          deleted++;
        }
      }
    };
    await walk(dir);
    await rmdir(dir).catch(() => undefined);
    return deleted;
  }

  async copy(sourceKey: string, destinationKey: string): Promise<{ key: string; url: string }> {
    const target = this.pathFor(destinationKey);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(this.pathFor(sourceKey), target);
    return { key: destinationKey, url: this.publicUrl(destinationKey) };
  }

  publicUrl(key: string): string {
    return `${this.base}${key}`;
  }

  keyFromUrl(url: string): string | null {
    if (!url.startsWith(this.base)) return null;
    const key = url.slice(this.base.length).split(/[?#]/)[0];
    return key ? key : null;
  }

  async presignUpload(
    _key: string,
    _contentType: string,
    _expiresIn: number
  ): Promise<{ uploadUrl: string; publicUrl: string } | null> {
    return null;
  }

  async presignDownload(_key: string, _expiresIn: number): Promise<string | null> {
    return null;
  }

  /** Size and a readable stream for a stored file, or null when it is not there. */
  async open(key: string): Promise<{ size: number; stream: Readable } | null> {
    const file = this.pathFor(key);
    try {
      const info = await stat(file);
      if (!info.isFile()) return null;
      return { size: info.size, stream: createReadStream(file) };
    } catch {
      return null;
    }
  }
}
