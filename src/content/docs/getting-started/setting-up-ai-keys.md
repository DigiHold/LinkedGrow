---
title: "Setting Up AI API Keys"
description: Overview of the BYOK model and how to configure your AI API key for content generation in LinkedGrow.
category: "getting-started"
order: 3
---

## What is BYOK?

BYOK stands for Bring Your Own Key. Instead of charging you per generation or limiting your monthly usage, LinkedGrow lets you connect your own AI API key from providers like OpenAI, Anthropic, Google, or Kimi. You pay the AI provider directly at their rates with no markup from us.

This means unlimited generations at cost. Most users spend $2-4 per month on AI costs, compared to competitors that charge $49 or more per month with caps on how much content you can create.

## Supported providers

### Text generation (6 providers, 28 models)

- **OpenAI** - GPT-5.2, GPT-5, GPT-5 Nano, o4-mini, o3, o3-mini
- **Anthropic** - Claude Opus 4.6, Claude Sonnet 4.6, Claude Opus 4.5, Claude Sonnet 4.5, Claude Haiku 4.5, Claude Sonnet 4
- **Google AI** - Gemini 3 Pro, Gemini 3 Flash, Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.5 Flash Lite
- **Grok (xAI)** - Grok 4, Grok 4.1 Fast, Grok Code Fast, Grok 3
- **Perplexity** - Sonar Deep Research, Sonar Reasoning Pro, Sonar Reasoning, Sonar Pro, Sonar
- **Kimi (Moonshot AI)** - Kimi K2.5, Kimi K2

### Image generation (3 providers, 14 models)

- **Google AI** - Nano Banana Pro, Nano Banana, Imagen 4 Ultra, Imagen 4, Imagen 4 Fast
- **OpenAI** - GPT Image 1.5, GPT Image 1, GPT Image 1 Mini
- **Replicate** - FLUX.2 Pro, FLUX.2 Flex, FLUX.2 Dev, FLUX 1.1 Pro Ultra, FLUX 1.1 Pro, FLUX Schnell

## Quick setup

1. Go to **Settings > AI API** from the dashboard sidebar
2. Click on a provider tab (e.g., OpenAI)
3. Paste your API key in the key field
4. Select a model from the dropdown (recommended models are marked)
5. Click **Save**

Your key is encrypted and stored securely. LinkedGrow never shares your API key with anyone.

## Typical costs

| Usage level | Posts per month | Estimated AI cost |
|---|---|---|
| Light | 10 posts | $0.10 - $0.30 |
| Regular | 30 posts | $0.30 - $0.90 |
| Active | 60 posts | $0.60 - $1.80 |
| Heavy (with images) | 100+ posts | $3 - $8 |

Costs vary by model. Budget models like GPT-5 Nano ($0.002/post), Gemini 2.5 Flash Lite ($0.001/post), or Sonar ($0.002/post) are extremely affordable. Premium models like Claude Opus 4.6 or Sonar Reasoning Pro cost more but produce higher quality content.

## Next steps

For detailed step-by-step setup guides for each provider, see:

- [OpenAI Setup](/docs/byok/openai-setup)
- [Anthropic (Claude) Setup](/docs/byok/anthropic-setup)
- [Google AI (Gemini) Setup](/docs/byok/google-ai-setup)
- [Grok (xAI) Setup](/docs/byok/grok-setup)
- [Perplexity Setup](/docs/byok/perplexity-setup)
- [Kimi Setup](/docs/byok/kimi-setup)
- [Image Providers](/docs/byok/image-providers)
- [Cost Comparison](/docs/byok/cost-comparison)
