"use server";

import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 900 * 1024; // the browser shrinks it to 400×400 first, so this is generous
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type ProfilePhotoResult = { ok: true; url: string } | { ok: false; error: string };

function samePasscode(given: string, expected: string): boolean {
  // Hash both so the comparison is constant-time regardless of length.
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Replaces the wall owner's profile picture. Anyone can call a Server Action, so the
 * passcode is checked here on the server; the secret key never reaches the browser.
 */
export async function updateProfilePhoto(formData: FormData): Promise<ProfilePhotoResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const ownerPasscode = process.env.OWNER_PASSCODE;
  if (!url || !secretKey || !ownerPasscode || ownerPasscode.length < 6) {
    return {
      ok: false,
      error: "Profile picture uploads aren't set up. Add SUPABASE_SECRET_KEY and OWNER_PASSCODE (6+ characters).",
    };
  }

  const passcode = formData.get("passcode");
  if (typeof passcode !== "string" || !samePasscode(passcode, ownerPasscode)) {
    await sleep(1000); // slows down guessing
    return { ok: false, error: "Wrong passcode." };
  }

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return { ok: false, error: "Choose a photo first." };
  if (!AVATAR_TYPES.includes(photo.type)) return { ok: false, error: "Use a JPG, PNG or WebP photo." };
  if (photo.size > MAX_AVATAR_BYTES) return { ok: false, error: "That photo is too large." };

  const admin = createClient(url, secretKey, { auth: { persistSession: false } });
  const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
  const path = `profile-${randomUUID()}.${ext}`;

  const upload = await admin.storage.from(AVATAR_BUCKET).upload(path, photo, { contentType: photo.type });
  if (upload.error) return { ok: false, error: `Upload failed: ${upload.error.message}` };

  const publicUrl = admin.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await admin
    .from("profile")
    .upsert({ id: 1, photo_url: publicUrl, updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: `Couldn't save the profile: ${error.message}` };

  return { ok: true, url: publicUrl };
}
