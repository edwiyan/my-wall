"use client";

import { useCallback, useState, type ReactNode } from "react";
import { profile } from "@/lib/profile";
import { useWall, type LiveStatus } from "@/lib/useWall";
import { presenceLabel, type Post } from "@/lib/wall";
import Composer from "./Composer";
import Lightbox from "./Lightbox";
import PostItem, { PostSkeleton } from "./PostItem";
import ProfilePhotoDialog from "./ProfilePhotoDialog";
import Sidebar from "./Sidebar";

type Tab = "wall" | "info" | "photos";
const TABS: { id: Tab; label: string }[] = [
  { id: "wall", label: "Wall" },
  { id: "info", label: "Info" },
  { id: "photos", label: "Photos" },
];

export default function WallApp() {
  const wall = useWall();
  const [tab, setTab] = useState<Tab>("wall");
  const [photoDialog, setPhotoDialog] = useState(false);
  const [viewer, setViewer] = useState<{ list: Post[]; index: number } | null>(null);

  const openFromPhotos = useCallback((index: number) => setViewer({ list: wall.photos, index }), [wall.photos]);
  const openPost = useCallback(
    (post: Post) => {
      const index = wall.photos.findIndex((p) => p.id === post.id);
      setViewer(index >= 0 ? { list: wall.photos, index } : { list: [post], index: 0 });
    },
    [wall.photos],
  );
  const changeViewer = useCallback(
    (index: number | null) => setViewer((v) => (v && index !== null ? { ...v, index } : null)),
    [],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-[#133783] bg-gradient-to-b from-[#4a66a6] to-[#3b5998] shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
        <div className="mx-auto flex h-11 max-w-[980px] items-center justify-between gap-3 px-4">
          <a href="#" className="flex items-baseline gap-2 text-white" aria-label="Wall home">
            <span className="text-[22px] font-bold tracking-[-0.04em] [text-shadow:0_1px_0_rgba(0,0,0,0.2)]">wall</span>
            <span className="hidden text-[11px] text-[#c3cde4] sm:inline">est. 2008, rebuilt in Next.js</span>
          </a>
          {wall.configured && <LiveBadge status={wall.live} online={wall.online} />}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[980px] flex-1 px-4 py-5">
        {!wall.configured ? (
          <SetupNotice />
        ) : (
          <div className="flex flex-col gap-5 border border-[#d8dfea] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] md:flex-row md:p-5">
            <Sidebar
              profilePhoto={wall.profilePhoto}
              profileLoaded={wall.profileLoaded}
              photos={wall.photos}
              total={wall.total}
              onChangePhoto={() => setPhotoDialog(true)}
              onOpenPhoto={openFromPhotos}
              onShowPhotos={() => setTab("photos")}
            />

            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                <div>
                  <h1 className="text-[20px] leading-tight font-bold text-[#333]">{profile.name}</h1>
                  <p className="hidden text-[12px] text-[#777] md:block">
                    {profile.headline} · {profile.location}
                  </p>
                </div>
              </div>

              <nav role="tablist" aria-label="Profile sections" className="flex gap-1 border-b border-[#899bc1]">
                {TABS.map((t) => {
                  const count = t.id === "photos" ? wall.photos.length : t.id === "wall" ? wall.total : null;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      id={`tab-${t.id}`}
                      aria-selected={tab === t.id}
                      aria-controls={`panel-${t.id}`}
                      onClick={() => setTab(t.id)}
                      className={`-mb-px border px-3 py-1.5 text-[12px] font-bold transition-colors ${
                        tab === t.id
                          ? "border-[#899bc1] border-b-white bg-white text-[#333]"
                          : "border-transparent bg-[#d8dfea] text-[#3b5998] hover:bg-[#cbd4e5]"
                      }`}
                    >
                      {t.label}
                      {count ? <span className="ml-1 font-normal text-[#8b98b5]">{count}</span> : null}
                    </button>
                  );
                })}
              </nav>

              <div className="pt-4">
                {tab === "wall" && (
                  <section role="tabpanel" id="panel-wall" aria-labelledby="tab-wall">
                    <Composer profilePhoto={wall.profilePhoto} onShare={wall.share} />
                    <h2 className="mt-5 border-b border-[#d8dfea] pb-1 text-[12px] font-bold text-[#333]">
                      Recent posts
                    </h2>
                    <Feed wall={wall} onOpenPhoto={openPost} />
                  </section>
                )}
                {tab === "info" && <InfoPanel />}
                {tab === "photos" && <PhotosPanel photos={wall.photos} onOpen={openFromPhotos} />}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mx-auto w-full max-w-[980px] px-4 pb-6 text-[11px] text-[#8b98b5]">
        <div className="flex flex-wrap justify-between gap-2 border-t border-[#d8dfea] pt-3">
          <span>Built with Next.js, React, Tailwind CSS and Supabase (Postgres, Realtime, Storage)</span>
          <span>
            {profile.links.map((l, i) => (
              <span key={l.href}>
                {i > 0 && " · "}
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-[#3b5998] hover:underline">
                  {l.label}
                </a>
              </span>
            ))}
          </span>
        </div>
      </footer>

      <ProfilePhotoDialog open={photoDialog} onClose={() => setPhotoDialog(false)} onSaved={wall.setProfilePhoto} />
      <Lightbox photos={viewer?.list ?? []} index={viewer?.index ?? null} onChange={changeViewer} />
    </div>
  );
}

function Feed({ wall, onOpenPhoto }: { wall: ReturnType<typeof useWall>; onOpenPhoto: (post: Post) => void }) {
  if (wall.loading) {
    return (
      <ul aria-label="Loading posts">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </ul>
    );
  }
  if (wall.loadError && wall.posts.length === 0) {
    return (
      <p role="alert" className="mt-3 border border-[#dd3c10] bg-[#ffebe8] p-3 text-[#333]">
        Couldn&apos;t load the wall: {wall.loadError}
      </p>
    );
  }
  if (wall.posts.length === 0) {
    return (
      <div className="py-10 text-center text-[#777]">
        <p className="text-[28px]" aria-hidden>
          ✍️
        </p>
        <p className="mt-1 font-bold text-[#555]">The wall is empty</p>
        <p className="text-[12px]">Be the first to write something.</p>
      </div>
    );
  }
  return (
    <>
      <ul aria-live="polite" aria-label="Posts">
        {wall.posts.map((post) => (
          <PostItem
            key={post.id}
            post={post}
            now={wall.now}
            fresh={wall.freshIds.has(post.id)}
            profilePhoto={wall.profilePhoto}
            onOpenPhoto={onOpenPhoto}
          />
        ))}
      </ul>
      {wall.hasMore && (
        <button
          type="button"
          onClick={wall.loadOlder}
          disabled={wall.loadingMore}
          className="mt-3 w-full border border-[#d8dfea] bg-[#eceff5] py-2 text-[11px] font-bold text-[#3b5998] hover:bg-[#e2e7f1] disabled:opacity-60"
        >
          {wall.loadingMore ? "Loading…" : "Older posts"}
        </button>
      )}
    </>
  );
}

function InfoPanel() {
  return (
    <section role="tabpanel" id="panel-info" aria-labelledby="tab-info" className="space-y-4">
      <InfoBlock title="About">
        <p className="leading-relaxed text-[#333]">{profile.about}</p>
      </InfoBlock>
      <InfoBlock title="Basic information">
        <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5">
          <dt className="text-[#777]">Headline</dt>
          <dd>{profile.headline}</dd>
          <dt className="text-[#777]">Location</dt>
          <dd>{profile.location}</dd>
          <dt className="text-[#777]">Looking for</dt>
          <dd>{profile.lookingFor}</dd>
          <dt className="text-[#777]">Education</dt>
          <dd>
            {profile.education.degree}, {profile.education.school} ({profile.education.years})
          </dd>
        </dl>
      </InfoBlock>
      <InfoBlock title="Skills">
        <ul className="flex flex-wrap gap-1.5">
          {profile.skills.map((s) => (
            <li key={s} className="border border-[#d8dfea] bg-[#eceff5] px-2 py-0.5 text-[11px] text-[#3b5998]">
              {s}
            </li>
          ))}
        </ul>
      </InfoBlock>
      <InfoBlock title="Links">
        <ul className="space-y-1">
          {profile.links.map((l) => (
            <li key={l.href}>
              <span className="inline-block w-[110px] text-[#777]">{l.label}</span>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="break-all text-[#3b5998] hover:underline">
                {l.href.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            </li>
          ))}
        </ul>
      </InfoBlock>
    </section>
  );
}

function InfoBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 border-b border-[#d8dfea] bg-[#eceff5] px-2 py-1 text-[11px] font-bold text-[#333]">{title}</h2>
      <div className="px-2">{children}</div>
    </div>
  );
}

function PhotosPanel({ photos, onOpen }: { photos: Post[]; onOpen: (index: number) => void }) {
  return (
    <section role="tabpanel" id="panel-photos" aria-labelledby="tab-photos">
      {photos.length === 0 ? (
        <p className="py-10 text-center text-[#777]">No photos yet. Add one to a post on the Wall tab.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((post, i) => (
            <li key={post.id}>
              <button
                type="button"
                onClick={() => onOpen(i)}
                className="group block aspect-square w-full cursor-zoom-in overflow-hidden border border-[#d8dfea] bg-[#eef1f6]"
                aria-label={`Open photo shared by ${post.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- user photo from Supabase Storage */}
                <img
                  src={post.image_url ?? ""}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition duration-300 group-hover:scale-105"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LiveBadge({ status, online }: { status: LiveStatus; online: number }) {
  const dot = status === "live" ? "bg-[#5fd068]" : status === "offline" ? "bg-[#f0705a]" : "bg-[#c3cde4]";
  const label = status === "live" ? "Live" : status === "offline" ? "Offline" : "Connecting…";
  return (
    <span
      className="flex items-center gap-2 rounded-full bg-black/15 px-2.5 py-1 text-[11px] text-white"
      title="New posts appear without refreshing"
    >
      <span className="relative flex size-2">
        {status === "live" && <span className={`absolute inset-0 animate-ping rounded-full ${dot} opacity-60`} />}
        <span className={`relative inline-block size-2 rounded-full ${dot}`} />
      </span>
      <span className="font-bold">{label}</span>
      {status === "live" && <span className="text-[#dbe2f1]">· {presenceLabel(online)}</span>}
    </span>
  );
}

function SetupNotice() {
  return (
    <div role="alert" className="border border-[#e2c822] bg-[#fff9d7] p-4 leading-relaxed text-[#333]">
      <p className="font-bold">Supabase isn&apos;t connected yet.</p>
      <p className="mt-1">
        Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
        <code>.env.local</code> (or to the Vercel project&apos;s environment variables), then restart. See the README
        for the full setup.
      </p>
    </div>
  );
}
