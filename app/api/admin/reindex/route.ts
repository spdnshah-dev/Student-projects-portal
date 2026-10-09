import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { rebuildAllEmbeddings } from "@/lib/embeddings";
import { aiConfigured } from "@/lib/gemini";

// Super-admin-only: (re)build the assistant's search vectors for all published
// content. Use after the initial deploy / seed, or to repair the index.
export async function POST() {
  await requireRole("SUPER_ADMIN");
  if (!aiConfigured()) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured." },
      { status: 400 },
    );
  }
  const result = await rebuildAllEmbeddings();
  return NextResponse.json({ ok: true, ...result });
}
