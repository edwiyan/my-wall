import { profile } from "@/lib/profile";
import { avatarColor, initials } from "@/lib/wall";

type Props = {
  name: string;
  profilePhoto: string | null;
  size?: number;
};

/** The owner's posts show their profile picture; everyone else gets a coloured initials tile. */
export default function Avatar({ name, profilePhoto, size = 50 }: Props) {
  const style = { width: size, height: size };
  if (name === profile.name) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL, already resized
      <img
        src={profilePhoto ?? profile.fallbackPhoto}
        alt=""
        style={style}
        className="shrink-0 border border-[#d8dfea] bg-[#d8dfea] object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{ ...style, backgroundColor: avatarColor(name), fontSize: Math.round(size * 0.38) }}
      className="flex shrink-0 items-center justify-center font-bold text-white select-none"
    >
      {initials(name)}
    </span>
  );
}
