import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aiConfigured } from "@/lib/gemini";
import { storageConfigured } from "@/lib/storage";

export const dynamic = "force-dynamic";

// Lightweight health/readiness check: database reachable, and which optional
// integrations are configured. Does not leak any secret values.
export async function GET() {
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }
  return NextResponse.json(
    {
      ok: db,
      db: db ? "up" : "down",
      integrations: { ai: aiConfigured(), storage: storageConfigured() },
      time: new Date().toISOString(),
    },
    { status: db ? 200 : 503 },
  );
}
