---
title: "Anthropic (Claude) Setup"
description: "How to create an Anthropic account, get your API key, and configure Claude models in LinkedGrow."
category: "byok"
order: 3
---

## Overview

Anthropic provides Claude Opus 4.6, Claude Sonnet 4.6, Claude Opus 4.5, Claude Sonnet 4.5, Claude Haiku 4.5, and Claude Sonnet 4 models. Claude models are known for their natural, conversational writing style, making them excellent for LinkedIn content.

## Step 1 - Create an Anthropic account

1. Go to [console.anthropic.com](https://console.anthropic.com/settings/keys)
2. Click **Sign up** to create a new account
3. Verify your email address

## Step 2 - Set up billing

1. In the Anthropic Console, go to **Settings > Billing**
2. Click **Add payment method**
3. Enter your credit or debit card details
4. Optionally set a monthly spending limit

Anthropic uses pay-as-you-go billing. You only pay for what you use.

## Step 3 - Generate your API key

1. Go to [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Click **Create Key**
3. Give it a name (e.g., "LinkedGrow")
4. Copy the key immediately - it starts with `sk-ant-` and will not be shown again

## Step 4 - Configure in LinkedGrow

1. Go to **Settings > AI API** in LinkedGrow
2. Click the **Anthropic** tab
3. Paste your API key in the key field
4. Select a model from the dropdown
5. Click **Save**

## Available models

| Model | Best for | Cost per post | Monthly estimate (30 posts) |
|---|---|---|---|
| Claude Opus 4.6 | Highest quality, nuanced content | ~$0.05 | ~$1.50 |
| Claude Sonnet 4.6 (Recommended) | Best balance of quality and speed | ~$0.03 | ~$0.90 |
| Claude Opus 4.5 | Premium quality | ~$0.05 | ~$1.50 |
| Claude Sonnet 4.5 | Balanced performance | ~$0.03 | ~$0.90 |
| Claude Haiku 4.5 | Fastest and most affordable | ~$0.01 | ~$0.30 |
| Claude Sonnet 4 | Reliable, well-tested | ~$0.03 | ~$0.90 |

**Recommendation:** Start with **Claude Sonnet 4.6** for the best balance of writing quality and cost. Claude models tend to produce very natural-sounding content that works well for personal branding on LinkedIn.

## Key format

Anthropic API keys start with `sk-ant-` followed by a long string. If your key does not match this format, verify you copied it from the correct page.

## Monitoring your spending

Track your usage in the Anthropic Console under **Settings > Usage**. You can review costs by day and by model to understand your spending patterns.
