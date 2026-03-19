// LinkedIn icons for engagement feature

export function LikeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M12.91 7l-2.25-2.57a8.21 8.21 0 01-1.5-2.55L9 1.37A2.08 2.08 0 007 0a2.08 2.08 0 00-2.06 2.08v1.17a5.81 5.81 0 00.31 1.89l.28.86H2.38A1.47 1.47 0 001 7.47a1.45 1.45 0 00.64 1.21 1.48 1.48 0 00-.37 2.06 1.54 1.54 0 00.62.51h.05a1.6 1.6 0 00-.19.71A1.47 1.47 0 003 13.42v.1A1.46 1.46 0 004.4 15h4.83a5.61 5.61 0 002.48-.58l1-.42H14V7zM12 12.11l-1.19.52a3.59 3.59 0 01-1.58.37H5.1a.55.55 0 01-.53-.4l-.14-.48-.49-.21a.56.56 0 01-.34-.6l.09-.56-.42-.42a.56.56 0 01-.09-.68L3.55 9l-.4-.61A.28.28 0 013.3 8h5L7.14 4.51a4.15 4.15 0 01-.2-1.26V2.08A.09.09 0 017 2a.11.11 0 01.08 0l.18.51a10 10 0 001.9 3.24l2.84 3z" />
    </svg>
  );
}

export function CommentIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M5 8h5v1H5zm11-.5v.08a6 6 0 01-2.75 5L8 16v-3H5.5A5.51 5.51 0 010 7.5 5.62 5.62 0 015.74 2h4.76A5.5 5.5 0 0116 7.5zm-2 0A3.5 3.5 0 0010.5 4H5.74A3.62 3.62 0 002 7.5 3.53 3.53 0 005.5 11H10v1.33l2.17-1.39A4 4 0 0014 7.58zM5 7h6V6H5z" />
    </svg>
  );
}

export function LikedIcon({ className }: { className?: string }) {
  return (
    <img src="/images/reactions/like.svg" alt="Liked" className={className} />
  );
}

// Reaction types using the exact LinkedIn SVG files
export const REACTIONS = [
  { type: "LIKE", label: "Like", src: "/images/reactions/like.svg" },
  { type: "PRAISE", label: "Celebrate", src: "/images/reactions/celebrate.svg" },
  { type: "APPRECIATION", label: "Support", src: "/images/reactions/support.svg" },
  { type: "EMPATHY", label: "Love", src: "/images/reactions/love.svg" },
  { type: "INTEREST", label: "Insightful", src: "/images/reactions/insightful.svg" },
  { type: "ENTERTAINMENT", label: "Funny", src: "/images/reactions/funny.svg" },
] as const;

export type ReactionType = typeof REACTIONS[number]["type"];

export function ReactionMenu({
  onReact,
  className,
}: {
  onReact: (type: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 ${className || ""}`}>
      {REACTIONS.map((r) => (
        <button
          key={r.type}
          onClick={() => onReact(r.type)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:scale-[1.35] transition-transform duration-150 origin-bottom"
          title={r.label}
        >
          <img src={r.src} alt={r.label} className="w-8 h-8" draggable={false} />
        </button>
      ))}
    </div>
  );
}
