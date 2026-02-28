---
title: "Google AI (Gemini) Setup"
description: "How to get your Google AI API key from AI Studio and configure Gemini models in LinkedGrow."
category: "byok"
order: 4
---

## Overview

Google AI provides Gemini 3 Pro, Gemini 3 Flash, Gemini 2.5 Pro, Gemini 2.5 Flash, and Gemini 2.5 Flash Lite models. Gemini models offer excellent value, with some of the most affordable options available.

## Step 1 - Go to Google AI Studio

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with your Google account (any Gmail or Google Workspace account works)

## Step 2 - Create your API key

1. Click **Create API Key**
2. Select a Google Cloud project (or create a new one if prompted)
3. Your API key is generated immediately
4. Copy the key - it starts with `AIza`

Google AI Studio provides a free tier with limited requests. For consistent usage, you may want to set up billing in your Google Cloud Console to avoid hitting free tier limits.

## Step 3 - Configure in LinkedGrow

1. Go to **Settings > AI API** in LinkedGrow
2. Click the **Gemini** tab
3. Paste your API key in the key field
4. Select a model from the dropdown
5. Click **Save**

## Available models

| Model | Best for | Cost per post | Monthly estimate (30 posts) |
|---|---|---|---|
| Gemini 3 Pro | Highest quality | ~$0.03 | ~$0.90 |
| Gemini 3 Flash (Recommended) | Best value for quality | ~$0.006 | ~$0.18 |
| Gemini 2.5 Pro | Deep reasoning | ~$0.02 | ~$0.60 |
| Gemini 2.5 Flash | Fast and affordable | ~$0.005 | ~$0.15 |
| Gemini 2.5 Flash Lite | Cheapest option available | ~$0.001 | ~$0.03 |

**Recommendation:** **Gemini 3 Flash** offers an outstanding balance of quality and cost. At just $0.006 per post, it is one of the most affordable options for high-quality content. Gemini 2.5 Flash Lite is the absolute cheapest option if you want to minimize costs.

## Key format

Google AI API keys start with `AIza` followed by a string of characters. They look different from OpenAI or Anthropic keys.

## Image generation with the same key

The same Google AI API key also works for image generation (Nano Banana Pro, Nano Banana, Imagen 4 Ultra, Imagen 4, Imagen 4 Fast). If you set up Google AI for text, you can use the same key for images without creating a separate account. See [Image Providers](/docs/byok/image-providers) for setup details.

## Monitoring your spending

Track your API usage in the [Google Cloud Console](https://console.cloud.google.com/) under the APIs & Services section. You can set up billing alerts to monitor spending.
