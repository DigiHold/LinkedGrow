---
title: "Kimi (Moonshot AI) Setup"
description: "How to create a Moonshot AI account, get your API key, and configure Kimi models in LinkedGrow."
category: "byok"
order: 6
---

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin-bottom:24px;border-radius:12px">
<iframe src="https://www.youtube.com/embed/jcEwghFuLeM" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
</div>

## Overview

Moonshot AI provides the Kimi model family, and LinkedGrow supports Kimi K3, Kimi K2.6, and Kimi K2.7 Code. Kimi is strong at reasoning and long context work, and it costs less per token than most frontier models, which makes it a practical choice if you post often.

## Step 1 - Create a Moonshot AI account

1. Go to [platform.kimi.ai](https://platform.kimi.ai/)
2. Click **Sign Up** or sign in with your Google account
3. Verify your email address

## Step 2 - Add balance to your account

1. Open the [Kimi Console](https://platform.kimi.ai/console) and go to the billing section
2. Add a payment method
3. Recharge at least $1 to start using the API

## Step 3 - Generate your API key

1. Go to [platform.kimi.ai/console/api-keys](https://platform.kimi.ai/console/api-keys)
2. Click **Create API Key**
3. Give your key a descriptive name, for example "LinkedGrow"
4. Copy the key right away, because Moonshot shows it only once

## Step 4 - Configure in LinkedGrow

1. Go to **Settings > AI API** in your LinkedGrow dashboard
2. Click the **Kimi** tab
3. Paste your API key in the key field
4. Select a model from the dropdown
5. Click **Save**

## Available models

| Model | Best for | Cost per post | Monthly estimate (30 posts) |
|---|---|---|---|
| Kimi K3 | Highest quality, long context work | ~$0.03 | ~$0.90 |
| Kimi K2.6 (Recommended) | Everyday posts at the lowest cost | ~$0.008 | ~$0.24 |
| Kimi K2.7 Code | Technical and engineering content | ~$0.008 | ~$0.24 |

**Recommendation:** Kimi K2.6 is the right default for most people. It writes LinkedIn posts well and costs roughly a quarter of what K3 costs per post. Move up to Kimi K3 when you want the strongest reasoning and its 1M token context window, and pick Kimi K2.7 Code if most of your posts cover engineering topics.

## Pricing details

Kimi bills by token, and 1,000 tokens covers roughly 750 words.

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|---|---|---|
| Kimi K3 | $3.00 | $15.00 |
| Kimi K2.6 | $0.95 | $4.00 |
| Kimi K2.7 Code | $0.95 | $4.00 |

Kimi also caches prompts, so when one repeats, the input rate drops to $0.30 per million tokens on K3, $0.16 on K2.6, and $0.19 on K2.7 Code.

## How K3 handles reasoning

Kimi K3 always runs in thinking mode, and Moonshot bills those reasoning tokens at the output rate. LinkedGrow sets the reasoning effort to low on every K3 request, which keeps one post from costing several times what the same prompt costs on K2.6. You do not need to configure anything for this.

## Key format

Kimi API keys start with `sk-` followed by a string of characters. Keep your key somewhere safe until you paste it in, and LinkedGrow encrypts it with AES-256-GCM once you save it.

## Monitoring your spending

Track your usage and costs in the [Kimi Console](https://platform.kimi.ai/console). Review your call history and remaining balance to keep spending under control.
