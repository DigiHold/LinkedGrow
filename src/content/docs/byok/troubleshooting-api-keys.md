---
title: "Troubleshooting API Keys"
description: "Fix common API key errors including invalid keys, billing issues, rate limits, and quota problems."
category: "byok"
order: 9
---

## Common API key errors

### "Invalid API key"

This means LinkedGrow could not authenticate with the AI provider using your key.

**How to fix:**

- Double check you copied the full key with no extra spaces at the beginning or end
- Make sure you are pasting the key into the correct provider tab (e.g., an OpenAI key in the OpenAI tab, not Anthropic)
- Verify the key format matches the expected pattern:
  - OpenAI: starts with `sk-`
  - Anthropic: starts with `sk-ant-`
  - Google AI: starts with `AIza`
  - Grok: starts with `xai-`
  - Perplexity: starts with `pplx-`
  - Kimi: starts with `sk-`, the same prefix OpenAI uses, so check the tab
  - Replicate: starts with `r8_`
- Check if the key has been revoked or deleted at the provider's dashboard
- Generate a new key if the old one is no longer valid

### "Billing not set up" or "Payment required"

The AI provider requires a payment method before you can use the API, even for free tier usage with some providers.

**How to fix:**

- Go to your provider's billing settings and add a credit or debit card
- OpenAI: Settings > Billing at platform.openai.com
- Anthropic: Settings > Billing at console.anthropic.com
- Google AI: Google Cloud Console billing
- Grok: console.x.ai billing settings
- Perplexity: perplexity.ai/settings/api billing
- Kimi: platform.kimi.ai/console billing

After adding a payment method, try generating again in LinkedGrow.

### "Rate limit exceeded"

You have sent too many requests in a short period.

**How to fix:**

- Wait 30-60 seconds and try again
- This is more common with new accounts that have lower rate limits
- As your account ages and you add billing, providers typically increase your rate limits
- If this happens frequently, try a different model or provider

### "Quota exceeded" or "Insufficient credits"

You have reached your monthly spending limit, or your prepaid credits have run out.

**How to fix:**

- Check your spending limit at the provider's billing dashboard
- Increase your monthly limit if you set one too low
- Add more credits if using a prepaid system
- Switch to a cheaper model to reduce per-generation costs

### "Model not available"

The selected model requires special access or is not available in your region.

**How to fix:**

- Some newer models require waitlist approval - check the provider's documentation
- Try selecting a different model from the dropdown
- Some models may have regional restrictions

## Testing your API key

You can verify your key is working correctly in LinkedGrow:

1. Go to **Settings > AI API**
2. Select the provider and enter your key
3. Click **Save** - LinkedGrow validates the key when saving
4. If the key is valid, you will see a green success indicator
5. If invalid, an error message explains what went wrong

## General troubleshooting tips

- **Try a different model** - If one model is not working, switch to another under the same provider
- **Check provider status** - AI providers occasionally have outages. Check their status page if all models are failing
- **Regenerate your key** - If you suspect your key was compromised or is malfunctioning, delete it and create a new one at the provider's dashboard
- **Clear and re-enter** - Sometimes copy-paste introduces invisible characters. Delete the key field completely, then paste again

## Still having issues?

If none of the above solutions work, open an issue on the [LinkedGrow GitHub repository](https://github.com/DigiHold/LinkedGrow/issues) with:

- The error message you are seeing
- Which AI provider and model you are trying to use
- When the issue started

When the provider itself is refusing the key, their own status page and their support are the faster route, because the key belongs to your account with them.
