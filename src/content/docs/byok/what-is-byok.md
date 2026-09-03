---
title: "What is BYOK?"
description: Understand LinkedGrow's Bring Your Own Key model, which of the 2 keys on an instance pays for what, and what the AI actually costs.
category: "byok"
order: 1
---

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin-bottom:24px;border-radius:12px">
<iframe src="https://www.youtube.com/embed/tdw3icQGIv0" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
</div>

## Bring Your Own Key explained

BYOK stands for Bring Your Own Key, and it is how every model call in LinkedGrow is paid for. Nothing is resold and nothing is metered: you connect an API key of your own from OpenAI, Anthropic, Google AI, Grok, Perplexity or Kimi, and that provider bills you for what you used.

LinkedGrow itself has no price on the self hosted edition: you pay for your server, and you pay the AI provider directly for actual usage at their API rates. Nothing is marked up along the way.

## How it works

1. **Choose an AI provider** - Pick from OpenAI, Anthropic, Google AI, Grok (xAI), Perplexity, or Kimi
2. **Get your API key** - Create an account at the provider's website and generate an API key
3. **Add billing** - Set up a payment method with the provider (pay-as-you-go)
4. **Paste your key in LinkedGrow** - Go to Settings > AI API and enter your key
5. **Start generating** - Create unlimited posts, ideas, hooks, and more

The AI provider charges you based on actual usage. Each post generation typically costs $0.001 to $0.05 depending on the model you choose.

## Which key pays for what

Two different AI keys sit behind a self hosted instance:

| | Which key | What it costs |
|---|---|---|
| Everything the agents think: finding leads, scoring them, writing messages | The instance key from the setup wizard | Billed by that provider to whoever set the instance up |
| Everything you generate: posts, carousels, hooks, ideas | Your own key from Settings | Billed to you by that provider, a few cents per generation |

So the content side is unlimited at cost price. Generate 10 posts a month or 200, you pay your provider for exactly what you used, and you choose the model.

The agent key is the administrator's business rather than yours, and it carries its own ceilings: 1 dollar a day per agent and 12 dollars a month per LinkedIn account by default.

## Benefits of BYOK

- **No generation limits** - Create as many posts, ideas, and hooks as you want
- **Choose your model** - Use budget models for brainstorming ($0.001/post) and premium models for final drafts ($0.03/post)
- **Full cost transparency** - See exactly what you spend in your provider's dashboard
- **No vendor lock-in** - Your API key works with any service, not just LinkedGrow
- **Switch providers instantly** - Try OpenAI today and Anthropic tomorrow with no friction
- **Always access the latest models** - When providers release new models, they are available immediately

## Typical monthly AI costs

| Usage level | Description | Estimated cost |
|---|---|---|
| Light | 10-15 posts per month with a budget model | $0.10 - $0.30 |
| Regular | 30 posts per month with a recommended model | $0.30 - $0.90 |
| Active | 60 posts with hooks and ideas | $1 - $3 |
| Heavy | 100+ posts with image generation | $3 - $8 |

The table is an estimate for the writing tools only. Your provider's dashboard holds the real number, and it moves with how much you generate rather than with any subscription.

## Getting started

Ready to set up your API key? See our step-by-step guides for each provider:

- [OpenAI Setup](/docs/byok/openai-setup)
- [Anthropic (Claude) Setup](/docs/byok/anthropic-setup)
- [Google AI (Gemini) Setup](/docs/byok/google-ai-setup)
- [Grok (xAI) Setup](/docs/byok/grok-setup)
- [Perplexity Setup](/docs/byok/perplexity-setup)
- [Kimi Setup](/docs/byok/kimi-setup)
- [Image Providers](/docs/byok/image-providers)
