import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { PutResult, StorageDriver } from "./index";

export interface S3StorageOptions {
  /** The API endpoint, scheme included: R2, MinIO, or an AWS regional endpoint. */
  endpoint: string;
  /** Empty means `auto` on R2 and `us-east-1` elsewhere. */
  region?: string | null;
  bucket: string;
  accessKeyId?: string | null;
  secretAccessKey?: string | null;
  /** Where the files are read back from. Empty means the bucket host itself. */
  publicUrl?: string | null;
}

const R2_HOST = "r2.cloudflarestorage.com";

/**
 * Any S3 compatible bucket. Cloudflare R2 in the cloud, and whatever the self
 * hosted instance points at: MinIO, Wasabi, Backblaze, AWS itself.
 *
 * R2 takes virtual host addressing and the region `auto`. Everything else gets
 * path style, because MinIO in Docker has no wildcard DNS for bucket subdomains.
 */
export class S3Storage implements StorageDriver {
  readonly isConfigured: boolean;
  private readonly client: S3Client;
  private readonly bucket: string;
  /** Public base, no trailing slash. */
  private readonly base: string;
  /** The bucket host base, no trailing slash: the address the files also answer on. */
  private readonly bucketBase: string;

  constructor(options: S3StorageOptions) {
    const endpoint = options.endpoint.replace(/\/+$/, "");
    const isR2 = endpoint.includes(R2_HOST);
    const region = options.region || (isR2 ? "auto" : "us-east-1");
    const accessKeyId = options.accessKeyId || "";
    const secretAccessKey = options.secretAccessKey || "";
    this.isConfigured = !!(endpoint && options.bucket && accessKeyId && secretAccessKey);
    this.bucket = options.bucket;
    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle: !isR2,
      ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
    });
    this.bucketBase = isR2
      ? endpoint.replace("://", `://${options.bucket}.`)
      : `${endpoint}/${options.bucket}`;
    this.base = options.publicUrl ? options.publicUrl.replace(/\/+$/, "") : this.bucketBase;
  }

  async put(key: string, body: Buffer, contentType: string): Promise<PutResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    return { key, url: this.publicUrl(key), size: body.length };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.delete(key)));
  }

  async deleteByPrefix(prefix: string): Promise<number> {
    if (!prefix || prefix.length < 3) {
      throw new Error("Refusing to delete objects with empty/short prefix");
    }
    let continuationToken: string | undefined;
    let deletedCount = 0;
    do {
      const list = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      );
      const keys = (list.Contents ?? []).map((o) => o.Key).filter((k): k is string => !!k);
      if (keys.length > 0) {
        await this.client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
          })
        );
        deletedCount += keys.length;
      }
      continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (continuationToken);
    return deletedCount;
  }

  async copy(sourceKey: string, destinationKey: string): Promise<{ key: string; url: string }> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        Key: destinationKey,
        // CopySource is `${bucket}/${key}`, URL encoded except the slashes.
        CopySource: `/${this.bucket}/${encodeURIComponent(sourceKey).replace(/%2F/g, "/")}`,
      })
    );
    return { key: destinationKey, url: this.publicUrl(destinationKey) };
  }

  publicUrl(key: string): string {
    return `${this.base}/${key}`;
  }

  keyFromUrl(url: string): string | null {
    for (const base of [this.base, this.bucketBase]) {
      const prefix = `${base}/`;
      if (!url.startsWith(prefix)) continue;
      const key = url.slice(prefix.length).split(/[?#]/)[0];
      if (key) return key;
    }
    return null;
  }

  async presignUpload(
    key: string,
    contentType: string,
    expiresIn: number
  ): Promise<{ uploadUrl: string; publicUrl: string } | null> {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });
    return { uploadUrl, publicUrl: this.publicUrl(key) };
  }

  async presignDownload(key: string, expiresIn: number): Promise<string | null> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn });
  }
}
