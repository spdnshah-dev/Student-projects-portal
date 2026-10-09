import type { Metadata } from "next";
import Link from "next/link";
import type { VisitorType } from "@prisma/client";
import { SuperHeader } from "@/components/super/SuperHeader";
import { Badge } from "@/components/ui/Badge";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "AI logs" };

const VISITOR_LABEL: Record<VisitorType, string> = {
  UNKNOWN: "Not asked",
  RECRUITER: "Recruiter",
  LEARNER: "Learner",
};

export default async function AiLogsPage() {
  const user = await requireRole("SUPER_ADMIN");

  const sessions = await prisma.aiSession.findMany({
    orderBy: { startedAt: "desc" },
    take: 100,
    include: { _count: { select: { messages: true } } },
  });

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <SuperHeader user={user} active="ai-logs" />

      <main className="mx-auto flex w-full max-w-shell flex-grow flex-col gap-5 px-8 py-7">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-2xl font-bold tracking-tight">
            AI conversation logs
          </h1>
          <p className="m-0 text-sm text-brand-muted">
            Every assistant session, readable only by the super admin.
          </p>
        </div>

        <section className="overflow-hidden rounded-card border border-line bg-white shadow-card">
          <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 border-b border-line px-5 py-3 text-xs font-bold uppercase tracking-wider text-brand-muted">
            <div>Session</div>
            <div>Visitor</div>
            <div>Messages</div>
            <div>Started</div>
          </div>
          {sessions.length === 0 ? (
            <p className="m-0 px-5 py-8 text-brand-muted">No sessions yet.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {sessions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/super/ai-logs/${s.id}`}
                    className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-4 border-b border-line px-5 py-3.5 text-sm text-brand-ink no-underline last:border-b-0 hover:bg-surface-canvas"
                  >
                    <span className="truncate font-mono text-[13px]">
                      {s.sessionToken.slice(0, 8)}…
                    </span>
                    <span>
                      <Badge tone={s.visitorType === "UNKNOWN" ? "neutral" : "chip"}>
                        {VISITOR_LABEL[s.visitorType]}
                      </Badge>
                    </span>
                    <span className="tabular-nums">{s._count.messages}</span>
                    <span className="text-[13px] text-brand-muted">
                      {s.startedAt.toLocaleString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
