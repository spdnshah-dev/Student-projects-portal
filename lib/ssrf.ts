import https from "node:https";
import dns from "node:dns/promises";

/**
 * SSRF-safe URL guard and link check.
 *
 * Rules (from the spec):
 *   1. https only — reject http, ftp, file, anything else.
 *   2. Reject IP literals, localhost, the cloud metadata address
 *      (169.254.169.254) and private / reserved ranges, for both IPv4 and IPv6.
 *   3. Resolve the name first, check the resolved address, then connect only to
 *      that exact address (pinned lookup), so the name cannot change between the
 *      check and the request (DNS rebinding).
 *   4. Do not follow redirects automatically.
 *   5. The checker is given no credentials/cookies/cloud role and runs behind an
 *      egress firewall (deployment concern — see the worker).
 *   6. Timeout, and record only status/timing/whether it worked; never render or
 *      run what comes back (we don't even read the body).
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.169.254",
]);

function isPrivateOrReservedIpv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b, c, d] = m.slice(1).map(Number);
  if ([a, b, c, d].some((n) => n > 255)) return true;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local / metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a === 192 && b === 0 && c === 0) return true; // 192.0.0.0/24
  if (a >= 224) return true; // multicast + reserved (224+)
  return false;
}

function isPrivateIpv6(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "::1" || h === "::" || h === "") return true;
  if (h.startsWith("fe80:")) return true; // link-local
  if (h.startsWith("fc") || h.startsWith("fd")) return true; // unique-local fc00::/7
  if (h.startsWith("::ffff:")) return true; // IPv4-mapped
  if (h.startsWith("fe80") || h.startsWith("ff")) return true; // link-local / multicast
  return false;
}

function isBlockedAddress(addr: string): boolean {
  if (BLOCKED_HOSTNAMES.has(addr)) return true;
  if (addr.includes(":")) return isPrivateIpv6(addr);
  return isPrivateOrReservedIpv4(addr);
}

function looksLikeIp(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":");
}

export type UrlCheck = { ok: true; url: URL } | { ok: false; reason: string };

/** Synchronous checks that need no DNS: protocol and obvious bad literals. */
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
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTNAMES.has(host)) {
    return { ok: false, reason: "That address is not allowed." };
  }
  if (looksLikeIp(host) && isBlockedAddress(host)) {
    return { ok: false, reason: "That address is in a private range." };
  }
  return { ok: true, url };
}

class SsrfError extends Error {}

/** Resolve a hostname and reject if any resolved address is private/reserved. */
async function resolveHostSafely(
  hostname: string,
): Promise<{ address: string; family: number }> {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (looksLikeIp(host)) {
    if (isBlockedAddress(host)) throw new SsrfError("private address");
    return { address: host, family: host.includes(":") ? 6 : 4 };
  }
  const records = await dns.lookup(host, { all: true });
  if (records.length === 0) throw new SsrfError("no address");
  for (const r of records) {
    if (isBlockedAddress(r.address)) throw new SsrfError("private address");
  }
  return { address: records[0].address, family: records[0].family };
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
  const started = Date.now();
  const safe = assertSafeUrl(rawUrl);
  if (!safe.ok) return { ok: false, responseMs: 0, error: safe.reason };

  let pinned: { address: string; family: number };
  try {
    pinned = await resolveHostSafely(safe.url.hostname);
  } catch {
    return {
      ok: false,
      responseMs: Date.now() - started,
      error: "The address could not be resolved or is not allowed.",
    };
  }

  return new Promise<LinkResult>((resolve) => {
    let done = false;
    const finish = (r: Omit<LinkResult, "responseMs">) => {
      if (done) return;
      done = true;
      resolve({ ...r, responseMs: Date.now() - started });
    };

    const req = https.request(
      {
        hostname: safe.url.hostname,
        servername: safe.url.hostname, // SNI by name
        port: safe.url.port || 443,
        path: safe.url.pathname + safe.url.search,
        method: "GET",
        // Pin the connection to the pre-validated address.
        lookup: (_h, _o, cb) =>
          cb(null, pinned.address, pinned.family as 4 | 6),
        timeout: timeoutMs,
        headers: {
          host: safe.url.host,
          "user-agent": "LearnbayProjects-LinkCheck/1.0",
          accept: "*/*",
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        // We never read or run the body — status/timing only.
        res.destroy();
        req.destroy();
        const ok = status >= 200 && status < 400;
        finish({
          ok,
          httpStatus: status || undefined,
          error: ok ? undefined : `The site returned HTTP ${status}.`,
        });
      },
    );

    req.on("timeout", () => {
      req.destroy();
      finish({ ok: false, error: "The link did not answer in time." });
    });
    req.on("error", () => finish({ ok: false, error: "Could not reach the link." }));
    req.end();
  });
}
