import { profile } from "@/lib/profile";
import { timeAgo, type Post } from "@/lib/wall";

export default function PostItem({ post, now }: { post: Post; now: number | null }) {
  const when = now === null ? "" : timeAgo(post.created_at, now);
  return (
    <li className="flex gap-2.5 border-b border-[#e9e9e9] py-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- small static avatar */}
      <img src={profile.photo} alt="" className="size-[50px] shrink-0 object-cover" />
      <div className="min-w-0 flex-1">
        <p className="leading-snug break-words whitespace-pre-wrap text-[#333]">
          <span className="font-bold text-[#3b5998]">{post.name}</span> {post.body}
        </p>
        {post.image_url && (
          <a href={post.image_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element -- user photo from Supabase Storage */}
            <img
              src={post.image_url}
              alt={`Photo shared by ${post.name}`}
              loading="lazy"
              className="max-h-80 max-w-full border border-[#d8dfea] object-contain"
            />
          </a>
        )}
        <time dateTime={post.created_at} className="mt-1 block text-[11px] text-[#999]">
          {when}
        </time>
      </div>
    </li>
  );
}
