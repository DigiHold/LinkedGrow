// One-off cleanup for orphan video files left in R2 (and orphan video rows
// left in the `media` table) by the old upload flow that never deleted videos
// after publishing.
//
// What it does:
//   1. Lists every object in the R2 bucket and deletes the ones whose key
//      ends in a video extension (.mp4, .mov, .m4v, .webm, .quicktime).
//   2. Deletes every row in the `media` table where mimeType starts with
//      "video/" (these are leftovers from the editor flow that used to insert
//      a media row for videos).
//
// Run once via:  npx tsx scripts/cleanup-orphan-videos.ts
//
// Going forward, /api/linkedin/post deletes the R2 video file immediately
// after a successful LinkedIn upload, and no flow inserts a video media row,
// so this cleanup should never need to run again.

import "dotenv/config";
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "../src/lib/db";
import { media } from "../src/lib/db/schema";
import { like } from "drizzle-orm";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "linkedgrow-media";

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".m4v", ".webm", ".quicktime"];

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function isVideoKey(key: string): boolean {
  const lower = key.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

async function listAllVideoKeys(): Promise<string[]> {
  const videoKeys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        ContinuationToken: continuationToken,
      })
    );

    for (const object of response.Contents || []) {
      if (object.Key && isVideoKey(object.Key)) {
        videoKeys.push(object.Key);
      }
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return videoKeys;
}

async function deleteR2Object(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
}

async function main() {
  console.log("=== Orphan video cleanup ===\n");

  // 1. R2: list and delete every video file
  console.log("[1/2] Scanning R2 bucket for video files...");
  const videoKeys = await listAllVideoKeys();
  console.log(`Found ${videoKeys.length} video file(s) in R2.`);

  let r2Deleted = 0;
  let r2Failed = 0;
  for (const key of videoKeys) {
    try {
      await deleteR2Object(key);
      r2Deleted++;
      console.log(`  deleted: ${key}`);
    } catch (err) {
      r2Failed++;
      console.error(`  FAILED: ${key} -`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`R2 cleanup: ${r2Deleted} deleted, ${r2Failed} failed.\n`);

  // 2. DB: delete media rows with a video mimeType
  console.log("[2/2] Scanning media table for video rows...");
  const videoMediaRows = await db
    .select()
    .from(media)
    .where(like(media.mimeType, "video/%"));
  console.log(`Found ${videoMediaRows.length} video row(s) in media table.`);

  let dbDeleted = 0;
  for (const row of videoMediaRows) {
    // Best-effort R2 delete in case the file wasn't caught by step 1
    // (different extension, etc).
    if (row.storageKey) {
      try {
        await deleteR2Object(row.storageKey);
      } catch {
        // Ignore - already deleted in step 1 or never existed
      }
    }
  }

  if (videoMediaRows.length > 0) {
    const result = await db.delete(media).where(like(media.mimeType, "video/%"));
    dbDeleted = videoMediaRows.length;
    console.log(`Deleted ${dbDeleted} media row(s).`, result);
  }

  console.log("\n=== Done ===");
  console.log(`R2 video files deleted: ${r2Deleted}`);
  console.log(`DB video media rows deleted: ${dbDeleted}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Cleanup failed:", err);
    process.exit(1);
  });
