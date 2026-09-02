---
title: "General FAQ"
description: Answers to frequently asked questions about LinkedGrow, AI costs, LinkedIn integration, security, and more.
category: "faq"
order: 1
---

## What is LinkedGrow?

LinkedGrow is an AI-powered LinkedIn content creation and scheduling platform. It helps you write better LinkedIn posts, schedule them in advance, and grow your audience with data-driven insights. LinkedGrow uses a BYOK (Bring Your Own Key) model, which means you connect your own AI provider API key and only pay for the AI usage you actually consume.

## What is BYOK (Bring Your Own Key)?

BYOK stands for Bring Your Own Key. Instead of charging you a premium for built-in AI, LinkedGrow lets you connect your own API key from providers like OpenAI, Anthropic, Google, or others. This gives you full control over your AI costs, model selection, and usage. You pay the AI provider directly at their standard rates, which is significantly cheaper than platforms that bundle AI costs into their monthly price.

For setup instructions, see the [BYOK documentation](/docs/byok).

## How much does the AI cost?

With the BYOK model, most users spend between $2 and $4 per month on AI usage. The exact cost depends on how much content you generate and which AI model you use. For comparison, platforms that bundle AI into their pricing often charge $30 to $50 per month or more for similar functionality.

You can monitor your AI spending directly through your AI provider's dashboard (such as the OpenAI usage page or Anthropic console).

## Do I need LinkedIn Premium to use LinkedGrow?

No. LinkedGrow works with any LinkedIn account, including free LinkedIn accounts. You do not need LinkedIn Premium, Sales Navigator, or any other paid LinkedIn subscription to use LinkedGrow.

## Will my posts sound like they were written by AI?

No, not if you use the voice training feature. LinkedGrow's voice training analyzes your existing writing style and trains the AI to match your tone, vocabulary, and patterns. The result is content that sounds authentically like you, not like generic AI output. You can also edit every post before publishing to add your personal touch.

## What is the Algorithm Score?

The Algorithm Score is a real-time rating that evaluates how well your post is optimized for LinkedIn's algorithm. It analyzes factors like post length, formatting, hook strength, call to action, hashtag usage, and readability. The score updates as you edit, giving you instant feedback to improve your post's potential reach before publishing.

## How is LinkedGrow different from competitors?

LinkedGrow stands apart in several key ways:

- **BYOK model** - you bring your own AI key, so AI costs are a fraction of what competitors charge
- **Voice training** - the AI learns to write in your voice, not a generic tone
- **Algorithm optimizer** - real-time scoring tells you how well your post will perform before you publish
- **All-in-one platform** - content creation, scheduling, carousel generation, analytics, and team collaboration in one tool
- **Transparent AI costs** - the AI bill comes from your own provider, so you see exactly what you pay for

## Can I use multiple AI providers?

Yes. LinkedGrow supports multiple AI providers, and you can switch between them at any time. In your BYOK settings, you can configure API keys for different providers and choose which one to use for content generation. This lets you compare outputs from different models and use whichever one works best for your needs.

## Is my API key secure?

Yes. Your API key is encrypted at rest and in transit. It is never stored in plain text and never shared with other users of the instance. The key is only used to make API calls to your AI provider on your behalf. You can rotate or revoke your key at any time from your settings.

## How do I get help?

Start with this documentation, which has a guide for every LinkedGrow feature. If something is broken, open an issue on the [LinkedGrow GitHub repository](https://github.com/DigiHold/LinkedGrow/issues) and describe what you did and what happened instead.

## What AI models are supported?

LinkedGrow supports 28+ AI models through the BYOK system across 6 text providers and 3 image providers:

- **OpenAI** - GPT-5.2, GPT-5, GPT-5 Nano, o4-mini, o3, o3-mini
- **Anthropic** - Claude Opus 4.6, Claude Sonnet 4.6, Claude Haiku 4.5, and more
- **Google** - Gemini 3 Pro, Gemini 3 Flash, Gemini 2.5 Pro, and more
- **Grok (xAI)** - Grok 4, Grok 4.1 Fast, Grok Code Fast, Grok 3
- **Perplexity** - Sonar Deep Research, Sonar Reasoning Pro, Sonar Pro, and more
- **Kimi (Moonshot AI)** - Kimi K2.5, Kimi K2

You choose which model to use in your BYOK settings. Different models offer different balances of quality, speed, and cost. Check the [BYOK documentation](/docs/byok) for setup guides for each provider.

## Can I schedule posts for LinkedIn company pages?

Yes. When you connect your LinkedIn account, you can choose to post to your personal profile or any company page where you have admin access. You can set a default posting target in your settings or choose the destination for each post individually.

## I have a question that is not listed here

If your question is not covered in this FAQ or elsewhere in the documentation, open an issue on the [LinkedGrow GitHub repository](https://github.com/DigiHold/LinkedGrow/issues). Questions that come up often are added to this page for everyone.
