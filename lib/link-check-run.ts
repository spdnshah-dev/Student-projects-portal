// Shared link-check logic for the popup endpoint and the daily worker.
// Relative imports (not "@/") so the standalone worker runs under tsx without
// path-alias resolution.
import { prisma } from "./prisma";
import { checkLink } from "./ssrf";

function timeout(): number {
  return Number(process.env.LINK_CHECK_TIMEOUT_MS ?? 10_000);
}

/** Check one project's live link, record the result, and update its flags. */
export async function recordProjectLinkCheck(
  projectId: string,
  liveUrl: string,
) {
  const result = await checkLink(liveUrl, { timeoutMs: timeout() });
  const now = new Date();
  await prisma.$transaction([
    prisma.linkCheck.create({
      data: {
        projectId,
        ok: result.ok,
        httpStatus: result.httpStatus ?? null,
        error: result.error ?? null,
        responseMs: result.responseMs,
      },
    }),
    prisma.project.update({
      where: { id: projectId },
      data: {
        linkOk: result.ok,
        linkLastCheckedAt: now,
        ...(result.ok ? { linkLastWorkedAt: now } : {}),
      },
    }),
  ]);
  return result;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Check every published link once. Spread out with a small delay so we don't
 * hammer any one host. Returns a summary.
 */
export async function runLinkChecksOnce({
  delayMs = 400,
}: { delayMs?: number } = {}): Promise<{
  total: number;
  ok: number;
  down: number;
}> {
  const projects = await prisma.project.findMany({
    where: { state: "PUBLISHED", approvedVersionId: { not: null } },
    select: { id: true, liveUrl: true },
  });

  let ok = 0;
  let down = 0;
  for (const p of projects) {
    const r = await recordProjectLinkCheck(p.id, p.liveUrl);
    if (r.ok) ok++;
    else down++;
    if (delayMs) await sleep(delayMs);
  }
  return { total: projects.length, ok, down };
}
