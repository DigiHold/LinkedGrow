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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22" fill="#378fe9" />
      <path d="M25.22 19.08H11.76A2.7 2.7 0 009 22a2.85 2.85 0 002.91 2.67h.5A2.43 2.43 0 0010 27.18a2.52 2.52 0 002.31 2.5 2.51 2.51 0 001.05 4.45 2.54 2.54 0 00-.19 1.87 2.69 2.69 0 002.66 2H23a11.51 11.51 0 002.8-.37l4.52-1.32c.27-.08 4.19 0 6 0 3.15-.12 4-14.57 0-14.57 0 0-1.45.05-1.73 0s-.46-.6-1.25-1.45l-.07-.09c-1.15-1.24-2.45-2.85-3.37-3.75-2.24-2.19-4.08-4.07-5.38-6.92-.73-1.62-.81-2.35-2.35-2.35a2.45 2.45 0 00-2.1 2.56 23.77 23.77 0 00.32 2.52 23.64 23.64 0 003.1 6.92" fill="#d0e8ff" fillRule="evenodd" />
      <path d="M25.22 19.08H11.76a2.76 2.76 0 00-2.76 3 2.84 2.84 0 002.92 2.64h.5a2.43 2.43 0 00-2.37 2.51 2.52 2.52 0 002.31 2.5h0a2.51 2.51 0 001.05 4.45 2.51 2.51 0 00-.24 1.82 2.69 2.69 0 002.66 2H23a12.08 12.08 0 002.8-.36l4.52-1.32c.27-.08 4.19 0 6 0 3.15-.12 4-14.57 0-14.57h-1.73c-.28 0-.46-.59-1.25-1.44l-.07-.09c-1.15-1.25-2.45-2.85-3.37-3.76-2.24-2.18-4.08-4.06-5.38-6.92-.73-1.61-.81-2.41-2.35-2.34a2.32 2.32 0 00-1.58.8 2.35 2.35 0 00-.52 1.71 23.45 23.45 0 00.32 2.52 23.32 23.32 0 003.1 6.89" fill="none" stroke="#004182" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

