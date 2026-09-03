---
title: "Grok (xAI) Setup"
description: "How to create an xAI account, get your API key, and configure Grok models in LinkedGrow."
category: "byok"
order: 5
---

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin-bottom:24px;border-radius:12px">
<iframe src="https://www.youtube.com/embed/Tgw-b13tKEI" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
</div>

## Overview

xAI provides Grok 4.6, Grok 4.5, Grok 4.3 and Grok 4.20 Reasoning. Grok models are known for a conversational, engaging writing style and good awareness of what is currently being discussed, which makes them a solid choice for LinkedIn content.

## Step 1 - Create an xAI account

1. Go to [console.x.ai](https://console.x.ai/team/default/api-keys)
2. Create an account or sign in
3. Verify your email

## Step 2 - Set up billing

1. In the xAI Console, navigate to billing settings
2. Add a payment method, either a credit or debit card
3. xAI bills pay-as-you-go, so you only pay for what you use

## Step 3 - Generate your API key

1. Go to [console.x.ai/team/default/api-keys](https://console.x.ai/team/default/api-keys)
2. Click **Create API Key**
3. Copy the key, which starts with `xai-`

## Step 4 - Configure in LinkedGrow

1. Go to **Settings > AI API** in LinkedGrow
2. Click the **Grok** tab
3. Paste your API key in the key field
4. Select a model from the dropdown
5. Click **Save**

## Available models

| Model | Best for | Cost per post | Monthly estimate (30 posts) |
|---|---|---|---|
| Grok 4.6 (Recommended) | Highest quality on the list | ~$0.013 | ~$0.39 |
| Grok 4.5 | The same price, one release back | ~$0.013 | ~$0.39 |
| Grok 4.3 | Fastest and cheapest | ~$0.006 | ~$0.19 |
| Grok 4.20 Reasoning | Reasoning through a problem in steps | ~$0.006 | ~$0.19 |

**Recommendation:** Grok 4.6 is the model LinkedGrow marks as recommended, and it writes engaging, natural LinkedIn posts. Drop to Grok 4.3 when you want the cheapest and fastest option, and pick Grok 4.20 Reasoning when a post needs the model to work through something step by step.

## Pricing details

xAI bills by token, and 1,000 tokens covers roughly 750 words.

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|---|---|---|
| Grok 4.6 | $2.00 | $6.00 |
| Grok 4.5 | $2.00 | $6.00 |
| Grok 4.3 | $1.25 | $2.50 |
| Grok 4.20 Reasoning | $1.25 | $2.50 |

xAI doubles these rates for prompts over 200,000 tokens. LinkedGrow prompts stay well under that limit, so the rates above are what you will actually pay.

## Key format

Grok API keys start with `xai-` followed by a string of characters.

## Monitoring your spending

Track your usage in the xAI Console dashboard. Review your API call history and costs to monitor spending.
