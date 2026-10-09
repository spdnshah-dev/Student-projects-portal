"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  addCertificateAction,
  removeCertificateAction,
  type FormState,
} from "./actions";

type Cert = {
  id: string;
  name: string;
  issuer: string | null;
  fileKey: string | null;
};

const initial: FormState = {};

const fieldCls =
  "h-[42px] w-full rounded-[10px] border border-line-input bg-white px-3.5 text-sm text-brand-ink";

export function CertificateManager({ certificates }: { certificates: Cert[] }) {
  const [state, formAction, pending] = useActionState(
    addCertificateAction,
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [removing, startRemove] = useTransition();
  const [removeError, setRemoveError] = useState<string | null>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  function remove(id: string) {
    setRemoveError(null);
    startRemove(async () => {
      const res = await removeCertificateAction(id);
      if (res.error) setRemoveError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-7 shadow-card">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-base font-bold">
          Certificates{" "}
          <span className="text-sm font-normal text-brand-muted">(optional)</span>
        </h2>
        <p className="m-0 text-sm text-brand-muted">
          PDF, PNG or JPG, up to 10 MB. Shown on your profile only after an admin
          approves it.
        </p>
      </div>

      {certificates.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {certificates.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-[10px] border border-line px-3 py-2.5"
            >
              <div className="flex min-w-0 flex-grow flex-col">
                <span className="truncate font-semibold">{c.name}</span>
                {c.issuer && (
                  <span className="truncate text-[13px] text-brand-muted">
                    {c.issuer}
                  </span>
                )}
              </div>
              {c.fileKey && (
                <a
                  href={c.fileKey}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-semibold text-brand-accent no-underline"
                >
                  View
                </a>
              )}
              <button
                type="button"
                onClick={() => remove(c.id)}
                disabled={removing}
                className="text-[13px] font-semibold text-brand-muted disabled:opacity-60"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {removeError && (
        <div role="alert" className="text-[13px] font-medium text-state-sentback">
          {removeError}
        </div>
      )}

      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col gap-3 rounded-xl border border-line bg-surface-canvas p-4"
      >
        <div className="font-bold">Add a certificate</div>
        {state.error && (
          <div role="alert" className="text-[13px] font-medium text-state-sentback">
            {state.error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cert-name" className="font-semibold">
              Certificate name
            </label>
            <input
              id="cert-name"
              name="name"
              type="text"
              required
              placeholder="For example, Data Science Program"
              className={fieldCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cert-issuer" className="font-semibold">
              Issued by
            </label>
            <input
              id="cert-issuer"
              name="issuer"
              type="text"
              placeholder="For example, Learnbay"
              className={fieldCls}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cert-file" className="font-semibold">
            Certificate file
          </label>
          <input
            id="cert-file"
            name="file"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            required
            className="text-sm file:mr-3 file:rounded-field file:border file:border-line-input file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-[38px] w-fit rounded-[19px] border-[1.5px] border-brand-accent bg-white px-[18px] font-semibold text-brand-accent disabled:opacity-60"
        >
          {pending ? "Uploading…" : "Add certificate"}
        </button>
      </form>
    </div>
  );
}
