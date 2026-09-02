import { createHash, createHmac } from "node:crypto";
import { optionalEnv } from "../config.ts";
import { EDITION } from "../edition.ts";
import { instance } from "../instance.ts";
import { log } from "../logger.ts";
import { putObject as putLocal, deleteObject as deleteLocal } from "./local.ts";

/**
 * Putting a file where the dashboard already reads from.
 *
 * Only avatars go through here so far, and they have to: LinkedIn serves member
 * photos from signed URLs that expire, so storing the URL gives you a picture
 * that works today and a broken image next week. The file has to be copied.
 *
 * Two places it can go. The cloud has its R2 bucket, read from the
 * environment. A self hosted instance writes to the disk the app serves
 * unless the wizard pointed it at a bucket of its own, in which case the same
 * SigV4 request goes there, with the host and the region the row names.
 *
 * Signed by hand rather than with the AWS SDK. It is one PUT, the signature is
 * sixty lines, and the alternative is a dependency tree measured in megabytes
 * on a box whose whole job is running browsers.
 *
 * Everything degrades quietly when nothing is configured: a worker without a
 * bucket stores no picture and keeps working, because a missing avatar is a
 * cosmetic problem and a crashed session is not.
 */

interface Bucket {
  /** What SigV4 signs as the host header, port included when there is one. */
  host: string;
  /** Scheme and host, where the requests go. */
  origin: string;
  /** `auto` on R2, which ignores it but still checks the signature against it. */
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
}

const R2_HOST = "r2.cloudflarestorage.com";

function cloudBucket(): Bucket | null {
  const accountId = optionalEnv("R2_ACCOUNT_ID");
  const accessKeyId = optionalEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = optionalEnv("R2_SECRET_ACCESS_KEY");
  const bucket = optionalEnv("R2_BUCKET_NAME");
  const publicUrl = optionalEnv("R2_PUBLIC_URL");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) return null;
  const host = `${accountId}.${R2_HOST}`;
  return { host, origin: `https://${host}`, region: "auto", accessKeyId, secretAccessKey, bucket, publicUrl };
}

async function selfHostedBucket(): Promise<Bucket | null> {
  const row = await instance();
  if (row.storageProvider !== "s3") return null;
  if (!row.s3Endpoint || !row.s3Bucket || !row.s3AccessKey || !row.s3Secret) return null;
  let endpoint: URL;
  try {
    endpoint = new URL(row.s3Endpoint);
  } catch {
    log("the storage endpoint is not a url", { endpoint: row.s3Endpoint });
    return null;
  }
  const isR2 = endpoint.host.endsWith(R2_HOST);
  return {
    host: endpoint.host,
    origin: endpoint.origin,
    region: row.s3Region || (isR2 ? "auto" : "us-east-1"),
    accessKeyId: row.s3AccessKey,
    secretAccessKey: row.s3Secret,
    bucket: row.s3Bucket,
    publicUrl: row.s3PublicUrl || `${endpoint.origin}/${row.s3Bucket}`,
  };
}

/** The bucket, when there is one. The cloud reads its environment, the row decides elsewhere. */
export async function bucketConfig(): Promise<Bucket | null> {
  return EDITION === "cloud" ? cloudBucket() : selfHostedBucket();
}

/** Which driver takes the files: the disk the app serves, or a bucket. */
async function provider(): Promise<"local" | "s3"> {
  if (EDITION === "cloud") return "s3";
  return (await instance()).storageProvider === "s3" ? "s3" : "local";
}

/** True when a put has somewhere to go. */
export async function storageConfigured(): Promise<boolean> {
  if ((await provider()) === "local") return true;
  return (await bucketConfig()) !== null;
}

const sha256 = (value: string | Buffer): string =>
  createHash("sha256").update(value).digest("hex");

const hmac = (key: Buffer, value: string): Buffer =>
  createHmac("sha256", key).update(value).digest();

/** Path style for every bucket: R2 accepts it, and MinIO in Docker has nothing else. */
const objectPath = (cfg: Bucket, key: string): string =>
  `/${cfg.bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;

/**
 * Signs one request the way S3 wants it, so PUT and DELETE do not each carry
 * their own sixty lines of SigV4.
 */
function signedHeadersFor(
  cfg: Bucket,
  method: "PUT" | "DELETE",
  path: string,
  payloadHash: string,
  contentType?: string
): Record<string, string> {
  const now = new Date();
  const amzDate = `${now.toISOString().replace(/[:-]|\.\d{3}/g, "")}`;
  const dateStamp = amzDate.slice(0, 8);

  const canonicalHeaders =
    (contentType ? `content-type:${contentType}\n` : "") +
    `host:${cfg.host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = contentType
    ? "content-type;host;x-amz-content-sha256;x-amz-date"
    : "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    method,
    path,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${cfg.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256(canonicalRequest),
  ].join("\n");

  let signingKey = hmac(Buffer.from(`AWS4${cfg.secretAccessKey}`, "utf8"), dateStamp);
  signingKey = hmac(signingKey, cfg.region);
  signingKey = hmac(signingKey, "s3");
  signingKey = hmac(signingKey, "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  return {
    ...(contentType ? { "Content-Type": contentType } : {}),
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    Authorization:
      `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

/**
 * Removes one object.
 *
 * This exists for the videos. A customer's video is up to 200MB, LinkedIn keeps
 * its own copy the moment the composer accepts it, and ours is dead weight from
 * that second on: a handful of customers posting weekly fills the bucket with
 * gigabytes nobody will ever read again. Images and documents are small enough
 * to keep so the dashboard can still show the post as it went out.
 *
 * Returns true only when the object is gone. S3 answers 204 for a delete and
 * also for a key that was never there, which is the right answer for both.
 */
export async function deleteObject(key: string): Promise<boolean> {
  if ((await provider()) === "local") return deleteLocal(key);
  const cfg = await bucketConfig();
  if (!cfg) return false;

  const path = objectPath(cfg, key);
  const payloadHash = sha256("");

  const response = await fetch(`${cfg.origin}${path}`, {
    method: "DELETE",
    headers: signedHeadersFor(cfg, "DELETE", path, payloadHash),
    signal: AbortSignal.timeout(30_000),
  }).catch(() => null);

  if (!response || !response.ok) {
    log("could not remove a file", { key, status: response?.status ?? "no response" });
    return false;
  }
  return true;
}

/** Uploads one object and returns the URL it can be read back from, or null. */
export async function putObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string | null> {
  if ((await provider()) === "local") return putLocal(key, body, contentType);
  const cfg = await bucketConfig();
  if (!cfg) return null;

  const path = objectPath(cfg, key);
  const payloadHash = sha256(body);

  const response = await fetch(`${cfg.origin}${path}`, {
    method: "PUT",
    headers: signedHeadersFor(cfg, "PUT", path, payloadHash, contentType),
    body: new Uint8Array(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    // The body carries the bucket's own reason and never the credentials.
    log("could not store a file", { key, status: response.status });
    return null;
  }
  return `${cfg.publicUrl.replace(/\/+$/, "")}/${key}`;
}
