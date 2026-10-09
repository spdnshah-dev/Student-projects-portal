import type { Metadata } from "next";
import { StudentHeader } from "@/components/student/StudentHeader";
import { Badge } from "@/components/ui/Badge";
import { requireRole } from "@/lib/auth/session";
import { ConsentForm } from "./ConsentForm";

export const metadata: Metadata = { title: "Consent" };

export default async function ConsentPage() {
  const user = await requireRole("STUDENT");

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <StudentHeader user={user} />

      <main className="flex flex-grow flex-col items-center px-5 py-7 sm:px-10">
        <div className="w-full max-w-[620px] rounded-2xl border border-line bg-white p-8 shadow-[0_1px_2px_rgba(16,24,43,0.05),0_16px_40px_rgba(16,24,43,0.08)]">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <h1 className="m-0 text-[23px] font-bold leading-tight tracking-tight">
                Before your profile goes public
              </h1>
              <Badge tone="draft">Draft</Badge>
            </div>
            <p className="m-0 text-sm text-brand-muted text-pretty">
              Please read and agree before we set up your profile. Learnbay will
              replace this with its final, legally reviewed consent form before
              the product goes live.
            </p>
          </div>

          <div className="my-5 flex max-h-[300px] flex-col gap-3.5 overflow-y-auto rounded-xl border border-line bg-surface-canvas p-5 leading-relaxed text-brand-ink-soft">
            <div className="text-xs font-bold uppercase tracking-wider text-[#8A5A00]">
              Placeholder text
            </div>
            <p className="m-0 text-pretty">
              By continuing, you agree that Learnbay may show the following on
              your public Learnbay Projects profile, which anyone on the
              internet can see:
            </p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 pl-1">
              <li className="flex gap-2.5">
                <span className="font-bold text-brand-accent">•</span>
                <span>
                  Your name, photo, years of experience, domain and the course
                  you completed.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="font-bold text-brand-accent">•</span>
                <span>Your certificates and the live project links you add.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="font-bold text-brand-accent">•</span>
                <span>
                  The text of your profile and projects, which the AI assistant
                  reads to answer visitors&apos; questions.
                </span>
              </li>
            </ul>
            <p className="m-0 text-pretty">
              You confirm that the projects and files you share are your own work
              and that you are allowed to share them.
            </p>
            <p className="m-0 text-pretty">
              You can edit or hide your profile and projects at any time, and you
              can ask Learnbay to delete your data. The full privacy policy and
              the final consent terms will be linked here before launch.
            </p>
          </div>

          <ConsentForm />
        </div>

        <p className="mt-3.5 text-center text-[13px] text-brand-muted">
          Draft consent form · final wording will be added before launch.
        </p>
      </main>
    </div>
  );
}
