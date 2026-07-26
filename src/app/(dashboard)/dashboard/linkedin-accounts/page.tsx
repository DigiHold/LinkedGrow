import type { Metadata } from "next";
import Link from "next/link";
import {
  PageShell,
  PageHeader,
  Panel,
  EmptyState,
} from "@/components/dashboard/ui/page";
import { LinkedInAccountIcon } from "@/components/dashboard/nav-icons";

export const metadata: Metadata = { title: "LinkedIn accounts" };

export default function LinkedInAccountsPage() {
  return (
    <PageShell>
      <PageHeader
        title="LinkedIn accounts"
        description="One agent runs one account. Credentials are encrypted the moment they arrive and decrypted only inside the browser session that uses them."
      />
      <div className="mt-8">
        <Panel padded={false}>
          <EmptyState
            icon={<LinkedInAccountIcon className="h-6 w-6" />}
            title="No account connected"
            description="Connecting an account gives it a dedicated residential address in your own country, which it keeps for as long as the agent lives."
            action={
              <Link
                href="/dashboard/agents"
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Create an agent
              </Link>
            }
          />
        </Panel>
      </div>
    </PageShell>
  );
}
