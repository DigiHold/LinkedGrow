---
title: "Anthropic (Claude) Setup"
description: "How to create an Anthropic account, get your API key, and configure Claude models in LinkedGrow."
category: "byok"
order: 3
---

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin-bottom:24px;border-radius:12px">
<iframe src="https://www.youtube.com/embed/D5Fl6ACfsis" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
</div>

## Overview

Anthropic provides Claude Fable 5, Claude Opus 4.8, Claude Sonnet 5, Claude Haiku 4.5, Claude Opus 4.7 and Claude Sonnet 4.6. Claude models are known for their natural, conversational writing style, which makes them a strong fit for LinkedIn content.

## Step 1 - Create an Anthropic account

1. Go to [console.anthropic.com](https://console.anthropic.com/settings/keys)
2. Click **Sign up** to create a new account
3. Verify your email address

## Step 2 - Set up billing

1. In the Anthropic Console, go to **Settings > Billing**
2. Click **Add payment method**
3. Enter your credit or debit card details
4. Optionally set a monthly spending limit

Anthropic bills pay-as-you-go, so you only pay for what you actually use.

## Step 3 - Generate your API key

1. Go to [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Click **Create Key**
3. Give it a name, for example "LinkedGrow"
4. Copy the key immediately, because it starts with `sk-ant-` and will not be shown again

## Step 4 - Configure in LinkedGrow

1. Go to **Settings > AI API** in LinkedGrow
2. Click the **Anthropic** tab
3. Paste your API key in the key field
4. Select a model from the dropdown
5. Click **Save**

## Available models

| Model | Best for | Cost per post | Monthly estimate (30 posts) |
|---|---|---|---|
| Claude Fable 5 | The most demanding reasoning work | ~$0.10 | ~$3.00 |
| Claude Opus 4.8 | Highest quality, nuanced content | ~$0.05 | ~$1.50 |
| Claude Sonnet 5 (Recommended) | Best balance of quality and cost | ~$0.03 | ~$0.90 |
| Claude Haiku 4.5 | Fastest and most affordable | ~$0.01 | ~$0.30 |
| Claude Opus 4.7 | Previous flagship, still excellent | ~$0.05 | ~$1.50 |
| Claude Sonnet 4.6 | Reliable, well-tested balance | ~$0.03 | ~$0.90 |

**Recommendation:** Claude Sonnet 5 is the default in LinkedGrow and suits most people. Claude models tend to produce natural-sounding content that works well for personal branding, and Sonnet 5 gives you close to Opus quality at a third of the price. Choose Claude Opus 4.8 or Claude Fable 5 when a post really has to land.

## Pricing details

Anthropic bills by token, and 1,000 tokens covers roughly 750 words.

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|---|---|---|
| Claude Fable 5 | $10.00 | $50.00 |
| Claude Opus 4.8 | $5.00 | $25.00 |
| Claude Sonnet 5 | $3.00 | $15.00 |
| Claude Haiku 4.5 | $1.00 | $5.00 |
| Claude Opus 4.7 | $5.00 | $25.00 |
| Claude Sonnet 4.6 | $3.00 | $15.00 |

## How thinking affects your bill

Claude Sonnet 5 and Claude Fable 5 think before they answer, and Anthropic bills those thinking tokens at the output rate. LinkedGrow sets the effort level to low on every request that supports it, which keeps a single post from costing several times the headline rate. You do not need to configure anything for this.

## Key format

Anthropic API keys start with `sk-ant-` followed by a long string. If your key does not match this format, verify you copied it from the correct page.

## Monitoring your spending

Track your usage in the Anthropic Console under **Settings > Usage**. You can review costs by day and by model to understand your spending patterns.
