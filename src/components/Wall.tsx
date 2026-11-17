"use client";

import { useCallback, useEffect, useState } from "react";
import { PHOTO_BUCKET, supabase } from "@/lib/supabase";
import { profile } from "@/lib/profile";
import { FEED_LIMIT, imageExtension, mergePosts, type Post } from "@/lib/wall";
import Composer from "./Composer";
import PostItem from "./PostItem";

type LiveStatus = "connecting" | "live" | "offline";

export default function Wall() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [live, setLive] = useState<LiveStatus>("connecting");
  const [now, setNow] = useState<number | null>(null);

  // Initial load + realtime subscription for new posts.
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;

    client
      .from("posts")
      .select("id, name, body, image_url, created_at")
      .order("created_at", { ascending: false })
      .limit(FEED_LIMIT)
      .then(({ data, error }) => {
        if (cancelled) return;
        setNow(Date.now());
        if (error) setLoadError(error.message);
        else setPosts((current) => mergePosts(current, data ?? []));
        setLoading(false);
      });

    const channel = client
      .channel("wall-posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => setPosts((current) => mergePosts(current, [payload.new as Post])),
      )
      .subscribe((status) => {
        if (cancelled) return;
        setLive(status === "SUBSCRIBED" ? "live" : status === "TIMED_OUT" || status === "CHANNEL_ERROR" ? "offline" : "connecting");
      });

    return () => {
      cancelled = true;
      client.removeChannel(channel);
    };
  }, []);

  // Keeps "5 minutes ago" labels fresh. `now` is first set when posts load (after mount),
  // so the server-rendered HTML never contains a time and hydration always matches.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const share = useCallback(async (body: string, photo: File | null) => {
    const client = supabase;
    if (!client) throw new Error("Supabase isn't configured.");

    let imageUrl: string | null = null;
    if (photo) {
      const path = `${crypto.randomUUID()}.${imageExtension(photo.type)}`;
      const upload = await client.storage
        .from(PHOTO_BUCKET)
        .upload(path, photo, { contentType: photo.type, upsert: false });
      if (upload.error) throw new Error(`Photo upload failed: ${upload.error.message}`);
      imageUrl = client.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
    }

    const { data, error } = await client
      .from("posts")
      .insert({ name: profile.name, body, image_url: imageUrl })
      .select("id, name, body, image_url, created_at")
      .single();
    if (error) throw new Error(error.message);
    // Show it right away; the realtime event for the same id is ignored by mergePosts.
    setPosts((current) => mergePosts(current, [data as Post]));
  }, []);

  if (!supabase) return <SetupNotice />;

  return (
    <section aria-labelledby="wall-heading">
      <Composer onShare={share} />

      <div className="mt-4 flex items-center justify-between border-b border-[#d8dfea] pb-1">
        <h2 id="wall-heading" className="text-[13px] font-bold text-[#333]">
          Wall
        </h2>
        <LiveBadge status={live} />
      </div>

      {loading ? (
        <p className="py-6 text-center text-[#777]">Loading posts…</p>
      ) : loadError ? (
        <p role="alert" className="mt-3 border border-[#dd3c10] bg-[#ffebe8] p-3 text-[#333]">
          Couldn&apos;t load the wall: {loadError}
        </p>
      ) : posts.length === 0 ? (
        <p className="py-6 text-center text-[#777]">No posts yet. Be the first to write on the wall.</p>
      ) : (
        <ul aria-live="polite">
          {posts.map((post) => (
            <PostItem key={post.id} post={post} now={now} />
          ))}
        </ul>
      )}
    </section>
  );
}

function LiveBadge({ status }: { status: LiveStatus }) {
  const label = status === "live" ? "Live" : status === "offline" ? "Offline" : "Connecting…";
  const dot = status === "live" ? "bg-[#42b72a]" : status === "offline" ? "bg-[#dd3c10]" : "bg-[#bbb]";
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-[#777]" title="New posts appear without refreshing">
      <span className={`inline-block size-2 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}

function SetupNotice() {
  return (
    <div role="alert" className="border border-[#e2c822] bg-[#fff9d7] p-4 leading-relaxed text-[#333]">
      <p className="font-bold">Supabase isn&apos;t connected yet.</p>
      <p className="mt-1">
        Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
        <code>.env.local</code> (or to the Vercel project&apos;s environment variables), then restart. See the
        README for the full setup.
      </p>
    </div>
  );
}
