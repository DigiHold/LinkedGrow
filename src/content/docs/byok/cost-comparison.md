---
title: "Cost Comparison"
description: What a self hosted LinkedGrow instance costs to run, line by line, and what the AI adds at each level of usage
category: "byok"
order: 8
---

## What running an instance costs

The software itself is free, so a month is the server bill, the AI your instance actually used, and one dedicated address behind each LinkedIn account. Nothing meters your generations, and no invoice ever arrives from LinkedGrow.

### What you actually pay

| | What it costs |
|---|---|
| **LinkedGrow itself** | **Nothing, the self hosted edition is licensed under the AGPL-3.0** |
| **The server** | **Your hosting bill** |
| **AI for the agents** | **The instance key from the setup wizard, billed by that provider** |
| **AI for your posts** | **Your own key, $2-4 a month for most people** |
| **Dedicated addresses** | **Bought through Proxy-Seller from the instance, or proxies you already own** |

The 2 lines that actually move are the AI and the addresses. The AI follows how much your agents read and how much you write, under the ceilings the setup wizard set on the agent key. The addresses follow how many LinkedIn accounts you connect, because each one keeps an address of its own for good.

## Cost breakdown by usage level

Here is what real-world AI costs look like at different usage levels:

### Light usage (10 posts per month)

| Activity | Cost |
|---|---|
| 10 post generations (GPT-5.4 mini) | $0.08 |
| 5 regenerations | $0.04 |
| 10 ideas generated | $0.02 |
| **Total AI cost** | **~$0.14** |

### Regular usage (30 posts per month)

| Activity | Cost |
|---|---|
| 30 post generations (GPT-5.4 mini) | $0.24 |
| 15 regenerations | $0.12 |
| 30 ideas generated | $0.06 |
| 20 hooks generated | $0.04 |
| **Total AI cost** | **~$0.46** |

### Heavy usage with images (100 posts + 30 images per month)

| Activity | Cost |
|---|---|
| 100 post generations (Gemini 3 Flash) | $0.60 |
| 50 regenerations | $0.30 |
| 50 ideas generated | $0.10 |
| 30 hooks generated | $0.06 |
| 30 images (Nano Banana 2 Lite) | $0.90 |
| **Total AI cost** | **~$1.96** |

Even heavy usage with image generation rarely exceeds $5 per month.

## Model cost tiers

### Budget models (under $0.005 per post)

- Gemini 2.5 Flash Lite - $0.001/post
- GPT-5.4 nano - $0.002/post
- GPT-5.6 Luna - $0.002/post
- Gemini 3.1 Flash Lite - $0.003/post
- Gemini 2.5 Flash - $0.004/post
- Gemini 3.5 Flash Lite - $0.004/post
- Sonar - $0.004/post

### Value models (under $0.02 per post)

- Gemini 3 Flash - $0.006/post
- Grok 4.3 - $0.006/post
- Grok 4.20 Reasoning - $0.006/post
- Gemini 3.7 Flash - $0.007/post
- Gemini 3.6 Flash - $0.007/post
- GPT-5.4 mini - $0.008/post
- Kimi K2.6 - $0.008/post
- Kimi K2.7 Code - $0.008/post
- Claude Haiku 4.5 - $0.01/post
- Grok 4.5 - $0.013/post
- Grok 4.6 - $0.013/post
- Gemini 3.5 Flash - $0.017/post
- Gemini 2.5 Pro - $0.018/post

### Premium models ($0.02+ per post)

- Gemini 3.1 Pro - $0.02/post
- Sonar Deep Research - $0.02/post
- Sonar Reasoning Pro - $0.02/post
- GPT-5.6 Terra - $0.02/post
- Claude Sonnet 5 - $0.02/post
- GPT-5.4 - $0.03/post
- Kimi K3 - $0.03/post
- Sonar Pro - $0.03/post
- Claude Sonnet 4.6 - $0.03/post
- GPT-5.6 Sol - $0.04/post
- Claude Opus 5 - $0.05/post
- Claude Opus 4.8 - $0.05/post
- GPT-5.5 - $0.06/post
- Claude Fable 5.1 - $0.10/post
- Claude Fable 5 - $0.10/post

## A note on reasoning models

Most current models think before they answer, and providers bill those thinking tokens at the output rate. LinkedGrow sets the effort level to low on every provider that supports it, so the per-post figures above reflect what you actually pay rather than an unconfigured worst case.

## Monitoring your spending

Every AI provider offers a usage dashboard where you can:

- See real-time spending
- Set monthly spending limits
- View usage by model and day
- Download invoices

Set a $10 monthly limit when you first start, and raise it later once you know what your instance really uses.

