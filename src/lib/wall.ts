// Pure helpers for the wall. No Supabase or React here, so they are easy to test.

export const MAX_LENGTH = 280;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB, same limit as the storage bucket
export const FEED_LIMIT = 50;
/** Same list as the storage bucket's allowed_mime_types in supabase/setup.sql. */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export type Post = {
  id: string;
  name: string;
  body: string;
  image_url: string | null;
  created_at: string;
};

/** Returns an error message, or null when the message can be shared. */
export function validateMessage(text: string, hasImage = false): string | null {
  const trimmed = text.trim();
  if (!trimmed && !hasImage) return "Write something first.";
  if (!trimmed) return "Add a few words to go with the photo.";
  if (trimmed.length > MAX_LENGTH) {
    return `Keep it to ${MAX_LENGTH} characters (you have ${trimmed.length}).`;
  }
  return null;
}

/** Returns an error message, or null when the file is an acceptable photo. */
export function validateImage(file: { type: string; size: number }): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Use a JPG, PNG, GIF or WebP photo.";
  if (file.size > MAX_IMAGE_BYTES) return "Photos must be 5 MB or smaller.";
  return null;
}

/** File extension for an uploaded photo, taken from its MIME type. */
export function imageExtension(type: string): string {
  const sub = type.split("/")[1]?.toLowerCase() ?? "";
  if (sub === "jpeg") return "jpg";
  if (sub === "svg+xml") return "svg";
  return /^[a-z0-9]+$/.test(sub) ? sub : "img";
}

/** Adds posts to the feed without duplicates, newest first, capped at FEED_LIMIT. */
export function mergePosts(current: Post[], incoming: Post[]): Post[] {
  const byId = new Map<string, Post>();
  for (const post of [...current, ...incoming]) byId.set(post.id, post);
  return [...byId.values()]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, FEED_LIMIT);
}

/** "just now", "5 minutes ago", "yesterday", or a date for anything older than a week. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(then).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
