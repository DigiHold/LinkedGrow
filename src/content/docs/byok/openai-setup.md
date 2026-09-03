---
title: "OpenAI Setup"
description: "How to create an OpenAI account, get your API key, set up billing, and configure GPT-5.6 and other OpenAI models in LinkedGrow."
category: "byok"
order: 2
---

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin-bottom:24px;border-radius:12px">
<iframe src="https://www.youtube.com/embed/tdw3icQGIv0" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
</div>

## Overview

OpenAI provides the GPT-5.6 family, made up of Sol, Terra and Luna, alongside GPT-5.5 and the GPT-5.4 models. All of them write LinkedIn content well, and the range covers everything from a fraction of a cent per post to premium quality.

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
5. Set a monthly spending limit if you want one, and $10 covers most users comfortably

OpenAI bills pay-as-you-go, so you are only charged for what you actually use, and there is no minimum deposit.

## Step 3 - Generate your API key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **Create new secret key**
3. Give it a name, for example "LinkedGrow"
4. Click **Create**
5. Copy the key immediately, because it starts with `sk-` and will not be shown again

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
| GPT-5.6 Sol | Highest quality, hardest reasoning | ~$0.04 | ~$1.20 |
| GPT-5.6 Terra (Recommended) | Balanced quality and cost | ~$0.02 | ~$0.66 |
| GPT-5.6 Luna | Fast, cheap drafting work | ~$0.002 | ~$0.07 |
| GPT-5.5 | Complex professional writing | ~$0.06 | ~$1.80 |
| GPT-5.4 | Reliable, well tested quality | ~$0.03 | ~$0.90 |
| GPT-5.4 mini | Best value in the older lineup | ~$0.008 | ~$0.25 |
| GPT-5.4 nano | Cheapest option available | ~$0.002 | ~$0.07 |

**Recommendation:** GPT-5.6 Terra is the model LinkedGrow marks as recommended and the right starting point for most people. It writes solid LinkedIn posts for about 2 cents each. Move down to GPT-5.6 Luna when volume matters more than polish, or up to GPT-5.6 Sol when quality matters more than the bill.

## Pricing details

OpenAI bills by token, and 1,000 tokens covers roughly 750 words.

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|---|---|---|
| GPT-5.6 Sol | $4.00 | $20.00 |
| GPT-5.6 Terra | $2.00 | $12.00 |
| GPT-5.6 Luna | $0.20 | $1.20 |
| GPT-5.5 | $5.00 | $30.00 |
| GPT-5.4 | $2.50 | $15.00 |
| GPT-5.4 mini | $0.75 | $4.50 |
| GPT-5.4 nano | $0.20 | $1.25 |

## How reasoning affects your bill

Every GPT-5 model reasons before it answers, and OpenAI bills those reasoning tokens at the output rate. LinkedGrow sets the reasoning effort to low on every request, which keeps a single post from costing several times the headline rate. You do not need to configure anything for this.

## Key format

OpenAI API keys start with `sk-` followed by a long string of characters. If your key does not start with `sk-`, double check that you copied it correctly.

## Monitoring your spending

Track your API usage and costs at [platform.openai.com/usage](https://platform.openai.com/usage). You can set monthly spending limits in Billing settings to prevent unexpected charges.

## Image generation

OpenAI also supports image generation through GPT Image 2, with GPT Image 1.5, GPT Image 1 and GPT Image 1 Mini kept as legacy choices. The same API key works for text and images. See [Image Providers](/docs/byok/image-providers) for details on setting up image AI.
