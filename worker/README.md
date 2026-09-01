# LinkedGrow worker

The worker plane. One persistent browser per LinkedIn account, driven through
that account's own dedicated address.

It lives outside the Next.js repo on purpose: Vercel functions are ephemeral and
cannot hold a logged-in Chrome, and shipping Patchright into that build would
slow it down for nothing. The control plane enqueues work and reads state; this
never serves user traffic.

## Running it

    npm install
    npx patchright install chrome
    cp .env.example .env      # then fill it in
    npm run worker

## What is here

| Path | What it is |
|---|---|
| `browser/human.ts` | Bezier mouse, per-character typing, dwell, scroll. Ported unchanged. |
| `browser/fingerprint.ts` | One stable device per account, derived from its id. |
| `browser/driver.ts` | Chrome through the account's address, with the IP assertion. |
| `safety/envelope.ts` | Business hours, warm-up ramp, daily allowance. Ported. |
| `safety/ip-lock.ts` | One action at a time per shared address. |
| `linkedin/` | Every LinkedIn interaction, the sequence, the miners. Ported. |
| `messages/validate.ts` | The no-slop gate, with its tests. Ported unchanged. |
| `ai.ts` | Haiku for scoring, Sonnet for anything read by a human, with spend ceilings. |
| `store.ts` | The original store's shape, backed by Turso, scoped per tenant. |
| `worker.ts` | The run loop. |

## Checks

    npm run typecheck
    npm test
