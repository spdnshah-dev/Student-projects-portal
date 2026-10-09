import { NextResponse } from "next/server";
import { getPublicProject } from "@/lib/public";
import { recordProjectLinkCheck } from "@/lib/link-check-run";
import { checkAllowed } from "@/lib/rate-limit";

// Called by the Open-project popup: checks the project's live link (SSRF-safe),
// records the result, updates the project's link-health flags, and returns
// whether it is working. The daily background sweep uses the same logic in
// worker/link-check.ts.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!(await checkAllowed())) {
    return NextResponse.json(
      { ok: false, error: "Too many checks. Please wait a moment." },
      { status: 429 },
    );
  }

  const project = await getPublicProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const result = await recordProjectLinkCheck(project.id, project.liveUrl);

  return NextResponse.json({
    ok: result.ok,
    httpStatus: result.httpStatus ?? null,
    responseMs: result.responseMs,
  });
}
