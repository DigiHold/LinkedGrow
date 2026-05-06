---
day: 4
title: "Scheduling Posts Exactly On Time With QStash + Next.js"
description: "Vercel cron runs once a minute at best. For a tool that needs to publish at the user's chosen time down to the minute, I switched to Upstash QStash. Here is the setup."
tags:
  - nextjs
  - vercel
  - qstash
  - webdev
---

I needed to schedule LinkedIn posts to publish at exact times chosen by users. Vercel cron supports cron expressions, so I figured I would run a job every minute and check if any post should publish in the next minute. That works. It is also wasteful, fires a function 1,440 times a day, and on free Vercel plans you only get a 1-minute resolution which is not exact.

I switched to Upstash QStash. Same family as Redis, separate product, designed for delayed and scheduled HTTP requests. The setup ended up cleaner than the cron approach and runs at the exact second.

## What QStash actually does

You publish a message to QStash with a target URL and a delay or cron expression. QStash sits on the message until the time is right, then makes an HTTP POST to your URL with whatever body you set. It signs the request so you can verify it came from QStash.

For one-off scheduling, you publish once with a `delay` or `notBefore` parameter. For recurring jobs, you create a `schedule` with a cron expression. Both go through the same delivery path.

## The publish call

For a post the user wants to schedule at a specific timestamp:

```ts
import { Client } from "@upstash/qstash";

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

const targetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/publish-scheduled`;

const result = await qstash.publishJSON({
  url: targetUrl,
  body: { postId: "abc123", userId: "user_456" },
  notBefore: Math.floor(scheduledAt.getTime() / 1000), // unix seconds
});

// store result.messageId so you can cancel later
```

The `notBefore` field is a unix timestamp in seconds. QStash will not deliver before that time. Delivery typically happens within a second of the target time, in my testing.

The `messageId` from the response is what you use to cancel the schedule later. Store it on the post row.

## Receiving and verifying

The route that QStash calls has to verify the signature. Without verification, anyone could POST to your endpoint and trigger publishing.

```ts
import { Receiver } from "@upstash/qstash";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("upstash-signature") || "";

  const isValid = await receiver.verify({
    body,
    signature,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/publish-scheduled`,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { postId, userId } = JSON.parse(body);
  // ...do the actual publishing
  return NextResponse.json({ ok: true });
}
```

Two signing keys: current and next. QStash rotates them periodically and your verifier accepts both during the rotation window. Set them up once in your env vars and forget about them.

## Cancellation

When the user unschedules a post, you delete the QStash message:

```ts
await qstash.messages.delete(post.qstashMessageId);
```

If the message has already been delivered, this returns 404 and you ignore it.

## When to use cron schedules vs one-off

QStash supports both. I use `publishJSON` for user-scheduled posts because each one needs its own target time. For things like "run this every day at 14:00 UTC" (cleanup jobs, daily syncs), I use `schedules.create` once at deploy time:

```bash
curl -X POST "https://qstash-us-east-1.upstash.io/v2/schedules/$DESTINATION" \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Upstash-Cron: 0 14 * * *" \
  -H "Upstash-Retries: 2" \
  -d '{}'
```

Two retries on failure, daily at 14:00 UTC. The schedule lives until you delete it.

## What QStash does not do

- It does not run code. It calls your URL. You still need a Next.js route handler doing the work.
- It does not give you transaction guarantees. If your handler fails after partially completing, you handle that.
- It is not free past the lowest tier. The free tier is generous (500 messages a day at the time of writing), but a busy app outgrows it.

## The before/after

With Vercel cron, my "publish scheduled posts" job ran 1,440 times a day. Most of those runs found nothing to do. Function invocations on Vercel cost money past the free quota.

With QStash, I run zero idle invocations. Each scheduled post triggers exactly one function call at the exact time the user wanted. My cost dropped, my logs got cleaner, and the publish-time accuracy went from "within the next minute" to "within 1-2 seconds of the requested time."

If you are building anything that needs to run code at a specific time the user chose, QStash is worth the 30 minutes of setup.
