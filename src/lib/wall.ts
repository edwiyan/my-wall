// Pure helpers for the wall. No Supabase or React here, so they are easy to test.

export const MAX_LENGTH = 280;
export const MAX_NAME_LENGTH = 40;
export const DEFAULT_NAME = "Guest";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB, same limit as the post-images bucket
export const PAGE_SIZE = 20;
/** Same list as the post-images bucket's allowed_mime_types in supabase/setup.sql. */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export type Post = {
  id: string;
  name: string;
  body: string;
  image_url: string | null;
  created_at: string;
};

export const POST_COLUMNS = "id, name, body, image_url, created_at";

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

/** The name a post is shared under: what the visitor typed, or "Guest". */
export function displayName(typed: string): string {
  const clean = typed.replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
  return clean || DEFAULT_NAME;
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
  return /^[a-z0-9]+$/.test(sub) ? sub : "img";
}

/** Adds posts to the feed without duplicates, newest first. */
export function mergePosts(current: Post[], incoming: Post[]): Post[] {
  const byId = new Map<string, Post>();
  for (const post of [...current, ...incoming]) byId.set(post.id, post);
  return [...byId.values()].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

/** Up to two initials for an avatar: "Edrian Reyes" → "ER", "guest" → "G". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const letters = words.length === 1 ? [words[0][0]] : [words[0][0], words[words.length - 1][0]];
  return letters.join("").toUpperCase();
}

const AVATAR_COLORS = ["#6d84b4", "#4c9a6a", "#c0703d", "#8a63b8", "#3d8fb0", "#b0506a", "#7a8a3d"];

/** A stable colour per name, so the same visitor always gets the same avatar. */
export function avatarColor(name: string): string {
  let hash = 0;
  for (const ch of name.trim().toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** "1 person here now" / "3 people here now". */
export function presenceLabel(count: number): string {
  return count === 1 ? "1 person here now" : `${count} people here now`;
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
  return new Date(then).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** Full timestamp for hover text, e.g. "Tuesday, November 17, 2026 at 8:42 PM". */
export function fullDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });
}
