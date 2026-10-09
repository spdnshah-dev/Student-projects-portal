import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Fixed-window rate limiter backed by the rate_limits table. One atomic
 * upsert per hit (INSERT ... ON CONFLICT), so it is safe across multiple
 * server instances. Fails OPEN on a DB error — a limiter fault must never lock
 * everyone out — while still logging.
 */
export type Window = { key: string; limit: number; windowSec: number };

async function hit(w: Window): Promise<{ allowed: boolean; count: number }> {
  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO rate_limits (id, key, count, reset_at)
      VALUES (${randomUUID()}, ${w.key}, 1, now() + make_interval(secs => ${w.windowSec}))
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limits.reset_at < now() THEN 1 ELSE rate_limits.count + 1 END,
        reset_at = CASE WHEN rate_limits.reset_at < now()
          THEN now() + make_interval(secs => ${w.windowSec})
          ELSE rate_limits.reset_at END
      RETURNING count`;
    const count = Number(rows[0]?.count ?? 1);
    return { allowed: count <= w.limit, count };
  } catch (e) {
    console.error("[rate-limit] error (failing open):", e);
    return { allowed: true, count: 0 };
  }
}

/**
 * Check several windows; returns true if ALL are within limits. Every window is
 * counted (so one over-limit window still records the others' hits).
 */
export async function allowAll(windows: Window[]): Promise<boolean> {
  const results = await Promise.all(windows.map(hit));
  return results.every((r) => r.allowed);
}

// --- convenience gates (keyed by client IP and/or identifier) --------------
import { clientIp } from "@/lib/request-meta";
import { LIMITS, MINUTE, DAY } from "@/lib/limits";

export async function formAllowed(): Promise<boolean> {
  const ip = await clientIp();
  return allowAll([
    { key: `form:min:${ip}`, limit: LIMITS.formPerMinute, windowSec: MINUTE },
  ]);
}

export async function loginAllowed(email: string): Promise<boolean> {
  const ip = await clientIp();
  return allowAll([
    { key: `login:ip:${ip}`, limit: LIMITS.loginPerMinute, windowSec: MINUTE },
    { key: `login:email:${email}`, limit: LIMITS.loginPerMinute, windowSec: MINUTE },
  ]);
}

export async function aiAllowed(sessionToken: string): Promise<boolean> {
  const ip = await clientIp();
  return allowAll([
    { key: `ai:ip:min:${ip}`, limit: LIMITS.aiPerMinute, windowSec: MINUTE },
    { key: `ai:ip:day:${ip}`, limit: LIMITS.aiPerDay, windowSec: DAY },
    { key: `ai:sess:min:${sessionToken}`, limit: LIMITS.aiPerMinute, windowSec: MINUTE },
    { key: `ai:sess:day:${sessionToken}`, limit: LIMITS.aiPerDay, windowSec: DAY },
  ]);
}

export async function checkAllowed(): Promise<boolean> {
  const ip = await clientIp();
  return allowAll([
    { key: `check:min:${ip}`, limit: LIMITS.checkPerMinute, windowSec: MINUTE },
  ]);
}
