---
title: "OpenAI Setup"
description: "How to create an OpenAI account, get your API key, set up billing, and configure it in LinkedGrow for GPT-5, o4-mini, and other models."
category: "byok"
order: 2
---

## Overview

OpenAI provides GPT-5.2, GPT-5, GPT-5 Nano, o4-mini, o3, and o3-mini models. These are versatile models that work well for LinkedIn content generation, with options ranging from ultra-affordable to premium quality.

## Step 1 - Create an OpenAI account

1. Go to [platform.openai.com](https://platform.openai.com/api-keys)
2. Click **Sign up** if you do not have an account
3. Verify your email address

## Step 2 - Set up billing

Before you can use the API, you need to add a payment method:

1. Go to your OpenAI dashboard
2. Navigate to **Settings > Billing**
3. Click **Add payment method**
4. Enter your credit or debit card details
5. Set a monthly spending limit if desired (recommended - $10 is more than enough for most users)

OpenAI uses pay-as-you-go billing. You are only charged for what you use. There is no minimum deposit required.

## Step 3 - Generate your API key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **Create new secret key**
3. Give it a name (e.g., "LinkedGrow")
4. Click **Create**
5. Copy the key immediately - it starts with `sk-` and will not be shown again

**Important:** Save your key somewhere safe. If you lose it, you will need to generate a new one.

## Step 4 - Configure in LinkedGrow

1. Go to **Settings > AI API** in LinkedGrow
2. Click the **OpenAI** tab
3. Paste your API key in the key field
4. Select a model from the dropdown
5. Click **Save**

## Available models

| Model | Best for | Cost per post | Monthly estimate (30 posts) |
|---|---|---|---|
| GPT-5.2 | Highest quality content | ~$0.03 | ~$0.90 |
| GPT-5 | Balanced quality and cost | ~$0.02 | ~$0.60 |
| GPT-5 Nano | Fastest, most affordable | ~$0.002 | ~$0.06 |
| o4-mini (Recommended) | Best value for quality | ~$0.01 | ~$0.30 |
| o3 | Deep reasoning tasks | ~$0.02 | ~$0.60 |
| o3-mini | Fast reasoning | ~$0.005 | ~$0.15 |

**Recommendation:** Start with **o4-mini** for the best balance of quality and cost. It is marked as "Recommended" in LinkedGrow for a reason - it produces excellent LinkedIn content at a very low cost.

## Key format

OpenAI API keys start with `sk-` followed by a long string of characters. If your key does not start with `sk-`, double check that you copied it correctly.

## Monitoring your spending

Track your API usage and costs at [platform.openai.com/usage](https://platform.openai.com/usage). You can set monthly spending limits in Billing settings to prevent unexpected charges.

## Image generation

OpenAI also supports image generation (GPT Image 1.5, GPT Image 1, GPT Image 1 Mini). The same API key works for both text and image generation. See [Image Providers](/docs/byok/image-providers) for details on setting up image AI.
