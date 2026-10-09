/**
 * Always-on link-checker worker.
 *
 * Runs the SSRF-safe check over every published link once at start, then every
 * LINK_CHECK_INTERVAL_HOURS (default 24). Deploy as a small always-on container
 * (ECS/EC2 task, or a worker service) that has NO credentials, no cloud role,
 * and sits behind an egress firewall with no access to the metadata service —
 * the checker only needs outbound https to the public web.
 *
 * Run with: npm run worker:link-check
 */
import { runLinkChecksOnce } from "../lib/link-check-run";

const INTERVAL_MS =
  Number(process.env.LINK_CHECK_INTERVAL_HOURS ?? 24) * 60 * 60 * 1000;

let running = false;

async function cycle() {
  if (running) return; // never overlap runs
  running = true;
  const startedAt = new Date().toISOString();
  try {
    const summary = await runLinkChecksOnce();
    console.log(
      `[link-check] ${startedAt} checked ${summary.total} links — ${summary.ok} ok, ${summary.down} down`,
    );
  } catch (err) {
    console.error("[link-check] run failed:", err);
  } finally {
    running = false;
  }
}

async function main() {
  console.log(
    `[link-check] worker started; interval ${INTERVAL_MS / 3_600_000}h`,
  );
  await cycle();
  setInterval(() => {
    void cycle();
  }, INTERVAL_MS);
}

void main();

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    console.log(`[link-check] ${sig} received, shutting down`);
    process.exit(0);
  });
}
