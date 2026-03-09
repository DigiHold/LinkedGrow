---
title: "Kimi (Moonshot AI) Setup"
description: "How to create a Moonshot AI account, get your API key, and configure Kimi models in LinkedGrow."
category: "byok"
order: 6
---

## Overview

Moonshot AI provides the Kimi model family - Kimi K2.5 and Kimi K2. Kimi models are known for strong reasoning, long context support (up to 262K tokens), and competitive pricing that makes them an excellent choice for LinkedIn content generation.

## Step 1 - Create a Moonshot AI account

1. Go to [platform.moonshot.ai](https://platform.moonshot.ai/)
2. Click **Sign Up** or sign in with your Google account
3. Verify your email address

## Step 2 - Add balance to your account

1. Navigate to [platform.moonshot.ai/console/pay](https://platform.moonshot.ai/console/pay)
2. Add a payment method
3. Recharge at least $1 to start using the API
4. When your cumulative recharge reaches $5, you receive a $5 bonus voucher

## Step 3 - Generate your API key

1. Go to [platform.moonshot.ai/console/api-keys](https://platform.moonshot.ai/console/api-keys)
2. Click **Create API Key**
3. Give your key a descriptive name (e.g., "LinkedGrow")
4. Copy the key immediately - it starts with `sk-` and will only be shown once

## Step 4 - Configure in LinkedGrow

1. Go to **Settings > AI API** in your LinkedGrow dashboard
2. Click the **Kimi** tab
3. Paste your API key in the key field
4. Select a model from the dropdown
5. Click **Save**

## Available models

| Model | Best for | Cost per post | Monthly estimate (30 posts) |
|---|---|---|---|
| Kimi K2.5 | Highest quality, multimodal reasoning | ~$0.02 | ~$0.60 |
| Kimi K2 (Recommended) | Best value, strong text and coding | ~$0.015 | ~$0.45 |

**Recommendation:** **Kimi K2** offers the best balance of quality and price for LinkedIn content. It produces well-structured, engaging posts at very competitive rates. Choose **Kimi K2.5** if you want the latest and most capable model with multimodal support.

## Pricing details

Kimi pricing is based on tokens (roughly 750 words per 1,000 tokens):

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|---|---|---|
| Kimi K2.5 | $0.60 | $3.00 |
| Kimi K2 | $0.60 | $2.50 |

Kimi also supports prompt caching, which can reduce input costs to as low as $0.10-0.15 per million tokens for repeated prompts.

## Key format

Kimi API keys start with `sk-` followed by a string of characters. Store your key securely - LinkedGrow encrypts it with AES-256-GCM.

## Monitoring your spending

Track your API usage and costs in the Moonshot AI Console at [platform.moonshot.ai/console](https://platform.moonshot.ai/console). Review your call history, token usage, and remaining balance to keep spending under control.
