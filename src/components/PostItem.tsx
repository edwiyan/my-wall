import { fullDate, timeAgo, type Post } from "@/lib/wall";
import Avatar from "./Avatar";

type Props = {
  post: Post;
  now: number | null;
  fresh: boolean;
  profilePhoto: string | null;
  onOpenPhoto: (post: Post) => void;
};

export default function PostItem({ post, now, fresh, profilePhoto, onOpenPhoto }: Props) {
  const when = now === null ? "" : timeAgo(post.created_at, now);
  return (
    <li className={`flex gap-3 border-b border-[#e9e9e9] px-1 py-3.5 ${fresh ? "post-fresh" : ""}`}>
      <Avatar name={post.name} profilePhoto={profilePhoto} />
      <div className="min-w-0 flex-1">
        <p className="leading-[1.45] break-words whitespace-pre-wrap text-[#333]">
          <span className="font-bold text-[#3b5998]">{post.name}</span> {post.body}
        </p>
        {post.image_url && (
          <button
            type="button"
            onClick={() => onOpenPhoto(post)}
            className="group mt-2 block max-w-full cursor-zoom-in"
            aria-label={`Open photo shared by ${post.name}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- user photo from Supabase Storage */}
            <img
              src={post.image_url}
              alt={`Photo shared by ${post.name}`}
              loading="lazy"
              className="max-h-80 max-w-full border border-[#d8dfea] object-contain transition group-hover:brightness-95"
            />
          </button>
        )}
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#999]">
          {post.image_url && <span aria-hidden>📷</span>}
          <time dateTime={post.created_at} title={fullDate(post.created_at)}>
            {when}
          </time>
        </p>
      </div>
    </li>
  );
}

export function PostSkeleton() {
  return (
    <li className="flex animate-pulse gap-3 border-b border-[#e9e9e9] px-1 py-3.5" aria-hidden>
      <span className="size-[50px] shrink-0 bg-[#e4e8f0]" />
      <span className="flex-1 space-y-2 pt-1">
        <span className="block h-3 w-2/3 bg-[#e4e8f0]" />
        <span className="block h-3 w-1/3 bg-[#eef1f6]" />
      </span>
    </li>
  );
}
