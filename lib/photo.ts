import { randomUUID } from "crypto";
import sharp from "sharp";
import { detectFileType, MAX_UPLOAD_BYTES } from "@/lib/fileType";
import { scanForMalware } from "@/lib/malware";
import { putObject } from "@/lib/storage";

/**
 * Process an uploaded profile photo and store it. Same safeguards as a
 * certificate image, plus a square crop so every avatar is uniform:
 *   1. real type by magic bytes (PNG / JPG only — no PDF for a photo)
 *   2. size cap
 *   3. malware scan (hook)
 *   4. re-encoded to a 512×512 JPEG (strips EXIF / hidden metadata, applies
 *      orientation, centre-crops to a square)
 *   5. stored under a NEW random name, never the student's filename
 */
export type PhotoResult =
  | { ok: true; fileKey: string }
  | { ok: false; error: string };

export async function processProfilePhoto(file: File): Promise<PhotoResult> {
  if (!file || file.size === 0) {
    return { ok: false, error: "Choose an image to upload." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "The image is larger than 10 MB." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  const type = detectFileType(bytes);
  if (type !== "png" && type !== "jpg") {
    return { ok: false, error: "Use a PNG or JPG image." };
  }

  const scan = await scanForMalware(bytes, file.name);
  if (!scan.clean) {
    return { ok: false, error: "That image didn't pass the safety scan, so we can't accept it." };
  }

  let out: Buffer;
  try {
    out = await sharp(Buffer.from(bytes), { failOn: "none" })
      .rotate()
      .resize(512, 512, { fit: "cover", position: "centre" })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    return { ok: false, error: "That image could not be processed." };
  }

  const key = `photos/${randomUUID()}.jpg`;
  const { url } = await putObject(key, new Uint8Array(out), "image/jpeg");

  return { ok: true, fileKey: url };
}
