// LinkedIn reaction icons and UI icons for engagement feature

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
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22" fill="#378fe9" />
      <path d="M25.22 19.08H11.76A2.7 2.7 0 009 22a2.85 2.85 0 002.91 2.67h.5A2.43 2.43 0 0010 27.18a2.52 2.52 0 002.31 2.5 2.51 2.51 0 001.05 4.45 2.54 2.54 0 00-.19 1.87 2.69 2.69 0 002.66 2H23a11.51 11.51 0 002.8-.37l4.52-1.32c.27-.08 4.19 0 6 0 3.15-.12 4-14.57 0-14.57 0 0-1.45.05-1.73 0s-.46-.6-1.25-1.45l-.07-.09c-1.15-1.24-2.45-2.85-3.37-3.75-2.24-2.19-4.08-4.07-5.38-6.92-.73-1.62-.81-2.35-2.35-2.35a2.45 2.45 0 00-2.1 2.56 23.77 23.77 0 00.32 2.52 23.64 23.64 0 003.1 6.92" fill="#d0e8ff" fillRule="evenodd" />
      <path d="M25.22 19.08H11.76a2.76 2.76 0 00-2.76 3 2.84 2.84 0 002.92 2.64h.5a2.43 2.43 0 00-2.37 2.51 2.52 2.52 0 002.31 2.5h0a2.51 2.51 0 001.05 4.45 2.51 2.51 0 00-.24 1.82 2.69 2.69 0 002.66 2H23a12.08 12.08 0 002.8-.36l4.52-1.32c.27-.08 4.19 0 6 0 3.15-.12 4-14.57 0-14.57h-1.73c-.28 0-.46-.59-1.25-1.44l-.07-.09c-1.15-1.25-2.45-2.85-3.37-3.76-2.24-2.18-4.08-4.06-5.38-6.92-.73-1.61-.81-2.41-2.35-2.34a2.32 2.32 0 00-1.58.8 2.35 2.35 0 00-.52 1.71 23.45 23.45 0 00.32 2.52 23.32 23.32 0 003.1 6.89" fill="none" stroke="#004182" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

// Reaction types for the floating menu
export const REACTIONS = [
  { type: "LIKE", label: "Like", emoji: "👍", color: "#378fe9" },
  { type: "PRAISE", label: "Celebrate", emoji: "👏", color: "#6dae4f" },
  { type: "APPRECIATION", label: "Support", emoji: "💜", color: "#bba9d1" },
  { type: "EMPATHY", label: "Love", emoji: "❤️", color: "#df704d" },
  { type: "INTEREST", label: "Insightful", emoji: "💡", color: "#f5bb5c" },
  { type: "ENTERTAINMENT", label: "Funny", emoji: "😄", color: "#44bfd3" },
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
    <div className={`flex items-center gap-0.5 p-1 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 ${className || ""}`}>
      {REACTIONS.map((r) => (
        <button
          key={r.type}
          onClick={() => onReact(r.type)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:scale-125 transition-transform duration-150 hover:bg-slate-100 dark:hover:bg-slate-700"
          title={r.label}
        >
          <span className="text-xl">{r.emoji}</span>
        </button>
      ))}
    </div>
  );
}
