"use client";

import { useEffect, useRef } from "react";
import { fullDate, type Post } from "@/lib/wall";

type Props = {
  photos: Post[];
  index: number | null;
  onChange: (index: number | null) => void;
};

/** Full-size photo viewer. Arrow keys move between photos; Esc or a click outside closes it. */
export default function Lightbox({ photos, index, onChange }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const post = index === null ? null : photos[index];

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (post && !el.open) el.showModal();
    if (!post && el.open) el.close();
  }, [post]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && index < photos.length - 1) onChange(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onChange(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onChange]);

  return (
    <dialog
      ref={dialog}
      onClose={() => onChange(null)}
      onClick={(e) => e.target === dialog.current && onChange(null)}
      className="m-auto max-h-[92vh] max-w-[min(960px,94vw)] overflow-visible bg-transparent p-0 backdrop:bg-black/80"
      aria-label="Photo viewer"
    >
      {post && index !== null && (
        <figure className="flex flex-col bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- user photo from Supabase Storage */}
          <img
            src={post.image_url ?? ""}
            alt={`Photo shared by ${post.name}`}
            className="max-h-[78vh] w-auto max-w-full self-center bg-[#111] object-contain"
          />
          <figcaption className="flex items-start justify-between gap-4 border-t border-[#d8dfea] p-3">
            <div className="min-w-0">
              <p className="break-words">
                <span className="font-bold text-[#3b5998]">{post.name}</span> {post.body}
              </p>
              <p className="mt-1 text-[11px] text-[#999]">
                {fullDate(post.created_at)} · Photo {index + 1} of {photos.length}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                className="lb-btn"
                onClick={() => onChange(index - 1)}
                disabled={index === 0}
                aria-label="Previous photo"
              >
                ‹
              </button>
              <button
                type="button"
                className="lb-btn"
                onClick={() => onChange(index + 1)}
                disabled={index === photos.length - 1}
                aria-label="Next photo"
              >
                ›
              </button>
              <button type="button" className="lb-btn" onClick={() => onChange(null)} aria-label="Close">
                ✕
              </button>
            </div>
          </figcaption>
        </figure>
      )}
    </dialog>
  );
}
