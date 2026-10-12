"use client";

import { useActionState, useRef, useTransition } from "react";
import { uploadPhotoAction, removePhotoAction, type FormState } from "./actions";
import { Avatar } from "@/components/ui/Avatar";

const initial: FormState = {};

export function PhotoUpload({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    uploadPhotoAction,
    initial,
  );
  const [removing, startRemove] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-[22px] flex items-center gap-5">
      <Avatar name={name} photoUrl={photoUrl} size={72} />
      <div className="flex flex-col gap-2">
        <div className="font-semibold">Profile photo</div>
        <form ref={formRef} action={formAction}>
          <input
            ref={fileRef}
            type="file"
            name="photo"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={() => {
              if (fileRef.current?.files?.length) formRef.current?.requestSubmit();
            }}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={pending}
              className="h-[38px] w-fit rounded-field border border-line-input bg-white px-4 font-semibold text-brand-ink disabled:opacity-50"
            >
              {pending ? "Uploading…" : photoUrl ? "Change photo" : "Upload photo"}
            </button>
            {photoUrl && (
              <button
                type="button"
                disabled={removing || pending}
                onClick={() => startRemove(async () => void (await removePhotoAction()))}
                className="text-[13px] font-semibold text-state-sentback disabled:opacity-60"
              >
                {removing ? "Removing…" : "Remove"}
              </button>
            )}
          </div>
        </form>
        {state.error && (
          <div role="alert" className="text-[13px] font-medium text-state-sentback">
            {state.error}
          </div>
        )}
        <div className="text-[13px] text-brand-muted">
          PNG or JPG, up to 10 MB. A square photo works best.
        </div>
      </div>
    </div>
  );
}
