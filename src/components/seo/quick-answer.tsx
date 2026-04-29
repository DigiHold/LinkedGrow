import Script from "next/script";

interface QuickAnswerProps {
  question: string;
  answer: string;
  className?: string;
}

export function QuickAnswer({ question, answer, className = "" }: QuickAnswerProps) {
  const wordCount = answer.trim().split(/\s+/).length;

  if (process.env.NODE_ENV !== "production") {
    if (wordCount < 30 || wordCount > 80) {
      console.warn(
        `[QuickAnswer] Answer is ${wordCount} words. Target: 40-60 words for optimal AI Overview extraction.`
      );
    }
  }

  const speakableJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".quick-answer-question", ".quick-answer-text"],
    },
  };

  return (
    <>
      <Script
        id="speakable-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableJsonLd) }}
      />
      <aside
        aria-label="Quick answer"
        className={`my-6 rounded-2xl border border-cyan-200 bg-linear-to-br from-cyan-50 to-blue-50 p-5 sm:p-6 dark:border-cyan-900/50 dark:from-cyan-950/30 dark:to-blue-950/30 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="quick-answer-question text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-400">
              Quick Answer: {question}
            </p>
            <p className="quick-answer-text mt-2 text-base leading-relaxed text-slate-800 dark:text-slate-200">
              {answer}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
