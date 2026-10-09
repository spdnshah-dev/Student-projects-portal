import { put, del } from "@vercel/blob";

/**
 * Object storage for uploaded files. Test phase: Vercel Blob (public, served
 * from blob.vercel-storage.com — a separate domain from the app). Production:
 * AWS S3 behind a separate serving domain (swap this module's implementation).
 *
 * Files are never served from the app's own origin and never executed.
 */

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "File storage is not configured. Set BLOB_READ_WRITE_TOKEN (Vercel Blob) to enable uploads.",
    );
    this.name = "StorageNotConfiguredError";
  }
}

export function storageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Store bytes under `key`; returns the public URL to reference it by. */
export async function putObject(
  key: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<{ url: string }> {
  if (!storageConfigured()) throw new StorageNotConfiguredError();
  const res = await put(key, Buffer.from(bytes), {
    access: "public",
    contentType,
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return { url: res.url };
}

/** Delete a stored object by its URL (best effort). */
export async function deleteObject(url: string): Promise<void> {
  if (!storageConfigured()) return;
  try {
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
  } catch {
    // best effort — a missing object is fine
  }
}
