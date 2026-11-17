import { linkify } from "@/lib/wall";

/** Message text with http(s) links made clickable (opened in a new tab). */
export default function PostBody({ text }: { text: string }) {
  return (
    <>
      {linkify(text).map((part, i) =>
        part.type === "link" ? (
          <a
            key={i}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="break-all text-[#3b5998] hover:underline"
          >
            {part.value}
          </a>
        ) : (
          <span key={i}>{part.value}</span>
        ),
      )}
    </>
  );
}
