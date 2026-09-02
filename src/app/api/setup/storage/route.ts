/** Where files live: the local uploads volume, or an S3 compatible bucket. */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSelfHosted } from "@/lib/edition";
import { encryptSecret, getInstanceSettings, instanceSecrets, updateInstanceSettings } from "@/lib/instance-settings";
import { rateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";
import { httpUrl, oneOf, secret, text, ValidationError } from "@/lib/setup/fields";
import { storageSection } from "@/lib/setup/status";

const PROVIDERS = ["local", "s3"] as const;

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!session.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!isSelfHosted()) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const limit = rateLimit(`setup:${session.user.id}`, AUTH_RATE_LIMITS.setup);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const provider = oneOf(body.provider, PROVIDERS, "Provider");
    if (!provider) return NextResponse.json({ error: "Provider is required." }, { status: 400 });
    const s3Endpoint = httpUrl(body.s3Endpoint, "Endpoint", false);
    const s3Region = text(body.s3Region, "Region", 64, 0);
    const s3Bucket = text(body.s3Bucket, "Bucket", 128, 0);
    const s3AccessKey = secret(body.s3AccessKey, "Access key");
    const s3Secret = secret(body.s3Secret, "Secret key");
    const s3PublicUrl = httpUrl(body.s3PublicUrl, "Public URL", true);

    const current = await getInstanceSettings(true);
    const endpointAfter = s3Endpoint ?? current.s3Endpoint;
    const bucketAfter = s3Bucket ?? current.s3Bucket;
    const accessAfter = s3AccessKey === undefined ? !!current.s3AccessKeyEncrypted : !!s3AccessKey;
    const secretAfter = s3Secret === undefined ? !!current.s3SecretEncrypted : !!s3Secret;
    if (provider === "s3" && (!endpointAfter || !bucketAfter || !accessAfter || !secretAfter)) {
      return NextResponse.json({ error: "Endpoint, bucket, access key and secret key are required for S3." }, { status: 400 });
    }

    const row = await updateInstanceSettings({
      storageProvider: provider,
      ...(s3Endpoint !== undefined ? { s3Endpoint } : {}),
      ...(s3Region !== undefined ? { s3Region: s3Region || null } : {}),
      ...(s3Bucket !== undefined ? { s3Bucket: s3Bucket || null } : {}),
      ...(s3AccessKey !== undefined ? { s3AccessKeyEncrypted: s3AccessKey === null ? null : encryptSecret(s3AccessKey) } : {}),
      ...(s3Secret !== undefined ? { s3SecretEncrypted: s3Secret === null ? null : encryptSecret(s3Secret) } : {}),
      ...(s3PublicUrl !== undefined ? { s3PublicUrl } : {}),
    });
    return NextResponse.json({ ok: true, storage: storageSection(row, await instanceSecrets()) });
  } catch (error) {
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Could not save the storage settings" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
