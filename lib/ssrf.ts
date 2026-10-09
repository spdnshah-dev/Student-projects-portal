/**
 * SSRF-safe URL guard and link check — INTERIM version for the Open-project
 * popup. It enforces the rules that don't need DNS: https only, and reject IP
 * literals / localhost / the cloud metadata address / private & reserved
 * ranges. The full guard (resolve the name first, check the resolved address,
 * connect only to that exact IP, re-check every redirect hop, response-size
 * cap, run from the egress-firewalled worker) is completed in the link-checker
 * milestone, which will share this module.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.169.254", // cloud metadata
]);

function isPrivateOrReservedIpv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if ([a, Number(m[3]), Number(m[4])].some((n) => n > 255) || a > 255) return true;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local / metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  return false;
}

function isPrivateIpv6(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "::1" || h === "::") return true;
  if (h.startsWith("fe80:")) return true; // link-local
  if (h.startsWith("fc") || h.startsWith("fd")) return true; // unique-local fc00::/7
  if (h.startsWith("::ffff:")) return true; // IPv4-mapped
  return false;
}

export type UrlCheck =
  | { ok: true; url: URL }
  | { ok: false; reason: string };

export function assertSafeUrl(raw: string): UrlCheck {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "That is not a valid URL." };
  }
  if (url.protocol !== "https:") {
    return { ok: false, reason: "Only https links are allowed." };
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host)) {
    return { ok: false, reason: "That address is not allowed." };
  }
  if (isPrivateOrReservedIpv4(host)) {
    return { ok: false, reason: "That address is in a private range." };
  }
  if (host.includes(":") && isPrivateIpv6(host)) {
    return { ok: false, reason: "That address is in a private range." };
  }
  return { ok: true, url };
}

export type LinkResult = {
  ok: boolean;
  httpStatus?: number;
  responseMs: number;
  error?: string;
};

export async function checkLink(
  rawUrl: string,
  { timeoutMs = 10_000 }: { timeoutMs?: number } = {},
): Promise<LinkResult> {
  const safe = assertSafeUrl(rawUrl);
  const started = Date.now();
  if (!safe.ok) return { ok: false, responseMs: 0, error: safe.reason };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(safe.url, {
      method: "GET",
      redirect: "manual", // do not follow redirects automatically
      signal: controller.signal,
      headers: { "user-agent": "LearnbayProjects-LinkCheck/1.0" },
    });
    const responseMs = Date.now() - started;
    // An opaque redirect (manual mode) means the link bounced elsewhere — not a
    // clean answer; treat it as not working for now.
    const ok =
      res.type !== "opaqueredirect" && res.status >= 200 && res.status < 400;
    return {
      ok,
      httpStatus: res.status || undefined,
      responseMs,
      error: ok
        ? undefined
        : res.type === "opaqueredirect"
          ? "The link redirects elsewhere."
          : `The site returned HTTP ${res.status}.`,
    };
  } catch {
    const responseMs = Date.now() - started;
    return {
      ok: false,
      responseMs,
      error: controller.signal.aborted
        ? "The link did not answer in time."
        : "Could not reach the link.",
    };
  } finally {
    clearTimeout(timer);
  }
}
