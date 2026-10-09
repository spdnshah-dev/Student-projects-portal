// Detect the real file type from magic bytes — never trust the extension.
// Only PDF, PNG and JPG are allowed for certificate uploads.

export type AllowedType = "pdf" | "png" | "jpg";

export function detectFileType(buf: Uint8Array): AllowedType | null {
  // %PDF-
  if (
    buf.length >= 5 &&
    buf[0] === 0x25 &&
    buf[1] === 0x50 &&
    buf[2] === 0x44 &&
    buf[3] === 0x46 &&
    buf[4] === 0x2d
  ) {
    return "pdf";
  }
  // PNG signature
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "png";
  }
  // JPEG SOI + marker
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "jpg";
  }
  return null;
}

export const CONTENT_TYPE: Record<AllowedType, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
};

export const EXTENSION: Record<AllowedType, string> = {
  pdf: "pdf",
  png: "png",
  jpg: "jpg",
};

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
