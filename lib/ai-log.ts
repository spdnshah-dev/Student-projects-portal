import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";

/**
 * Per-session conversation log. The durable record lives in the database
 * (ai_sessions + ai_messages); this additionally writes each session to its own
 * text file, which the super admin can read. On a read-only/ephemeral host the
 * write is skipped silently (the DB stays the source of truth).
 */
const LOG_DIR = path.join(process.cwd(), "logs", "ai-sessions");

export async function logLine(
  sessionToken: string,
  visitorType: string,
  role: string,
  text: string,
): Promise<void> {
  try {
    await mkdir(LOG_DIR, { recursive: true });
    const safe = sessionToken.replace(/[^a-zA-Z0-9_-]/g, "");
    const line = `${new Date().toISOString()}\t${visitorType}\t${role}\t${text.replace(/\n/g, " ")}\n`;
    await appendFile(path.join(LOG_DIR, `${safe}.txt`), line, "utf8");
  } catch {
    // read-only FS (e.g. serverless) — DB remains the record.
  }
}
