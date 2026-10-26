/**
 * Turn an upload failure into a short plain-English reason for the student.
 * The internal error is logged by the caller; it is never shown to users.
 */
export function friendlyUploadError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e ?? "");
  const m = raw.toLowerCase();

  if (/body exceeded|too large|payload too large|413/.test(m)) {
    return "That file is too large. Please use a file under 10 MB.";
  }
  if (/malware|virus|safety scan/.test(m)) {
    return "That file didn't pass the safety scan, so we can't accept it.";
  }
  if (/timeout|timed out|fetch failed|network|econn|socket hang up/.test(m)) {
    return "The upload took too long or the connection dropped. Please check your internet and try again.";
  }
  if (/store does not exist|token|unauthori[sz]ed|forbidden|blob|storage|bucket|s3/.test(m)) {
    return "We couldn't save your file because file storage isn't available right now. Please try again later or tell a Learnbay admin.";
  }
  if (/image could not be processed|unsupported image|input buffer|vips/.test(m)) {
    return "We couldn't read that image. Please try a different PNG or JPG file.";
  }
  return "Something went wrong while uploading. Please try again, and tell a Learnbay admin if it keeps happening.";
}
