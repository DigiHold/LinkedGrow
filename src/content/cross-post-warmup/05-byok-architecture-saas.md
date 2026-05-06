---
day: 5
title: "BYOK Architecture: How I Made My LinkedIn AI Tool 96% Cheaper Than Competitors"
description: "Most AI SaaS marks up the model API by 5-10x and gates usage behind monthly caps. Bring Your Own Key flips that. Here is the architecture, the math, and the security tradeoffs."
tags:
  - ai
  - saas
  - architecture
  - discuss
---

The standard SaaS pricing for AI tools in 2026 looks like this: pay $49 a month, get 100 generations, anything beyond costs extra credits. The reason is simple. The vendor pays the model API per token, marks it up to cover infrastructure plus margin, and caps your usage so they do not lose money on heavy users.

I went the other way. Users on my LinkedIn tool bring their own OpenAI, Anthropic, Google, or Grok key. They pay the AI provider directly, at the provider's pricing. I charge a flat $19 a month for the platform itself, with no token caps.

The math the user sees: $19 to me + $2-4 a month to OpenAI for typical usage = $21-23 total. The competitor charging $49 with caps costs them more, gives them less, and runs out faster.

This article is about why this works, what the architecture looks like, and what tradeoffs you accept when you go BYOK.

## The cost math

Take a typical creator generating 30 LinkedIn posts a month with GPT-4o or Claude Sonnet. Each generation is roughly 2,000 input tokens (your context, voice samples, brand info) plus 800 output tokens. At current OpenAI prices, that is about $0.03 per generation. Thirty a month: $0.90.

Add some image generation: 4 LinkedIn carousels, 8 hook variations tested. Maybe $1.50 in image cost.

Total monthly AI cost for an active user: $2-3. Heavy users hit $5-8. None of them hit $20.

Meanwhile, the standard SaaS markup is 5-10x. The vendor sees the same $2-3 in API cost and charges $49. Caps usage so heavy users do not eat the margin. Adds "credits" to upsell on overage.

BYOK eliminates the markup entirely. Users pay the API at API prices.

## The architecture

The user stores their own API key in their account. My app reads it at request time and calls the provider directly.

```ts
async function generatePost(userId: string, prompt: string) {
  const user = await getUser(userId);
  const key = decrypt(user.encryptedOpenaiKey);

  const openai = new OpenAI({ apiKey: key });
  const result = await openai.chat.completions.create({
    model: user.preferredModel ?? "gpt-4o",
    messages: buildMessages(prompt, user.voiceProfile),
  });

  return result.choices[0].message.content;
}
```

The platform never proxies API requests. It just decrypts the key on the request hot path and uses it. No vendor middlemen, no rate-limit aggregation, no shared infrastructure billing.

Storage: the API key is encrypted at rest with a per-user secret derived from your platform's master key plus the user ID. I use AES-256-GCM. Never log the key. Never return it in responses (return a masked version like `sk-...AbCd` for the UI).

## What you give up

There are real tradeoffs. Pretending there are not is dishonest.

**You cannot offer a "no setup, click and go" experience.** Users have to create an account on OpenAI or Anthropic, generate a key, and paste it into your settings. That is friction. It eliminates the casual try-it crowd. Some of them never come back.

**You cannot promise a fixed monthly cost.** A new user does not know what their AI usage will look like. Telling them "between $2 and $8 depending on usage" is true but feels uncertain. Users like fixed numbers.

**You cannot enforce per-user quotas centrally.** If a user gives their key to four people, you cannot stop that. The provider stops them when they hit their own provider limits. From your side, that is fine. From a "use case enforcement" perspective, it is a gap.

**Support gets weirder.** When generations fail, the question is now "is it your code or my API key." Users blame you for provider errors. You build error mapping that surfaces "this is an OpenAI 429, not us." It works but it is more code than a single-tenant setup.

## When BYOK is wrong

BYOK does not fit every product. Three cases where it fails:

1. **Your model is fine-tuned or proprietary.** If you trained on your own data and serve a custom endpoint, you cannot let users bring their own key. There is no key to bring.
2. **Your users are non-technical and the API key step kills them.** B2C tools targeting "anyone can do it" audiences lose 30-50% of signups at the key step. If your audience is "marketers who do not know what an API is," do not BYOK.
3. **Your value is in the routing, caching, or aggregation.** Tools that route a single request across multiple models, cache embeddings across users, or aggregate inference costs across a tenant cannot easily go BYOK.

For my use case (LinkedIn content generation, technical-leaning audience, no caching benefit because each user's voice is unique), BYOK is a clean win. It would be wrong for a different audience or different value proposition.

## The pricing pitch

When a user looks at a competitor at $49 a month with a 100-post cap, then looks at $19 a month plus $2-4 in API costs and unlimited generation, the math is a hard yes. The friction of pasting an API key is real but it is a one-time cost. The price difference is a recurring cost.

Most BYOK conversions happen on the second visit. They see the architecture, leave, do the math, come back. The first visit is too noisy for the tradeoffs to land.

If you are pricing an AI SaaS and your only differentiator is the model output, BYOK is worth modeling. The margin you give up is offset by the conversion you gain on price-sensitive users.
