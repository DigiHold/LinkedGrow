// CMS Content Block Renderer - Server component, zero client JS
import Image from "next/image";
import Link from "next/link";
import type { ContentBlock, FAQItem } from "@/lib/cms";

interface CMSRendererProps {
  blocks: ContentBlock[];
}

export function CMSRenderer({ blocks }: CMSRendererProps) {
  return (
    <div className="cms-content space-y-8">
      {blocks.map((block, index) => (
        <CMSBlock key={index} block={block} />
      ))}
    </div>
  );
}

function CMSBlock({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "heading":
      return block.level === 2 ? (
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          {block.text}
        </h2>
      ) : (
        <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100">
          {block.text}
        </h3>
      );

    case "text":
      return (
        <div
          className="prose prose-slate dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-a:text-cyan-600 dark:prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 dark:prose-strong:text-white"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );

    case "image":
      return (
        <figure className="my-8">
          <div className="relative w-full overflow-hidden rounded-2xl">
            <Image
              src={block.src}
              alt={block.alt}
              width={1200}
              height={675}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
          {block.caption && (
            <figcaption className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "faq":
      return <FAQSection items={block.items} />;

    case "cta":
      return (
        <div className="flex justify-center my-8">
          <Link
            href={block.href}
            className={`inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold text-base transition-all ${
              block.variant === "primary"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-0.5"
                : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-600 hover:shadow-md"
            }`}
          >
            {block.text}
          </Link>
        </div>
      );

    case "separator":
      return (
        <div className="my-12 flex items-center justify-center">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
          <div className="mx-4 h-1.5 w-1.5 rounded-full bg-cyan-500" />
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
        </div>
      );

    default:
      return null;
  }
}

function FAQSection({ items }: { items: FAQItem[] }) {
  return (
    <div className="space-y-4 my-8">
      {items.map((item, index) => (
        <details
          key={index}
          className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden"
        >
          <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-left font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800">
            <span>{item.question}</span>
            <svg
              className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-6 pb-4 text-slate-600 dark:text-slate-300">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
