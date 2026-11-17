"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PHOTO_BUCKET, supabase } from "./supabase";
import { PAGE_SIZE, POST_COLUMNS, imageExtension, mergePosts, type Post } from "./wall";

export type LiveStatus = "connecting" | "live" | "offline";

const PHOTO_LIMIT = 60;

export function useWall() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [photos, setPhotos] = useState<Post[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [freshIds, setFreshIds] = useState<ReadonlySet<string>>(new Set());
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [live, setLive] = useState<LiveStatus>("connecting");
  const [online, setOnline] = useState(1);
  const [now, setNow] = useState<number | null>(null);
  const knownIds = useRef(new Set<string>());

  /** Adds a new post (from this tab or from Realtime) exactly once. */
  const addPost = useCallback((post: Post) => {
    if (knownIds.current.has(post.id)) return;
    knownIds.current.add(post.id);
    setPosts((current) => mergePosts(current, [post]));
    if (post.image_url) setPhotos((current) => mergePosts(current, [post]).slice(0, PHOTO_LIMIT));
    setTotal((n) => (n === null ? n : n + 1));
    setFreshIds((current) => new Set(current).add(post.id));
    setTimeout(() => {
      setFreshIds((current) => {
        const next = new Set(current);
        next.delete(post.id);
        return next;
      });
    }, 2500);
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;

    const feed = client
      .from("posts")
      .select(POST_COLUMNS, { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    const photoQuery = client
      .from("posts")
      .select(POST_COLUMNS)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(PHOTO_LIMIT);
    const profileQuery = client.from("profile").select("photo_url").eq("id", 1).maybeSingle();

    Promise.all([feed, photoQuery, profileQuery]).then(([feedRes, photoRes, profileRes]) => {
      if (cancelled) return;
      setNow(Date.now());
      if (feedRes.error) {
        setLoadError(feedRes.error.message);
      } else {
        const rows = feedRes.data ?? [];
        rows.forEach((p) => knownIds.current.add(p.id));
        setPosts((current) => mergePosts(current, rows));
        setTotal(feedRes.count ?? rows.length);
        setHasMore((feedRes.count ?? 0) > rows.length);
      }
      if (!photoRes.error) setPhotos(photoRes.data ?? []);
      if (!profileRes.error) setProfilePhoto(profileRes.data?.photo_url ?? null);
      setProfileLoaded(true);
      setLoading(false);
    });

    const presenceKey = crypto.randomUUID();
    const channel = client
      .channel("wall", { config: { presence: { key: presenceKey } } })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload) =>
        addPost(payload.new as Post),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "profile" }, (payload) => {
        const row = payload.new as { photo_url?: string | null } | undefined;
        if (row && "photo_url" in row) setProfilePhoto(row.photo_url ?? null);
      })
      .on("presence", { event: "sync" }, () => {
        setOnline(Math.max(1, Object.keys(channel.presenceState()).length));
      })
      .subscribe((status) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") {
          setLive("live");
          channel.track({ since: new Date().toISOString() });
        } else if (status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
          setLive("offline");
        } else {
          setLive("connecting");
        }
      });

    // Keeps "5 minutes ago" labels fresh.
    const timer = setInterval(() => setNow(Date.now()), 30_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      client.removeChannel(channel);
    };
  }, [addPost]);

  const loadOlder = useCallback(async () => {
    const client = supabase;
    const oldest = posts[posts.length - 1];
    if (!client || !oldest || loadingMore) return;
    setLoadingMore(true);
    const { data, error } = await client
      .from("posts")
      .select(POST_COLUMNS)
      .lt("created_at", oldest.created_at)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    setLoadingMore(false);
    if (error) {
      setLoadError(error.message);
      return;
    }
    const rows = data ?? [];
    rows.forEach((p) => knownIds.current.add(p.id));
    setPosts((current) => mergePosts(current, rows));
    setHasMore(rows.length === PAGE_SIZE);
  }, [posts, loadingMore]);

  const share = useCallback(
    async (name: string, body: string, photo: Blob | null) => {
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
        .insert({ name, body, image_url: imageUrl })
        .select(POST_COLUMNS)
        .single();
      if (error) throw new Error(error.message);
      // Show it right away; the Realtime copy of the same post is ignored.
      setNow(Date.now());
      addPost(data as Post);
    },
    [addPost],
  );

  return {
    configured: supabase !== null,
    posts,
    photos,
    total,
    loading,
    loadError,
    hasMore,
    loadingMore,
    loadOlder,
    freshIds,
    profilePhoto,
    profileLoaded,
    setProfilePhoto,
    live,
    online,
    now,
    share,
  };
}

export type WallState = ReturnType<typeof useWall>;
