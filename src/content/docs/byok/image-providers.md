---
title: "Image AI Providers"
description: "Set up AI image generation with Google AI, OpenAI, or Replicate for creating visuals for your LinkedIn posts."
category: "byok"
order: 7
---

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin-bottom:24px;border-radius:12px">
<iframe src="https://www.youtube.com/embed/MAZB_3ci8RA" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
</div>

## Overview

LinkedGrow supports AI image generation from three providers. Image generation requires the Pro plan or above. You can set up one or more image providers and switch between them based on your needs.

## Google AI (Nano Banana, Imagen)

Google AI offers five image models with the same API key you use for text generation with Gemini.

**API key URL:** [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

**Key format:** `AIza...` (same key as Google text models)

**Available models:**

| Model | Quality | Price per image |
|---|---|---|
| Nano Banana Pro (Gemini 3 Pro Image) | Best quality, up to 4K | $0.13 - $0.24 |
| Nano Banana (Gemini 2.5 Flash Image) | Fast, good quality | ~$0.04 |
| Imagen 4 Ultra | Premium quality | ~$0.06 |
| Imagen 4 | Standard quality | ~$0.04 |
| Imagen 4 Fast | 10x faster generation | ~$0.02 |

**Resolution options:** 1K (~1376x768), 2K (~2752x1536), 4K (~4096x2304)

**Aspect ratios:** 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 21:9

If you already have a Google AI key for text, you do not need a separate key for images. Just configure the image provider in Settings > AI API.

## OpenAI (GPT Image)

OpenAI offers three image models using the same API key as GPT text models.

**API key URL:** [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

**Key format:** `sk-...` (same key as OpenAI text models)

**Available models:**

| Model | Quality | Price per image |
|---|---|---|
| GPT Image 1.5 | Best quality | $0.04 - $0.08 |
| GPT Image 1 | Standard | $0.01 - $0.25 |
| GPT Image 1 Mini | Most affordable | $0.005 - $0.05 |

**Resolution options:** Square (1024x1024), Landscape (1792x1024), Portrait (1024x1792)

**Quality settings:** High (best quality, slower), Medium (balanced), Low (fastest)

## Replicate (FLUX)

Replicate provides FLUX models, which are open-source image generation models known for high quality and flexibility.

**API key URL:** [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)

**Key format:** `r8_...`

**Important:** Replicate requires a separate account and API key from the text providers. It is not the same key as OpenAI or Google.

**Available models:**

| Model | Quality | Price per image |
|---|---|---|
| FLUX.2 Pro | Best quality, reference images | ~$0.05 |
| FLUX.2 Flex | Maximum quality, 10 refs | ~$0.04 |
| FLUX.2 Dev | Standard with refs | ~$0.03 |
| FLUX 1.1 Pro Ultra | 4MP output | ~$0.06 |
| FLUX 1.1 Pro | High quality | ~$0.055 |
| FLUX Schnell | Fastest, most affordable | ~$0.003 |

**Resolution options:** Square (1024x1024), Landscape (1536x1024), Portrait (1024x1536), 4MP Square (2048x2048)

## Setting up image generation

1. Go to **Settings > AI API** in LinkedGrow
2. Scroll down to the **Image Generation** section
3. Select your image provider
4. Paste your API key (or confirm it is already configured if using the same key as text)
5. Choose a model, resolution, and aspect ratio
6. Click **Save**

## Which provider should you choose?

- **Google AI** - Best if you already have a Gemini key. The Imagen 4 Fast model at $0.02/image is very affordable.
- **OpenAI** - Best if you already have a GPT key. GPT Image 1 Mini is the cheapest option at $0.005/image.
- **Replicate** - Best for highest quality open-source models. FLUX Schnell at $0.003/image is the cheapest overall.

## Plan availability

Image generation is available on Pro and Business plans.
