---
title: "General FAQ"
description: Answers to frequently asked questions about LinkedGrow, AI costs, LinkedIn integration, security, and more.
category: "faq"
order: 1
---

## What is LinkedGrow?

LinkedGrow is an AI-powered LinkedIn content creation and scheduling platform. It helps you write better LinkedIn posts, schedule them in advance, and grow your audience with data-driven insights. LinkedGrow uses a BYOK (Bring Your Own Key) model, which means you connect your own AI provider API key and only pay for the AI usage you actually consume.

## What is BYOK (Bring Your Own Key)?

BYOK stands for Bring Your Own Key. LinkedGrow never resells AI, so you connect an API key of your own from OpenAI, Anthropic, Google, Grok, Perplexity or Kimi, and that provider bills you directly at their published rates. You choose the model, you see every cent of it in your provider's dashboard, and you can change either one whenever you want.

For setup instructions, see the [BYOK documentation](/docs/byok).

## How much does the AI cost?

The AI costs whatever your provider charges for what your instance used, and nothing is added on top of it. A generated post runs from a fraction of a cent to a few cents depending on the model, so the monthly figure follows how much you write. The agents spend a separate key, the one the administrator pasted in the setup wizard, under a daily ceiling per agent and a monthly ceiling per LinkedIn account.

You can monitor your AI spending directly through your AI provider's dashboard (such as the OpenAI usage page or Anthropic console).

## Do I need LinkedIn Premium to use LinkedGrow?

No, LinkedGrow works with any LinkedIn account, including free LinkedIn accounts. You do not need LinkedIn Premium, Sales Navigator, or any other paid LinkedIn subscription to use LinkedGrow.

## Will my posts sound like they were written by AI?

No, not if you use the voice training feature. LinkedGrow's voice training analyzes your existing writing style and trains the AI to match your tone, vocabulary, and patterns. The result is content that sounds authentically like you, not like generic AI output. You can also edit every post before publishing to add your personal touch.

## What is the Algorithm Score?

The Algorithm Score is a real-time rating that evaluates how well your post is optimized for LinkedIn's algorithm. It analyzes factors like post length, formatting, hook strength, call to action, hashtag usage, and readability. The score updates as you edit, giving you instant feedback to improve your post's potential reach before publishing.

## What is different about running it yourself

- **You own the installation** - the code is licensed under the AGPL-3.0 and the instance runs on your server, so your leads and your drafts never leave it
- **No LinkedIn API** - the agents work in a real Chrome signed in to your account, which is why they can invite, message and publish at all
- **Voice training** - the generator learns how you write instead of producing a house tone
- **Your own AI key** - the bill arrives from your provider for exactly what you used, and you pick the model it runs on
- **No tier to unlock** - every feature is available to every user of the instance, and the only limits are the ones the administrator sets

## Can I use multiple AI providers?

Yes, LinkedGrow supports multiple AI providers, and you can switch between them at any time. In your BYOK settings, you can configure API keys for different providers and choose which one to use for content generation. This lets you compare outputs from different models and use whichever one works best for your needs.

## Is my API key secure?

Yes, your API key is encrypted at rest and in transit. It is never stored in plain text and never shared with other users of the instance. The key is only used to make API calls to your AI provider on your behalf. You can rotate or revoke your key at any time from your settings.

## How do I get help?

Start with this documentation, which has a guide for every LinkedGrow feature. If something is broken, open an issue on the [LinkedGrow GitHub repository](https://github.com/DigiHold/LinkedGrow/issues) and describe what you did and what happened instead.

## What AI models are supported?

Through the BYOK system LinkedGrow supports 35 text models across 6 providers, and image generation across 3 more:

- **OpenAI** - GPT-5.6 Sol, GPT-5.6 Terra, GPT-5.6 Luna, GPT-5.5, GPT-5.4, and more
- **Anthropic** - Claude Fable 5.1, Claude Opus 5, Claude Sonnet 5, Claude Haiku 4.5, and more
- **Google** - Gemini 3.7 Flash, Gemini 3.5 Flash, Gemini 3.1 Pro, Gemini 2.5 Pro, and more
- **Grok (xAI)** - Grok 4.6, Grok 4.5, Grok 4.3, Grok 4.20 Reasoning
- **Perplexity** - Sonar Deep Research, Sonar Reasoning Pro, Sonar Pro, Sonar
- **Kimi (Moonshot AI)** - Kimi K3, Kimi K2.7 Code, Kimi K2.6

You choose which model to use in your BYOK settings. Different models offer different balances of quality, speed, and cost. Check the [BYOK documentation](/docs/byok) for setup guides for each provider.

## Can I schedule posts for LinkedIn company pages?

Yes, and when you connect your LinkedIn account you can choose to post to your personal profile or any company page where you have admin access. You can set a default posting target in your settings or choose the destination for each post individually.

## I have a question that is not listed here

If your question is not covered in this FAQ or elsewhere in the documentation, open an issue on the [LinkedGrow GitHub repository](https://github.com/DigiHold/LinkedGrow/issues). Questions that come up often are added to this page for everyone.
