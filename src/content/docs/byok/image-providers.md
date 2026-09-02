---
title: "Image AI Providers"
description: Set up AI image generation with Google AI, OpenAI, or Replicate for creating visuals for your LinkedIn posts.
category: "byok"
order: 7
---

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin-bottom:24px;border-radius:12px">
<iframe src="https://www.youtube.com/embed/MAZB_3ci8RA" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
</div>

## Overview

LinkedGrow supports AI image generation from three providers. You can set up more than one image provider and switch between them depending on what you need.

## Google AI (Nano Banana)

Google AI offers four image models, and they use the same API key as your Gemini text models.

**API key URL:** [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

**Key format:** `AIza...` (same key as Google text models)

**Available models:**

| Model | Quality | Price per image |
|---|---|---|
| Nano Banana Pro (Gemini 3 Pro Image) | Best quality, up to 4K | $0.13 - $0.24 |
| Nano Banana 2 (Gemini 3.1 Flash Image) | Balanced quality and cost | $0.07 - $0.15 |
| Nano Banana (Gemini 2.5 Flash Image) | Fast, good quality | ~$0.04 |
| Nano Banana Lite (Gemini 3.1 Flash Lite Image) | Cheapest Google option | ~$0.03 |

**Resolution options:** 1K (~1376x768), 2K (~2752x1536), 4K (~4096x2304)

**Aspect ratios:** 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 21:9

If you already have a Google AI key for text, you do not need a separate key for images. Configure the image provider in Settings > AI API and reuse the key you already saved.

## OpenAI (GPT Image)

OpenAI offers two image models using the same API key as its text models.

**API key URL:** [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

**Key format:** `sk-...` (same key as OpenAI text models)

**Available models:**

| Model | Quality | Price per image |
|---|---|---|
| GPT Image 2 | Best quality | $0.006 - $0.21 |
| GPT Image 1.5 | Standard | $0.009 - $0.13 |

**Resolution options:** Square (1024x1024), Horizontal (1792x1024), Portrait (1024x1792)

**Quality settings:** High (best quality, slower), Medium (balanced), Low (fastest)

The wide price range on both models comes from the quality setting and the resolution you pick, so a low-quality square image sits at the bottom of the range and a high-quality wide image sits at the top.

## Replicate (FLUX)

Replicate provides the FLUX models, which are open-weight image models known for quality and fine control.

**API key URL:** [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)

**Key format:** `r8_...`

**Important:** Replicate requires its own account and API key. Your OpenAI or Google key will not work here.

**Available models:**

| Model | Quality | Price per image |
|---|---|---|
| FLUX.2 Max | Highest fidelity | See Replicate pricing |
| FLUX.2 Pro | Best quality, 8 reference images | ~$0.05 |
| FLUX.2 Flex | Typography, 10 reference images | ~$0.04 |
| FLUX.2 Dev | Standard, supports references | ~$0.03 |
| FLUX.2 Klein 4B | Sub-second generation | See Replicate pricing |
| FLUX 1.1 Pro Ultra | 4MP output | ~$0.06 |
| FLUX Schnell | Fastest and cheapest | ~$0.003 |

**Resolution options:** Square (1024x1024), Horizontal (1536x1024), Portrait (1024x1536), 4MP Square (2048x2048)

## Setting up image generation

1. Go to **Settings > AI API** in LinkedGrow
2. Scroll down to the **Image Generation** section
3. Select your image provider
4. Paste your API key, or confirm it is already configured if you reuse your text key
5. Choose a model, resolution, and aspect ratio
6. Click **Save**

## Which provider should you choose?

Google AI makes the most sense if you already have a Gemini key, and Nano Banana Lite at roughly $0.03 per image is its cheapest option. OpenAI is the natural pick if you already run GPT for text, where GPT Image 2 starts around $0.006 per image at the lowest quality setting. Replicate is worth the separate account when you want open-weight models or reference-image control, and FLUX Schnell at roughly $0.003 per image is the cheapest option across all three providers.
