---
title: "Google AI (Gemini) Setup"
description: "How to get your Google AI API key from AI Studio and configure Gemini models in LinkedGrow."
category: "byok"
order: 4
---

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin-bottom:24px;border-radius:12px">
<iframe src="https://www.youtube.com/embed/srqZeIOCQ-w" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
</div>

## Overview

Google AI provides Gemini 3.7 Flash, Gemini 3.6 Flash, Gemini 3.5 Flash, Gemini 3.5 Flash Lite, Gemini 3.1 Pro, Gemini 3.1 Flash Lite, Gemini 3 Flash, Gemini 2.5 Pro, Gemini 2.5 Flash and Gemini 2.5 Flash Lite. Gemini offers some of the best value of any provider, and the Flash models are the cheapest way to run LinkedGrow.

## Step 1 - Go to Google AI Studio

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with your Google account, and any Gmail or Google Workspace account works

## Step 2 - Create your API key

1. Click **Create API Key**
2. Select a Google Cloud project, or create a new one if prompted
3. Your API key is generated immediately
4. Copy the key, which starts with `AIza`

Google AI Studio provides a free tier with limited requests. For consistent usage, set up billing in your Google Cloud Console so the free tier limits do not slow you down.

## Step 3 - Configure in LinkedGrow

1. Go to **Settings > AI API** in LinkedGrow
2. Click the **Gemini** tab
3. Paste your API key in the key field
4. Select a model from the dropdown
5. Click **Save**

## Available models

| Model | Best for | Cost per post | Monthly estimate (30 posts) |
|---|---|---|---|
| Gemini 3.7 Flash (Recommended) | Best value for quality | ~$0.007 | ~$0.21 |
| Gemini 3.6 Flash | The same balance, one release back | ~$0.007 | ~$0.21 |
| Gemini 3.5 Flash | Strong quality at Flash speed | ~$0.017 | ~$0.50 |
| Gemini 3.5 Flash Lite | Cheap and still capable | ~$0.004 | ~$0.12 |
| Gemini 3.1 Pro | Highest quality | ~$0.02 | ~$0.66 |
| Gemini 3.1 Flash Lite | Very cheap and still capable | ~$0.003 | ~$0.09 |
| Gemini 3 Flash | Fast, previous generation | ~$0.006 | ~$0.18 |
| Gemini 2.5 Pro | Deep reasoning | ~$0.018 | ~$0.53 |
| Gemini 2.5 Flash | Fast and affordable | ~$0.004 | ~$0.12 |
| Gemini 2.5 Flash Lite | Cheapest option available | ~$0.001 | ~$0.03 |

**Recommendation:** Gemini 3.7 Flash gives you the best balance of quality and cost. At roughly $0.007 per post it is one of the cheapest ways to get good content, and Gemini 2.5 Flash Lite is cheaper still if you want to push costs to the floor.

## Pricing details

Google bills by token, and 1,000 tokens covers roughly 750 words.

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|---|---|---|
| Gemini 3.7 Flash | $0.75 | $3.75 |
| Gemini 3.6 Flash | $0.75 | $3.75 |
| Gemini 3.5 Flash | $1.50 | $9.00 |
| Gemini 3.5 Flash Lite | $0.30 | $2.50 |
| Gemini 3.1 Pro | $2.00 | $12.00 |
| Gemini 3.1 Flash Lite | $0.25 | $1.50 |
| Gemini 3 Flash | $0.50 | $3.00 |
| Gemini 2.5 Pro | $1.25 | $10.00 |
| Gemini 2.5 Flash | $0.30 | $2.50 |
| Gemini 2.5 Flash Lite | $0.10 | $0.40 |

Google lists $0.75 and $3.75 on Gemini 3.7 Flash as a launch price that runs to the end of 2026, and $1.50 and $7.50 after it.

Google charges higher rates on the Pro models for prompts over 200,000 tokens. LinkedGrow prompts stay far below that, so the rates above are what you will actually pay.

## Key format

Google AI API keys start with `AIza` followed by a string of characters. They look different from OpenAI or Anthropic keys.

## Image generation with the same key

The same Google AI API key also works for image generation through Nano Banana Pro, Nano Banana 2 and Nano Banana 2 Lite. If you set up Google AI for text, the same key covers images without creating a separate account. See [Image Providers](/docs/byok/image-providers) for setup details.

## Monitoring your spending

Track your API usage in the [Google Cloud Console](https://console.cloud.google.com/) under the APIs and Services section. You can set up billing alerts to monitor spending.
