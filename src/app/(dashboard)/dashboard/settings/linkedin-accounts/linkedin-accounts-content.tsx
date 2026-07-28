"use client";

import {
  PageShell,
  PageHeader,
  Panel,
  PanelTitle,
} from "@/components/dashboard/ui/page";
import { LinkedInAccountsPanel } from "@/components/dashboard/linkedin/accounts-panel";

/**
 * Connected LinkedIn accounts, in settings rather than under Agents.
 *
 * An account is not an agent thing. It is the identity the whole product sends
 * from: the agents reach out through it and posts publish through it, because
 * v2 drops the LinkedIn API. Filing it under Agents made people think posting
 * needed one too, which it does.
 *
 * The list, the connect dialog and the disconnect button all live in
 * `LinkedInAccountsPanel`, which the settings hub and the agent wizard mount
 * as well. This page is the full-width home for it, not a second
 * implementation of it.
 */

export function LinkedInAccountsContent() {
  return (
    <PageShell>
      <PageHeader
        title="LinkedIn accounts"
        description="The accounts LinkedGrow sends from. Your agents reach out through them and your posts publish through them, so one connection covers both."
      />

      <div className="mt-8 space-y-6">
        <Panel>
          <PanelTitle description="Each account gets its own dedicated address in the country you pick and keeps it, because an account seen from a new address every week is what gets restricted.">
            Connected accounts
          </PanelTitle>

          <LinkedInAccountsPanel emptyHint="No account connected yet. Connect the LinkedIn account you want to send from." />
        </Panel>
      </div>
    </PageShell>
  );
}
