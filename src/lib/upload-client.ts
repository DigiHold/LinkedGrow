/**
 * One upload from the browser, for the files a post carries.
 *
 * Storage that can presign gets the file straight from the browser, so a
 * 200MB video never passes through the app. Storage that cannot (the local
 * disk of a self hosted instance) takes it through the app's own upload route
 * instead, detached: no media row is written either way, the post links the
 * file when it is saved.
 */

export interface StoredFile {
  key: string;
  publicUrl: string;
  mimeType: string;
}

const NO_DIRECT_UPLOAD = "Direct upload is not available on this storage";

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const data = (await res.json().catch(() => null)) as { error?: unknown } | null;
  return typeof data?.error === "string" ? data.error : fallback;
}

export async function uploadFileToStorage(
  file: Blob,
  fileName: string,
  contentType: string,
  label: string = "file"
): Promise<StoredFile> {
  const presignRes = await fetch("/api/media/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, contentType, fileSize: file.size }),
  });

  if (presignRes.ok) {
    const { uploadUrl, key, publicUrl } = (await presignRes.json()) as {
      uploadUrl: string;
      key: string;
      publicUrl: string;
    };
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
    if (!uploadRes.ok) throw new Error(`Failed to upload ${label}`);
    return { key, publicUrl, mimeType: contentType };
  }

  const message = await errorMessage(presignRes, "Failed to prepare upload");
  if (presignRes.status !== 400 || !message.startsWith(NO_DIRECT_UPLOAD)) {
    throw new Error(message);
  }

  const form = new FormData();
  form.append("file", file, fileName);
  form.append("detached", "1");
  const res = await fetch("/api/media", { method: "POST", body: form });
  if (!res.ok) throw new Error(await errorMessage(res, `Failed to upload ${label}`));
  const { upload } = (await res.json()) as {
    upload: { key: string; url: string; mimeType: string };
  };
  return { key: upload.key, publicUrl: upload.url, mimeType: upload.mimeType };
}
