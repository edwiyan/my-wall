"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { updateProfilePhoto } from "@/app/actions";
import { resizeImage } from "@/lib/image";
import { validateImage } from "@/lib/wall";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (url: string) => void;
};

/** Owner-only: pick a new profile picture, enter the passcode, save. Checked on the server. */
export default function ProfilePhotoDialog({ open, onClose, onSaved }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [passcode, setPasscode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const passId = useId();
  const titleId = useId();

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function choose(next: File | undefined) {
    setError(null);
    if (!next) return;
    const problem = validateImage(next);
    if (problem) return setError(problem);
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setError(null);
    setSaving(false);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!file) return setError("Choose a photo first.");
    if (!passcode) return setError("Enter your passcode.");
    setSaving(true);
    setError(null);
    try {
      const square = await resizeImage(file, { max: 400, square: true, quality: 0.9 });
      const form = new FormData();
      form.set("passcode", passcode);
      form.set("photo", new File([square], "profile.jpg", { type: square.type || "image/jpeg" }));
      const result = await updateProfilePhoto(form);
      if (!result.ok) {
        setError(result.error);
        setSaving(false);
        return;
      }
      onSaved(result.url);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Try again.");
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={() => {
        reset();
        onClose();
      }}
      className="m-auto w-[min(420px,calc(100vw-32px))] border border-[#29447e] bg-white p-0 shadow-2xl backdrop:bg-[#0b1a3a]/55"
    >
      <form onSubmit={save}>
        <h2 id={titleId} className="bg-[#6d84b4] px-3 py-2 text-[14px] font-bold text-white">
          Change profile picture
        </h2>
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-4">
            <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden border border-[#d8dfea] bg-[#eef1f6]">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                <img src={preview} alt="New profile picture preview" className="size-full object-cover" />
              ) : (
                <span className="px-2 text-center text-[11px] text-[#999]">No photo chosen</span>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="inline-block cursor-pointer border border-[#bdc7d8] bg-[#f7f8fb] px-3 py-1 text-[11px] font-bold text-[#333] hover:bg-[#eef1f6]">
                Choose photo…
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => choose(e.target.files?.[0])}
                />
              </label>
              <p className="text-[11px] leading-snug text-[#777]">
                It&apos;s cropped to a square and resized to 400×400 before upload.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor={passId} className="block text-[11px] font-bold text-[#555]">
              Owner passcode
            </label>
            <input
              id={passId}
              type="password"
              autoComplete="current-password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="mt-1 w-full border border-[#bdc7d8] px-2 py-1.5 text-[13px] outline-none focus:border-[#6d84b4]"
            />
            <p className="mt-1 text-[11px] text-[#999]">Only the wall owner can change this picture.</p>
          </div>

          {error && (
            <p role="alert" className="border border-[#dd3c10] bg-[#ffebe8] px-2 py-1.5 text-[11px] text-[#333]">
              {error}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-[#e5e9f2] bg-[#f2f2f2] px-4 py-2.5">
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="border border-[#999] bg-[#f7f7f7] px-3 py-1 text-[11px] font-bold text-[#333] hover:bg-[#eee]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !file}
            className="border border-[#29447e] bg-[#5b74a8] px-3 py-1 text-[11px] font-bold text-white hover:bg-[#4e69a2] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save picture"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
