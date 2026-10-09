import { randomUUID } from "crypto";
import sharp from "sharp";
import {
  CONTENT_TYPE,
  EXTENSION,
  MAX_UPLOAD_BYTES,
  detectFileType,
} from "@/lib/fileType";
import { scanForMalware } from "@/lib/malware";
import { putObject } from "@/lib/storage";

/**
 * Run an uploaded certificate file through every safeguard, then store it:
 *   1. real type by magic bytes (PDF / PNG / JPG only)
 *   2. size cap
 *   3. malware scan (hook)
 *   4. images re-encoded to strip hidden metadata; PDFs stored as data
 *   5. stored under a NEW random name, never the student's filename
 */
export type ProcessResult =
  | { ok: true; fileKey: string; fileName: string }
  | { ok: false; error: string };

export async function processCertificateFile(file: File): Promise<ProcessResult> {
  if (!file || file.size === 0) return { ok: false, error: "Choose a file to upload." };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "The file is larger than 10 MB." };
  }

  let bytes = new Uint8Array(await file.arrayBuffer());

  const type = detectFileType(bytes);
  if (!type) {
    return { ok: false, error: "Only PDF, PNG or JPG files are allowed." };
  }

  const scan = await scanForMalware(bytes);
  if (!scan.clean) {
    return { ok: false, error: "That file did not pass the malware scan." };
  }

  // Re-encode images so EXIF / hidden metadata is dropped. Orientation is
  // applied first so the image still looks right. PDFs are left as data.
  if (type === "png" || type === "jpg") {
    try {
      const img = sharp(Buffer.from(bytes), { failOn: "none" }).rotate();
      const out =
        type === "png"
          ? await img.png().toBuffer()
          : await img.jpeg({ quality: 85 }).toBuffer();
      bytes = new Uint8Array(out);
    } catch {
      return { ok: false, error: "That image could not be processed." };
    }
  }

  const key = `certificates/${randomUUID()}.${EXTENSION[type]}`;
  const { url } = await putObject(key, bytes, CONTENT_TYPE[type]);

  return { ok: true, fileKey: url, fileName: file.name.slice(0, 200) };
}