// LinkedIn reaction SVG icons
function ReactionLike({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22" fill="#378fe9" />
      <path d="M25.22 19.08H11.76A2.7 2.7 0 009 22a2.85 2.85 0 002.91 2.67h.5A2.43 2.43 0 0010 27.18a2.52 2.52 0 002.31 2.5 2.51 2.51 0 001.05 4.45 2.54 2.54 0 00-.19 1.87 2.69 2.69 0 002.66 2H23a11.51 11.51 0 002.8-.37l4.52-1.32c.27-.08 4.19 0 6 0 3.15-.12 4-14.57 0-14.57 0 0-1.45.05-1.73 0s-.46-.6-1.25-1.45l-.07-.09c-1.15-1.24-2.45-2.85-3.37-3.75-2.24-2.19-4.08-4.07-5.38-6.92-.73-1.62-.81-2.35-2.35-2.35a2.45 2.45 0 00-2.1 2.56 23.77 23.77 0 00.32 2.52 23.64 23.64 0 003.1 6.92" fill="#d0e8ff" fillRule="evenodd" />
      <path d="M25.22 19.08H11.76a2.76 2.76 0 00-2.76 3 2.84 2.84 0 002.92 2.64h.5a2.43 2.43 0 00-2.37 2.51 2.52 2.52 0 002.31 2.5h0a2.51 2.51 0 001.05 4.45 2.51 2.51 0 00-.24 1.82 2.69 2.69 0 002.66 2H23a12.08 12.08 0 002.8-.36l4.52-1.32c.27-.08 4.19 0 6 0 3.15-.12 4-14.57 0-14.57h-1.73c-.28 0-.46-.59-1.25-1.44l-.07-.09c-1.15-1.25-2.45-2.85-3.37-3.76-2.24-2.18-4.08-4.06-5.38-6.92-.73-1.61-.81-2.41-2.35-2.34a2.32 2.32 0 00-1.58.8 2.35 2.35 0 00-.52 1.71 23.45 23.45 0 00.32 2.52 23.32 23.32 0 003.1 6.89" fill="none" stroke="#004182" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ReactionCelebrate({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22" fill="#6dae4f" />
      <path d="M45.57 31l-1.42-1.07s-.59-5.63-1.61-6.71a18.45 18.45 0 01-3.81-7.49c-.49-1.67-.83-2.26-2.33-2.29a2.29 2.29 0 00-2 2.52 17.11 17.11 0 00.21 2.25c.55 2.92 1.15 5.31 1.23 5.45L22.3 13.53c-1-.77-2.49-1.11-3.49.22s-.19 2.55.83 3.32l7.07 5.32L28.83 24l-11.32-8.53c-1-.77-2.49-1.11-3.48.22s-.2 2.55.82 3.32l7.07 5.32 4.25 3.19L17 20.6c-1-.76-2.48-1.11-3.48.22s-.19 2.56.82 3.32l7.08 5.33L25 32.13l-7.1-5.33c-1-.76-2.46-1.14-3.42.13a2.37 2.37 0 00.76 3.41l12.67 9.47a8.29 8.29 0 003.55 1.56" fill="#ddf6d1" fillRule="evenodd" />
      <path d="M15.57 5.44l.7 3.12M25.49 9.25l-2.6 1.85M21.48 4.87l-1.9 5" fill="none" stroke="#165209" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ReactionSupport({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22" fill="#bba9d1" />
      <path d="M17.81 10.09a4.52 4.52 0 00-6.4-.08l-.07.08a4.7 4.7 0 000 6.58l7 7.07 7-7.08a4.71 4.71 0 000-6.57 4.5 4.5 0 00-6.46 0l-.52.52z" fill="#ecaa96" fillRule="evenodd" />
      <path d="M17.92 9.45a5 5 0 00-7 7L18.47 24l7.59-7.55a4.93 4.93 0 001.37-4.32 5 5 0 00-2.71-3.63 4.81 4.81 0 00-2.18-.5 4.93 4.93 0 00-3.49 1.47l-.58.54z" fill="none" stroke="#77280c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M42.46 40.81a68.7 68.7 0 01-10.61-1h-.19a60.42 60.42 0 01-7.87-1.64c-2.29-.69-4.54-1.58-6.73-2.44l-1-.38c-2.09-.81-3.75-1.49-5.29-2.14l-.58-.24a21.88 21.88 0 01-2.68-1.27C6.34 31 6 30.06 6.49 29a1.77 1.77 0 011.74-1h.13c1.9.21 7.41 2.3 8.5 2.72l3.55.12H21l8 .28c-.62-.57-2.2-1.57-6-2.57-.73-.18-1.4-.39-1.56-.93a2.16 2.16 0 01.7-2.26 2.86 2.86 0 011.69-.39 8.72 8.72 0 012.09.25c.4.1.74.21 1 .31a12.13 12.13 0 002.59.58 27 27 0 014.29.98c4.48 1.2 5.35 3.45 5.92 4.81" fill="#eae2f3" fillRule="evenodd" />
      <path d="M45.79 31.2c.32.23.33 2.66-.37 4.79a10.73 10.73 0 01-3.05 4.16c-.37.34-13.21-1.15-16.29-1.66S8 31.29 7.37 31s-.63-2.65 1-3.13 5.93 2.1 8.59 2.33 8.78.47 11 .47-2-1.51-3.11-1.91S22 28 21.64 26.9s.83-1.9 1.82-1.9a29.24 29.24 0 015.31 1.26 18.66 18.66 0 017 1.13A8.06 8.06 0 0140 31.2c.32.61 5.46-.2 5.79 0z" fill="none" stroke="#493d57" strokeWidth="2" />
    </svg>
  );
}

function ReactionLove({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22" fill="#df704d" />
      <path d="M23.08 14.6a8.21 8.21 0 00-11.66 0 8.35 8.35 0 000 11.76L24 39l12.58-12.64a8.35 8.35 0 000-11.75 8.13 8.13 0 00-11.63 0l-.94.9z" fill="#fff3f0" stroke="#77280c" fillRule="evenodd" />
      <path d="M23.08 14.44a8.18 8.18 0 00-11.66 0 8.35 8.35 0 000 11.76L24 38.83 36.58 26.2a8.37 8.37 0 000-11.76 8.11 8.11 0 00-11.62 0l-.94.9z" fill="none" stroke="#77280c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ReactionInsightful({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22" fill="#f5bb5c" />
      <path d="M26.58 41h-5a1.68 1.68 0 01-1.68-1.68v-4.2h8.4v4.2A1.69 1.69 0 0126.58 41z" fill="#ffe1b2" fillRule="evenodd" />
      <path d="M19.87 35.92v-.84a10 10 0 00-.48-3.08 10.08 10.08 0 00-1.62-2.51 10.23 10.23 0 01-3.77-7.8v-.05a10.08 10.08 0 1120.16 0 10.55 10.55 0 01-4 8l-.13.11a3.75 3.75 0 00-.57.62 5.43 5.43 0 00-.72 1.47 10.05 10.05 0 00-.47 3.22v.84" fill="#fcf0de" fillRule="evenodd" />
      <path d="M14 7.36l2.12 2.77M35 7.36l-2.12 2.77M24.06 4v4.2" fill="none" stroke="#5d3b01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M22.3 13.86a7 7 0 00-3.84 2.08 7.85 7.85 0 00-2.14 3.8" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      <path d="M26.58 41h-5a1.68 1.68 0 01-1.68-1.68v-4.2h8.4v4.2A1.69 1.69 0 0126.58 41z" fill="none" stroke="#5d3b01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M19.86 35.92v-.84a10 10 0 00-.48-3.08 5.7 5.7 0 00-.82-1.49 8.06 8.06 0 00-1.16-1.31 11.05 11.05 0 01-1.17-1.2A10.53 10.53 0 0114 21.66v-.05a10.08 10.08 0 1117.88 6.28 12.25 12.25 0 01-1.79 1.81 3.54 3.54 0 00-.62.66 5.74 5.74 0 00-.72 1.47 10.34 10.34 0 00-.47 3.22v.84" fill="none" stroke="#5d3b01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ReactionFunny({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22" fill="#44bfd3" />
      <circle cx="24" cy="24" r="16" fill="#d5f9fe" stroke="#104e58" strokeWidth="1.8" />
      <path d="M14.67 21.01l-.19.3.68.7.42-.26c1.82-1.12 4.02-1.45 6.08-.9l.46-.86c-2.28-1.99-5.79-1.5-7.45 1.02z" fill="#104e58" />
      <path d="M33.44 21.34c-1.46-2.65-4.92-3.39-7.35-1.59l-.28.21.41.89c2.23-.52 4.59-.11 6.51 1.15l.71-.66z" fill="#104e58" />
      <path d="M19.49 14.23c-1.34-.06-3.99.27-5.49 2.77" fill="none" stroke="#104e58" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M29 14.72c1.34-.06 3.99.27 5.49 2.77" fill="none" stroke="#104e58" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M31.59 26h-15.18c-.69 0-1.18.76-.93 1.48 1.1 3.13 3.24 7.47 8.51 7.47s7.42-4.34 8.51-7.47c.25-.72-.24-1.48-.93-1.48z" fill="#2199ac" />
      <path d="M24 30c-4 0-6.62 1.74-5 3 .91.71 3 1.49 5 1.5 2 0 4.26-.76 5-1.5 1.26-1.26-1-3-5-3z" fill="#d5f9fe" />
      <path d="M31.56 25.1h-15.11c-1.4 0-2.47 1.38-1.97 2.76.58 1.61 1.46 3.6 2.94 5.21 1.51 1.63 3.63 2.83 6.59 2.83s5.08-1.2 6.59-2.83c1.48-1.6 2.36-3.6 2.94-5.21.5-1.38-.57-2.76-1.97-2.76zm-2.29 6.74c-1.21 1.31-2.87 2.26-5.26 2.26s-4.06-.95-5.26-2.26c-1.24-1.33-2.02-3.06-2.57-4.59-.05-.15.05-.35.28-.35h15.11c.22 0 .33.2.28.35-.55 1.53-1.33 3.26-2.57 4.59z" fill="#104e58" />
    </svg>
  );
}

export const REACTIONS = [
  { type: "LIKE", label: "Like", Icon: ReactionLike },
  { type: "PRAISE", label: "Celebrate", Icon: ReactionCelebrate },
  { type: "APPRECIATION", label: "Support", Icon: ReactionSupport },
  { type: "EMPATHY", label: "Love", Icon: ReactionLove },
  { type: "INTEREST", label: "Insightful", Icon: ReactionInsightful },
  { type: "ENTERTAINMENT", label: "Funny", Icon: ReactionFunny },
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
          <r.Icon className="w-8 h-8" />
        </button>
      ))}
    </div>
  );
}
