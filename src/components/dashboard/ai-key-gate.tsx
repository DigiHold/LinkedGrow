import Link from "next/link";
import { Key, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown on every page that cannot run without the user's own AI key.
 *
 * Each of those pages used to draw its own version of this card, and they had
 * drifted into four different accent colours, so the same blocker looked like
 * four unrelated problems depending on where you hit it.
 */
export function AiKeyGate({
  what = "generate",
  imageKey = false,
}: {
  /** Completes "To ...". Keep it short: "generate content ideas". */
  what?: string;
  /** Image models live under a separate key, so the copy differs. */
  imageKey?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="mx-auto max-w-md px-8 py-14 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
          <Key className="h-5 w-5" />
        </div>
        <p className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
          Add your {imageKey ? "image" : "AI"} key first
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          To {what} you need to connect your own key. It stays encrypted, and
          because you pay the model provider directly there is no cap on how
          much you generate.
        </p>
        <Link href="/dashboard/settings/ai-api" className="mt-6 inline-block">
          <Button>
            <Settings className="mr-2 h-4 w-4" />
            Connect a key
          </Button>
        </Link>
        <p className="mt-6 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
          {imageKey
            ? "Works with Google, OpenAI and Replicate."
            : "Works with OpenAI, Anthropic, Google, Grok, Perplexity and Kimi."}
        </p>
      </div>
    </div>
  );
}
