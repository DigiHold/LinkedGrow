import { getAppUrl } from "@/lib/app-url";
import { isCloud } from "@/lib/edition";
import { getInstanceSettings, instanceSecrets, type InstanceSettings } from "@/lib/instance-settings";
import { LocalStorage, storageRoot } from "./local";
import { S3Storage } from "./s3";

export interface PutResult {
  key: string;
  url: string;
  size: number;
}

export interface StorageDriver {
  readonly isConfigured: boolean;
  put(key: string, body: Buffer, contentType: string): Promise<PutResult>;
  delete(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  deleteByPrefix(prefix: string): Promise<number>;
  copy(sourceKey: string, destinationKey: string): Promise<{ key: string; url: string }>;
  /** The stored bytes and their type, or null when the key is not there. */
  read(key: string): Promise<{ body: Buffer; contentType: string } | null>;
  publicUrl(key: string): string;
  /** The storage key behind one of our own URLs, or null for a foreign URL. */
  keyFromUrl(url: string): string | null;
  /** Presigned direct upload, or null when the driver cannot offer one. */
  presignUpload(
    key: string,
    contentType: string,
    expiresIn: number
  ): Promise<{ uploadUrl: string; publicUrl: string } | null>;
  presignDownload(key: string, expiresIn: number): Promise<string | null>;
}

/** The cloud bucket, built once from the five R2 variables. */
let cloudDriver: S3Storage | null = null;

/** The self hosted driver, rebuilt whenever the settings row changes. */
let selfHostedDriver: { updatedAt: number; driver: StorageDriver } | null = null;

function cloudStorage(): S3Storage {
  const accountId = process.env.R2_ACCOUNT_ID || "";
  return new S3Storage({
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    region: "auto",
    bucket: process.env.R2_BUCKET_NAME || "linkedgrow-media",
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    publicUrl: process.env.R2_PUBLIC_URL,
  });
}

async function selfHostedStorage(settings: InstanceSettings): Promise<StorageDriver> {
  if (settings.storageProvider !== "s3") {
    return new LocalStorage(storageRoot(), getAppUrl());
  }
  const secrets = await instanceSecrets();
  return new S3Storage({
    endpoint: settings.s3Endpoint || "",
    region: settings.s3Region,
    bucket: settings.s3Bucket || "",
    accessKeyId: secrets.s3AccessKey,
    secretAccessKey: secrets.s3Secret,
    publicUrl: settings.s3PublicUrl,
  });
}

/**
 * The storage this instance writes to. The cloud reads its environment; a self
 * hosted instance reads the wizard's row, local disk unless it chose a bucket.
 */
export async function getStorage(): Promise<StorageDriver> {
  if (isCloud()) {
    cloudDriver ??= cloudStorage();
    return cloudDriver;
  }
  const settings = await getInstanceSettings();
  const updatedAt = settings.updatedAt.getTime();
  if (selfHostedDriver && selfHostedDriver.updatedAt === updatedAt) return selfHostedDriver.driver;
  const driver = await selfHostedStorage(settings);
  selfHostedDriver = { updatedAt, driver };
  return driver;
}

export interface UploadOptions {
  fileName: string;
  contentType: string;
  userId: string;
  postId?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
}

/** A unique key for a user's file: under the post when there is one, under uploads otherwise. */
export function generateStorageKey(userId: string, fileName: string, postId?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 50);

  if (postId) {
    return `users/${userId}/posts/${postId}/${timestamp}-${random}-${sanitizedName}`;
  }
  return `users/${userId}/uploads/${timestamp}-${random}-${sanitizedName}`;
}

export async function uploadToR2(fileBuffer: Buffer, options: UploadOptions): Promise<UploadResult> {
  const storage = await getStorage();
  const key = generateStorageKey(options.userId, options.fileName, options.postId);
  return storage.put(key, fileBuffer, options.contentType);
}

export async function uploadBase64ToR2(base64Data: string, options: UploadOptions): Promise<UploadResult> {
  const base64 = base64Data.replace(/^data:[^;]+;base64,/, "");
  return uploadToR2(Buffer.from(base64, "base64"), options);
}

export async function deleteFromR2(key: string): Promise<void> {
  const storage = await getStorage();
  await storage.delete(key);
}

export async function deleteMultipleFromR2(keys: string[]): Promise<void> {
  const storage = await getStorage();
  await storage.deleteMany(keys);
}

export const DIRECT_UPLOAD_UNAVAILABLE = "Direct upload is not available on this storage";

/**
 * A presigned URL the browser can PUT to, for the files too big to pass
 * through the app. Throws when the driver has no such thing.
 */
export async function getPresignedUploadUrl(
  options: UploadOptions,
  expiresIn: number = 3600
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const storage = await getStorage();
  const key = generateStorageKey(options.userId, options.fileName, options.postId);
  const presigned = await storage.presignUpload(key, options.contentType, expiresIn);
  if (!presigned) throw new Error(DIRECT_UPLOAD_UNAVAILABLE);
  return { uploadUrl: presigned.uploadUrl, key, publicUrl: presigned.publicUrl };
}

export async function getPresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const storage = await getStorage();
  const url = await storage.presignDownload(key, expiresIn);
  if (!url) throw new Error("Direct download is not available on this storage");
  return url;
}

/**
 * Copies a stored object to a new key. Used when duplicating a post so the
 * duplicate owns its own file: otherwise deleting the original would also
 * delete the duplicate's image, PDF or video.
 */
export async function copyR2Object(
  sourceKey: string,
  destinationKey: string
): Promise<{ key: string; url: string }> {
  const storage = await getStorage();
  return storage.copy(sourceKey, destinationKey);
}

/** Deletes everything under a prefix. Account deletion purges `users/{userId}/` with it. */
export async function deleteR2ByPrefix(prefix: string): Promise<number> {
  if (!prefix || prefix.length < 3) {
    throw new Error("Refusing to delete objects with empty/short prefix");
  }
  const storage = await getStorage();
  return storage.deleteByPrefix(prefix);
}

/** Whether uploads can succeed. Never throws: a missing settings row reads as not configured. */
export async function isR2Configured(): Promise<boolean> {
  try {
    const storage = await getStorage();
    return storage.isConfigured;
  } catch {
    return false;
  }
}

/**
 * A stored media URL as a client outside the instance can fetch it. The local
 * driver stores relative URLs (`/uploads/<key>`) so one image works at any
 * address; the public API and the MCP server put the instance origin in front
 * at response time. Bucket URLs are already absolute and pass through.
 */
export function absoluteMediaUrl(url: string): string {
  return url.startsWith("/") ? `${getAppUrl()}${url}` : url;
}
