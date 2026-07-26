import type { Metadata } from "next";
import Link from "next/link";
import {
  PageShell,
  PageHeader,
  Panel,
  EmptyState,
} from "@/components/dashboard/ui/page";
import { ReplyIcon } from "@/components/dashboard/nav-icons";

export const metadata: Metadata = { title: "Replies" };

export default function RepliesPage() {
  return (
    <PageShell>
      <PageHeader
        title="Replies"
        description="Everyone who answered, with the thread that led there. The agent goes permanently silent for anyone who replies, so the conversation is yours from here."
      />
      <div className="mt-8">
        <Panel padded={false}>
          <EmptyState
            icon={<ReplyIcon className="h-6 w-6" />}
            title="No replies yet"
            description="Once an agent is running, every answer lands here within a minute, alongside the messages you had already sent."
            action={
              <Link
                href="/dashboard/agents"
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Go to your agents
              </Link>
            }
          />
        </Panel>
      </div>
    </PageShell>
  );
}
