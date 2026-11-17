"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IMAGE_TYPES, MAX_LENGTH, validateImage, validateMessage } from "@/lib/wall";

type Props = {
  onShare: (body: string, photo: File | null) => Promise<void>;
};

export default function Composer({ onShare }: Props) {
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const textareaId = useId();
  const counterId = useId();

  // Release the preview's object URL when it is replaced or the composer unmounts.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const remaining = MAX_LENGTH - text.trim().length;
  const canShare = !sharing && validateMessage(text, Boolean(photo)) === null;

  function pickPhoto(file: File | undefined) {
    setError(null);
    if (!file) return;
    const problem = validateImage(file);
    if (problem) {
      setError(problem);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function clearPhoto() {
    setPhoto(null);
    setPreview(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function submit(event: { preventDefault(): void }) {
    event.preventDefault();
    const problem = validateMessage(text, Boolean(photo));
    if (problem) {
      setError(problem);
      return;
    }
    setSharing(true);
    setError(null);
    try {
      await onShare(text.trim(), photo);
      setText("");
      clearPhoto();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <form onSubmit={submit} className="border border-[#bdc7d8] bg-white p-2.5">
      <label htmlFor={textareaId} className="sr-only">
        What&apos;s on your mind?
      </label>
      <textarea
        id={textareaId}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && canShare) submit(e);
        }}
        maxLength={MAX_LENGTH}
        rows={3}
        placeholder="What's on your mind?"
        aria-describedby={counterId}
        disabled={sharing}
        className="block w-full resize-y border border-[#bdc7d8] p-2 text-[13px] leading-snug text-[#333] outline-none placeholder:text-[#999] focus:border-[#3b5998] disabled:bg-[#f7f7f7]"
      />

      {preview && (
        <div className="mt-2 flex items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
          <img src={preview} alt="Selected photo" className="max-h-32 max-w-48 border border-[#d8dfea] object-contain" />
          <button
            type="button"
            onClick={clearPhoto}
            disabled={sharing}
            className="text-[11px] text-[#3b5998] hover:underline"
          >
            Remove photo
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-[11px] text-[#dd3c10]">
          {error}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <label className="cursor-pointer text-[11px] font-bold text-[#3b5998] hover:underline">
            <span aria-hidden>📷</span> Photo
            <input
              ref={fileInput}
              type="file"
              accept={IMAGE_TYPES.join(",")}
              className="sr-only"
              disabled={sharing}
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
          </label>
          <span
            id={counterId}
            aria-live="polite"
            className={`text-[11px] tabular-nums ${remaining < 20 ? "font-bold text-[#dd3c10]" : "text-[#999]"}`}
          >
            {remaining} characters left
          </span>
        </div>
        <button
          type="submit"
          disabled={!canShare}
          className="border border-[#29447e] bg-[#5b74a8] px-3 py-[3px] text-[11px] font-bold text-white hover:bg-[#4e69a2] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sharing ? "Sharing…" : "Share"}
        </button>
      </div>
    </form>
  );
}
