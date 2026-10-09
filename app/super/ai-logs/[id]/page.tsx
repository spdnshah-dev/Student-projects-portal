import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SuperHeader } from "@/components/super/SuperHeader";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "AI session" };

export default async function AiLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("SUPER_ADMIN");
  const { id } = await params;

  const session = await prisma.aiSession.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <SuperHeader user={user} active="ai-logs" />

      <main className="mx-auto flex w-full max-w-3xl flex-grow flex-col gap-4 px-6 py-7">
        <Link href="/super/ai-logs" className="font-semibold text-brand-ink no-underline">
          ← All sessions
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-xl font-bold tracking-tight">AI session</h1>
          <p className="m-0 font-mono text-[13px] text-brand-muted">
            {session.sessionToken}
          </p>
          <p className="m-0 text-[13px] text-brand-muted">
            Visitor: {session.visitorType.toLowerCase()} · started{" "}
            {session.startedAt.toLocaleString()} · {session.messages.length}{" "}
            messages
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-card border border-line bg-white p-5 shadow-card">
          {session.messages.length === 0 ? (
            <p className="m-0 text-brand-muted">No messages.</p>
          ) : (
            session.messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "USER"
                    ? "max-w-[85%] self-end rounded-[14px] rounded-br-[4px] bg-brand-ink px-3 py-2 text-white"
                    : "max-w-[90%] self-start whitespace-pre-line rounded-[14px] rounded-bl-[4px] bg-[#F1F3F7] px-3 py-2.5 text-brand-ink"
                }
              >
                <div className="mb-0.5 text-[10px] uppercase tracking-wider opacity-60">
                  {m.role === "USER" ? "Visitor" : "Assistant"} ·{" "}
                  {m.createdAt.toLocaleTimeString()}
                </div>
                {m.text}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
