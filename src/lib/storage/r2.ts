// Cloudflare R2 Storage Integration
// Free 10GB storage, no egress fees - perfect for SaaS media storage

import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, CopyObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2 uses S3-compatible API
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "linkedgrow-media";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // Optional: Custom domain or R2.dev URL

// Initialize S3 client for R2
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

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

/**
 * Generate a unique storage key for the file
 */
function generateStorageKey(userId: string, fileName: string, postId?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = fileName.split('.').pop() || 'bin';
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50);

  if (postId) {
    return `users/${userId}/posts/${postId}/${timestamp}-${random}-${sanitizedName}`;
  }
  return `users/${userId}/uploads/${timestamp}-${random}-${sanitizedName}`;
}

/**
 * Upload a file to R2 storage
 */
export async function uploadToR2(
  fileBuffer: Buffer,
  options: UploadOptions
): Promise<UploadResult> {
  const key = generateStorageKey(options.userId, options.fileName, options.postId);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: options.contentType,
    // Set cache headers for CDN
    CacheControl: "public, max-age=31536000, immutable",
    Metadata: {
      userId: options.userId,
      postId: options.postId || "",
      originalName: options.fileName,
    },
  });

  await r2Client.send(command);

  // Generate public URL
  const url = R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL}/${key}`
    : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

  return {
    key,
    url,
    size: fileBuffer.length,
  };
}

/**
 * Upload a base64 image to R2
 */
export async function uploadBase64ToR2(
  base64Data: string,
  options: UploadOptions
): Promise<UploadResult> {
  // Remove data URL prefix if present
  const base64 = base64Data.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');

  return uploadToR2(buffer, options);
}

/**
 * Delete a file from R2 storage
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * Delete multiple files from R2 storage
 */
export async function deleteMultipleFromR2(keys: string[]): Promise<void> {
  await Promise.all(keys.map(key => deleteFromR2(key)));
}

/**
 * Generate a presigned URL for direct client upload
 * Use this for large files to avoid server memory issues
 */
export async function getPresignedUploadUrl(
  options: UploadOptions,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const key = generateStorageKey(options.userId, options.fileName, options.postId);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: options.contentType,
    Metadata: {
      userId: options.userId,
      postId: options.postId || "",
      originalName: options.fileName,
    },
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });

  const publicUrl = R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL}/${key}`
    : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

  return {
    uploadUrl,
    key,
    publicUrl,
  };
}

/**
 * Generate a presigned URL for downloading a private file
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Copy an existing R2 object to a new key. Used when duplicating a post so
 * the duplicate owns its own media file - otherwise deleting the original
 * would also delete the duplicate's image/PDF/video.
 *
 * Returns the new key + public URL. Caller is responsible for deciding the
 * destination key (typically derived from the duplicating user's id).
 */
export async function copyR2Object(
  sourceKey: string,
  destinationKey: string
): Promise<{ key: string; url: string }> {
  await r2Client.send(
    new CopyObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: destinationKey,
      // CopySource must be `${bucket}/${key}` URL-encoded
      CopySource: `/${R2_BUCKET_NAME}/${encodeURIComponent(sourceKey).replace(/%2F/g, "/")}`,
    })
  );

  return {
    key: destinationKey,
    url: getPublicUrl(destinationKey),
  };
}

/**
 * Delete all objects under a given prefix.
 * Used for account deletion to purge everything under `users/{userId}/`.
 */
export async function deleteR2ByPrefix(prefix: string): Promise<number> {
  if (!prefix || prefix.length < 3) {
    throw new Error("Refusing to delete R2 objects with empty/short prefix");
  }

  let continuationToken: string | undefined;
  let deletedCount = 0;

  do {
    const list = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    const keys = (list.Contents ?? []).map((o) => o.Key!).filter(Boolean);
    if (keys.length > 0) {
      await r2Client.send(
        new DeleteObjectsCommand({
          Bucket: R2_BUCKET_NAME,
          Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
        })
      );
      deletedCount += keys.length;
    }

    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);

  return deletedCount;
}

/**
 * Check if R2 is configured
 */
export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

/**
 * Get the public URL for a storage key
 */
export function getPublicUrl(key: string): string {
  return R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL}/${key}`
    : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
}
