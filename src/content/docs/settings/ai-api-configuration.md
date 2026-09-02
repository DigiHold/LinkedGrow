---
title: "AI API Configuration"
description: How to configure text and image AI providers, select models, and manage your API keys in LinkedGrow settings.
category: "settings"
order: 8
---

## Overview

The AI API configuration page is where you manage all your AI provider connections. Access it from **Settings > AI API** in the sidebar. The page is divided into two sections: text generation and image generation.

## Text AI configuration

### Selecting a provider

The page shows tabs for each supported text provider:

- **OpenAI** - GPT-5.2, GPT-5, GPT-5 Nano, o4-mini, o3, o3-mini
- **Anthropic** - Claude Opus 4.6, Claude Sonnet 4.6, Claude Opus 4.5, Claude Sonnet 4.5, Claude Haiku 4.5, Claude Sonnet 4
- **Gemini** - Gemini 3 Pro, Gemini 3 Flash, Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.5 Flash Lite
- **Grok** - Grok 4, Grok 4.1 Fast, Grok Code Fast, Grok 3
- **Perplexity** - Sonar Deep Research, Sonar Reasoning Pro, Sonar Reasoning, Sonar Pro, Sonar

Click a tab to configure that provider.

### Adding your API key

1. Click on the provider tab
2. Paste your API key into the key field
3. The eye icon lets you toggle key visibility (hidden by default for security)
4. Each provider shows the expected key format and a link to their API key page

### Selecting a model

After entering your key, choose a model from the dropdown. Each model shows:

- **Name** - The model identifier
- **Tag** - A label like "Recommended", "Most Capable", "Fastest", or "Cheapest"
- **Price** - Estimated cost per post generation
- **Monthly estimate** - Projected monthly cost for 30 posts

Models marked "Recommended" offer the best balance of quality and cost for LinkedIn content.

### Saving and testing

Click **Save** to store your configuration. LinkedGrow validates the key when saving:

- Green checkmark - Key is valid and working
- Red error - Key is invalid, expired, or billing is not set up

### Setting your active provider

The provider you configure and save becomes your active provider for all text generation. You can have keys saved for multiple providers and switch between them by changing the active selection.

## Image AI configuration

Image generation is shown below the text section.

### Image providers

- **Google AI** - Nano Banana Pro, Nano Banana, Imagen 4 Ultra, Imagen 4, Imagen 4 Fast
- **OpenAI** - GPT Image 1.5, GPT Image 1, GPT Image 1 Mini
- **Replicate** - FLUX.2 Pro, FLUX.2 Flex, FLUX.2 Dev, FLUX 1.1 Pro Ultra, FLUX 1.1 Pro, FLUX Schnell

### Image-specific settings

Depending on the provider, you can configure:

- **Resolution** - Image output size (varies by provider)
- **Aspect ratio** - Width-to-height ratio (1:1, 16:9, 9:16, etc.)
- **Quality** - Output quality level (OpenAI only: High, Medium, Low)

### Same key or separate key

- Google AI and OpenAI image models use the same API key as their text counterparts
- Replicate requires a separate account and API key from replicate.com

## Security

Your API keys are encrypted before being stored. LinkedGrow never displays your full key after saving - only a masked version with the last few characters visible. Keys are only used to make API calls on your behalf and are never shared with third parties.

## Deleting a key

To remove a saved API key, click the delete (trash) icon next to the provider. This immediately revokes LinkedGrow's ability to use that key. You can add a new key at any time.

## Team members

If you have invited team members from the Team page, they use the team owner's API keys automatically. Team members cannot access the AI API settings page - they see a message explaining that the owner manages API keys.
