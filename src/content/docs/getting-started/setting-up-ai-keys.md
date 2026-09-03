---
title: "Setting Up AI API Keys"
description: Overview of the BYOK model and how to configure your AI API key for content generation in LinkedGrow.
category: "getting-started"
order: 3
---

## What is BYOK?

BYOK stands for Bring Your Own Key. LinkedGrow never resells AI, so you connect an API key of your own from OpenAI, Anthropic, Google, Grok, Perplexity or Kimi, and that provider bills you directly at their published rates.

Nothing meters your generations, so what you spend follows what you write and which model you picked. The table further down turns that into a rough monthly figure.

## Supported providers

### Text generation (6 providers, 35 models)

- **OpenAI** - GPT-5.6 Sol, GPT-5.6 Terra, GPT-5.6 Luna, GPT-5.5, GPT-5.4, GPT-5.4 mini, GPT-5.4 nano
- **Anthropic** - Claude Fable 5.1, Claude Opus 5, Claude Sonnet 5, Claude Haiku 4.5, Claude Opus 4.8, Claude Fable 5, Claude Sonnet 4.6
- **Google AI** - Gemini 3.7 Flash, Gemini 3.6 Flash, Gemini 3.5 Flash, Gemini 3.5 Flash Lite, Gemini 3.1 Pro, Gemini 3.1 Flash Lite, Gemini 3 Flash, Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.5 Flash Lite
- **Grok (xAI)** - Grok 4.6, Grok 4.5, Grok 4.3, Grok 4.20 Reasoning
- **Perplexity** - Sonar Deep Research, Sonar Reasoning Pro, Sonar Pro, Sonar
- **Kimi (Moonshot AI)** - Kimi K3, Kimi K2.7 Code, Kimi K2.6

### Image generation (3 providers)

- **Google AI** - Nano Banana Pro, Nano Banana 2, Nano Banana 2 Lite
- **OpenAI** - GPT Image 2, GPT Image 1.5, GPT Image 1, GPT Image 1 Mini
- **Replicate** - FLUX.2 Max, FLUX.2 Pro, FLUX.2 Flex, FLUX.2 Dev, FLUX.2 Klein 4B, FLUX 1.1 Pro Ultra, FLUX Schnell

## Quick setup

1. Go to **Settings > AI API** from the dashboard sidebar
2. Click on a provider tab (e.g., OpenAI)
3. Paste your API key in the key field
4. Select a model from the dropdown (recommended models are marked)
5. Click **Save**

Your key is encrypted before it is written to the database, and LinkedGrow never shares it with anyone else on the instance.

## Typical costs

| Usage level | Posts per month | Estimated AI cost |
|---|---|---|
| Light | 10 posts | $0.07 - $0.50 |
| Regular | 30 posts | $0.21 - $1.50 |
| Active | 60 posts | $0.42 - $3.00 |
| Heavy | 100 posts | $0.70 - $5.00 |

Those figures follow the models LinkedGrow marks as recommended, which run from $0.007 a post on Gemini 3.7 Flash to $0.05 a post on Claude Opus 5. Budget models go lower still, down to $0.001 a post on Gemini 2.5 Flash Lite, and the dearest model on the list is Claude Fable 5.1 at $0.10 a post. Images are billed on top of that, from $0.003 each on FLUX Schnell to $0.24 on Nano Banana Pro.

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
