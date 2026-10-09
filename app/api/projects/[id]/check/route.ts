import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicProject } from "@/lib/public";
import { checkLink } from "@/lib/ssrf";

// Called by the Open-project popup. Checks the project's live link (SSRF-safe),
// records the result, and returns whether it is working. The daily background
// check is added in the link-checker milestone; this covers "each time a
// visitor opens a project".
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const project = await getPublicProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const timeoutMs = Number(process.env.LINK_CHECK_TIMEOUT_MS ?? 10_000);
  const result = await checkLink(project.liveUrl, { timeoutMs });
  const now = new Date();

  await prisma.$transaction([
    prisma.linkCheck.create({
      data: {
        projectId: project.id,
        ok: result.ok,
        httpStatus: result.httpStatus ?? null,
        error: result.error ?? null,
        responseMs: result.responseMs,
      },
    }),
    prisma.project.update({
      where: { id: project.id },
      data: {
        linkOk: result.ok,
        linkLastCheckedAt: now,
        ...(result.ok ? { linkLastWorkedAt: now } : {}),
      },
    }),
  ]);

  return NextResponse.json({
    ok: result.ok,
    httpStatus: result.httpStatus ?? null,
    responseMs: result.responseMs,
  });
}
