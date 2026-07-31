import { createHash, createHmac } from "node:crypto";
import { optionalEnv } from "../config.ts";
import { log } from "../logger.ts";

/**
 * Putting a file in the bucket the dashboard already reads from.
 *
 * Only avatars go through here so far, and they have to: LinkedIn serves member
 * photos from signed URLs that expire, so storing the URL gives you a picture
 * that works today and a broken image next week. The file has to be copied.
 *
 * Signed by hand rather than with the AWS SDK. It is one PUT, the signature is
 * sixty lines, and the alternative is a dependency tree measured in megabytes
 * on a box whose whole job is running browsers.
 *
 * Everything degrades quietly when the bucket is not configured: a worker
 * without R2 credentials stores no picture and keeps working, because a missing
 * avatar is a cosmetic problem and a crashed session is not.
 */

interface Bucket {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
}

export function bucketConfig(): Bucket | null {
  const accountId = optionalEnv("R2_ACCOUNT_ID");
  const accessKeyId = optionalEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = optionalEnv("R2_SECRET_ACCESS_KEY");
  const bucket = optionalEnv("R2_BUCKET_NAME");
  const publicUrl = optionalEnv("R2_PUBLIC_URL");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

const sha256 = (value: string | Buffer): string =>
  createHash("sha256").update(value).digest("hex");

const hmac = (key: Buffer, value: string): Buffer =>
  createHmac("sha256", key).update(value).digest();

/** Uploads one object and returns the URL it can be read back from, or null. */
export async function putObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string | null> {
  const cfg = bucketConfig();
  if (!cfg) return null;

  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const path = `/${cfg.bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
  const now = new Date();
  const amzDate = `${now.toISOString().replace(/[:-]|\.\d{3}/g, "")}`;
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256(body);

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    path,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  // R2 ignores the region but the signature does not, and "auto" is what it
  // expects to see.
  const scope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256(canonicalRequest),
  ].join("\n");

  let signingKey = hmac(Buffer.from(`AWS4${cfg.secretAccessKey}`, "utf8"), dateStamp);
  signingKey = hmac(signingKey, "auto");
  signingKey = hmac(signingKey, "s3");
  signingKey = hmac(signingKey, "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  const response = await fetch(`https://${host}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      Authorization:
        `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, ` +
        `SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
    body: new Uint8Array(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    // The body carries R2's own reason and never the credentials.
    log("could not store a file", { key, status: response.status });
    return null;
  }
  return `${cfg.publicUrl.replace(/\/+$/, "")}/${key}`;
}
