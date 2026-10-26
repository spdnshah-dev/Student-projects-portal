import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getLiveProfileLinkedIn } from "@/lib/public";
import { canRevealContact, linkedInLookupStatus } from "@/lib/contact-privacy";

/**
 * GET /api/students/:id/linkedin — RECRUITER-ONLY.
 *
 * Authorizes on the SERVER using the signed session cookie. Anyone who is not
 * a signed-in recruiter gets 404 (not 403), so the endpoint never confirms that
 * a URL exists. The URL is not even queried unless the session is a recruiter.
 */
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

function notFound() {
  return NextResponse.json({ error: "Not found." }, { status: 404, headers: NO_STORE });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!canRevealContact(user)) return notFound();

  const { id } = await params;
  const url = await getLiveProfileLinkedIn(id);
  if (linkedInLookupStatus(user, url) !== 200) return notFound();

  return NextResponse.json({ url }, { headers: NO_STORE });
}
