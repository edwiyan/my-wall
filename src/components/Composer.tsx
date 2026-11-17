"use client";

import { useEffect, useId, useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { imageFromTransfer, resizeImage } from "@/lib/image";
import {
  IMAGE_TYPES,
  MAX_LENGTH,
  MAX_NAME_LENGTH,
  displayName,
  validateImage,
  validateMessage,
} from "@/lib/wall";
import Avatar from "./Avatar";

type Props = {
  profilePhoto: string | null;
  onShare: (name: string, body: string, photo: Blob | null) => Promise<void>;
};

const NAME_KEY = "wall:name";

export default function Composer({ profilePhoto, onShare }: Props) {
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const textareaId = useId();
  const nameId = useId();
  const counterId = useId();

  // Remember the visitor's name between visits (a convenience only; it's fine if storage is blocked).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of browser storage after mount
      if (saved) setName(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const used = text.trim().length;
  const remaining = MAX_LENGTH - used;
  const canShare = !sharing && validateMessage(text, Boolean(photo)) === null;
  const author = displayName(name);

  function pickPhoto(file: File | null | undefined) {
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

  async function submit(event?: { preventDefault(): void }) {
    event?.preventDefault();
    const problem = validateMessage(text, Boolean(photo));
    if (problem) {
      setError(problem);
      return;
    }
    setSharing(true);
    setError(null);
    try {
      const upload = photo ? await resizeImage(photo, { max: 1600 }) : null;
      await onShare(author, text.trim(), upload);
      try {
        localStorage.setItem(NAME_KEY, name.trim());
      } catch {}
      setText("");
      clearPhoto();
      textarea.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSharing(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (!sharing) pickPhoto(imageFromTransfer(e.dataTransfer));
  }

  function onPaste(e: ClipboardEvent) {
    const file = imageFromTransfer(e.clipboardData);
    if (file && !sharing) {
      e.preventDefault();
      pickPhoto(file);
    }
  }

  return (
    <form
      onSubmit={submit}
      onDragOver={(e) => {
        e.preventDefault();
        if (!dragging) setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={onDrop}
      className={`relative border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-colors ${
        dragging ? "border-[#3b5998] bg-[#f5f7fb]" : "border-[#bdc7d8]"
      }`}
    >
      <div className="flex gap-3 p-3">
        <div className="hidden sm:block">
          <Avatar name={author} profilePhoto={profilePhoto} size={40} />
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor={textareaId} className="sr-only">
            What&apos;s on your mind?
          </label>
          <textarea
            id={textareaId}
            ref={textarea}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(null);
            }}
            onPaste={onPaste}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && canShare) submit(e);
            }}
            maxLength={MAX_LENGTH}
            rows={3}
            placeholder="What's on your mind?"
            aria-describedby={counterId}
            disabled={sharing}
            className="block min-h-[72px] w-full resize-y border border-[#d8dfea] bg-white p-2 text-[13px] leading-snug text-[#333] outline-none transition placeholder:text-[#9aa3b5] focus:border-[#6d84b4] focus:shadow-[0_0_0_3px_rgba(59,89,152,0.12)] disabled:bg-[#f7f7f7]"
          />

          {preview && (
            <div className="mt-2 inline-flex items-start gap-2 border border-[#d8dfea] bg-[#f7f8fb] p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img src={preview} alt="Selected photo" className="max-h-28 max-w-44 object-contain" />
              <button
                type="button"
                onClick={clearPhoto}
                disabled={sharing}
                aria-label="Remove photo"
                className="px-1 text-[13px] leading-none text-[#777] hover:text-[#dd3c10]"
              >
                ✕
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-2 text-[11px] text-[#dd3c10]">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e5e9f2] bg-[#f7f8fb] px-3 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          <label className="flex cursor-pointer items-center gap-1 text-[11px] font-bold text-[#3b5998] hover:underline">
            <CameraIcon />
            Add photo
            <input
              ref={fileInput}
              type="file"
              accept={IMAGE_TYPES.join(",")}
              className="sr-only"
              disabled={sharing}
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
          </label>
          <span className="flex items-center gap-1 text-[11px] text-[#777]">
            <label htmlFor={nameId}>Posting as</label>
            <input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_NAME_LENGTH}
              placeholder="Guest"
              disabled={sharing}
              className="w-32 border border-transparent bg-transparent px-1 py-0.5 text-[11px] font-bold text-[#333] outline-none placeholder:font-normal placeholder:text-[#999] hover:border-[#d8dfea] focus:border-[#6d84b4] focus:bg-white"
            />
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <CharRing used={used} remaining={remaining} id={counterId} />
          <button
            type="submit"
            disabled={!canShare}
            className="border border-[#29447e] bg-gradient-to-b from-[#6d84b4] to-[#5b74a8] px-4 py-1 text-[11px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] hover:from-[#627aad] hover:to-[#4e69a2] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sharing ? "Sharing…" : "Share"}
          </button>
        </div>
      </div>

      {dragging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center border-2 border-dashed border-[#3b5998] bg-[#eef1f8]/90 text-[13px] font-bold text-[#3b5998]">
          Drop a photo to add it
        </div>
      )}
    </form>
  );
}

/** Circular character counter: fills as you type, turns orange near the limit, red at it. */
function CharRing({ used, remaining, id }: { used: number; remaining: number; id: string }) {
  const r = 9;
  const circumference = 2 * Math.PI * r;
  const ratio = Math.min(1, used / MAX_LENGTH);
  const color = remaining <= 0 ? "#dd3c10" : remaining < 20 ? "#e8a33d" : "#3b5998";
  return (
    <span className="flex items-center gap-1.5" title={`${remaining} characters left`}>
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden className="-rotate-90">
        <circle cx="11" cy="11" r={r} fill="none" stroke="#dde3ee" strokeWidth="2.5" />
        <circle
          cx="11"
          cy="11"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          className="transition-[stroke-dashoffset,stroke] duration-200"
        />
      </svg>
      <span
        id={id}
        aria-live="polite"
        className={`min-w-[3.2em] text-[11px] tabular-nums ${remaining < 20 ? "font-bold" : ""}`}
        style={{ color: remaining < 20 ? color : "#999" }}
      >
        {remaining} left
      </span>
    </span>
  );
}

function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9 3 7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9Zm3 4.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  );
}
