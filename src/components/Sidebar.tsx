import type { ReactNode } from "react";
import { profile } from "@/lib/profile";
import type { Post } from "@/lib/wall";

type Props = {
  profilePhoto: string | null;
  profileLoaded: boolean;
  photos: Post[];
  total: number | null;
  onChangePhoto: () => void;
  onOpenPhoto: (index: number) => void;
  onShowPhotos: () => void;
};

export default function Sidebar({
  profilePhoto,
  profileLoaded,
  photos,
  total,
  onChangePhoto,
  onOpenPhoto,
  onShowPhotos,
}: Props) {
  return (
    <aside className="flex shrink-0 flex-col gap-4 md:w-[200px]">
      <div className="flex gap-4 md:block">
        <div className="group relative w-28 shrink-0 md:w-[200px]">
          {profileLoaded ? (
            // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL, already 400×400
            <img
              src={profilePhoto ?? profile.fallbackPhoto}
              alt={`${profile.name}'s profile picture`}
              className="aspect-square w-full border border-[#d8dfea] bg-[#d8dfea] object-cover"
            />
          ) : (
            <div className="aspect-square w-full animate-pulse border border-[#d8dfea] bg-[#e4e8f0]" aria-hidden />
          )}
          <button
            type="button"
            onClick={onChangePhoto}
            className="absolute inset-x-0 bottom-0 bg-black/55 py-1.5 text-[11px] font-bold text-white opacity-100 transition-opacity hover:bg-black/70 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
          >
            Change picture
          </button>
        </div>

        <div className="min-w-0 md:hidden">
          <p className="text-[11px] text-[#777]">{profile.headline}</p>
          <p className="text-[11px] text-[#777]">{profile.location}</p>
          <p className="mt-1.5 inline-block bg-[#fff9d7] px-1.5 py-0.5 text-[11px] text-[#5c4f00]">
            Looking for: {profile.lookingFor}
          </p>
        </div>
      </div>

      <Box title="Information" className="hidden md:block">
        <dl className="space-y-1.5 px-2 py-2">
          <Row label="Headline" value={profile.headline} />
          <Row label="Location" value={profile.location} />
          <Row label="Looking for" value={profile.lookingFor} />
        </dl>
      </Box>

      {photos.length > 0 && (
        <Box
          title="Photos"
          action={
            <button type="button" onClick={onShowPhotos} className="text-[11px] font-normal text-[#3b5998] hover:underline">
              See all
            </button>
          }
          className="hidden md:block"
        >
          <ul className="grid grid-cols-3 gap-1 p-2">
            {photos.slice(0, 6).map((post, i) => (
              <li key={post.id}>
                <button
                  type="button"
                  onClick={() => onOpenPhoto(i)}
                  className="block aspect-square w-full cursor-zoom-in overflow-hidden"
                  aria-label={`Open photo shared by ${post.name}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- user photo from Supabase Storage */}
                  <img src={post.image_url ?? ""} alt="" loading="lazy" className="size-full object-cover hover:opacity-85" />
                </button>
              </li>
            ))}
          </ul>
        </Box>
      )}

      {total !== null && (
        <p className="hidden px-2 text-[11px] text-[#999] md:block">
          {total === 1 ? "1 post" : `${total.toLocaleString()} posts`} on this wall
        </p>
      )}
    </aside>
  );
}

function Box({
  title,
  action,
  className = "",
  children,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`border border-[#d8dfea] bg-white ${className}`}>
      <h2 className="flex items-center justify-between border-b border-[#d8dfea] bg-[#eceff5] px-2 py-1 text-[11px] font-bold text-[#333]">
        {title}
        {action}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-[#999]">{label}</dt>
      <dd className="text-[#333]">{value}</dd>
    </div>
  );
}
