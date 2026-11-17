import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const PHOTO_BUCKET = "post-images";

/** Null when the two environment variables are missing (see README, step 2). */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
