---
title: Quick Start Guide
description: Reach your LinkedGrow instance, connect a LinkedIn account, set up AI for posts, and publish your first post
category: getting-started
order: 1
---

## Reach your instance

LinkedGrow runs on a server of yours, at the address whoever installed it set as `APP_URL`, or on the hosted service at linkedgrow.ai. The first account created on a self hosted instance is the administrator, and it lands on the setup wizard right after signing in: instance name and address, the AI key the agents run on, dedicated addresses, email, storage. The [self hosting](/docs/self-hosting/install) pages cover the installation and each step of the wizard.

Everyone else creates an account with an email and a password, or with Google when the administrator switched it on. When sign ups are closed, which the wizard does by default, the administrator invites people from the Team page instead. Anyone who signs in before the wizard is finished sees a page saying the instance is still being set up.

## Connect your LinkedIn account

There is no LinkedIn app to authorise, because LinkedGrow does not use LinkedIn's API. Your agent works the way you would: in a real Chrome browser, signed in to your account, on an address in your own country that is reserved for that one account and never shared.

1. Go to **Settings** and open **LinkedIn accounts**
2. Add the account with the email and password you use on LinkedIn, and a 2FA code if you have it switched on
3. Pick the country the account should sign in from; the instance buys a dedicated address there, or takes one of your own in the advanced panel

Both credentials are encrypted before they are stored and decrypted only in memory on the machine that drives the browser. When LinkedIn asks for a security check later, the agent stops, tells you what it saw, and waits for you rather than retrying. More on this in [Connecting your LinkedIn account](/docs/getting-started/connecting-linkedin).

## Set up AI for posts

The AI key from the setup wizard runs the agents, and the administrator who ran that wizard also has it in their own AI settings. Every other account starts with nothing there, and the post generator answers that there is no key until one is saved:

1. Go to **Settings > AI API** from the sidebar
2. Choose a provider and paste your API key from the provider's dashboard
3. Select a model (each provider has a recommended option marked)
4. Click **Save**

If you do not have an API key yet, the [BYOK guides](/docs/byok) walk through each provider.

## Configure your voice settings

Help the AI match your writing style by setting up your profile in **Settings**:

**Voice & Style section:**

1. **Writing tone** - Describe your preferred tone (e.g., "Professional but friendly, conversational, direct and bold")
2. **Sample posts** - Paste up to 5 of your best LinkedIn posts so the AI can learn your style
3. **Never mention** - Add any topics, competitors, or words the AI should avoid

**Business Profile section:**

1. **Business name** - Your company or personal brand name
2. **Niche/Industry** - Your industry or field
3. **What do you do?** - Describe what your business does
4. **Products/Services** - List your key offerings
5. **Target audience** - Define who you are writing for
6. **Key topics** - Topics you regularly cover
7. **Additional context** - Any extra info to help the AI

## Create your first post

Now you are ready to generate your first LinkedIn post:

1. Click **Generator** in the sidebar (or the "Generate Post" quick action on the dashboard)
2. Choose a post type (Actionable, Inspiring, Introspective, or Promotional)
3. Optionally select a category (Explanation, Best Practices, Striking Advice, List Format, Resources, or Let AI Decide)
4. Enter a topic or leave blank for the AI to choose
5. Click **Generate 5 Ideas** - the AI creates 5 idea titles
6. Pick the idea you like best
7. The AI generates a full post from your chosen idea
8. Edit the post, check the **Algorithm Score**, and attach an image if you want
9. Click **Publish** and the worker posts it from your account on its next pass, or **Schedule** to set a future date

## Understand the dashboard

Your dashboard is the command center. Here is what you will find:

- **Stats grid** - Total posts, drafts, scheduled posts, and published posts at a glance
- **Quick actions** - Shortcuts to Generate Post, Write Post, Repurpose Content, and Get Ideas
- **Recent posts** - Your last 3 posts with status badges
- **Upcoming schedule** - Your next 3 scheduled posts with publish times
- **API key status** - An alert if you have not configured an AI provider yet, or a green confirmation when connected

The sidebar gives you access to all features: Generator, Editor, Ideas, Hooks, Repurpose, Carousel, Posts library, Calendar, A/B Testing, Analytics, and Team.

## Next steps

- [Learn about the Post Generator](/docs/content-creation/post-generator) for tips on creating better content
- [Set up your content calendar](/docs/scheduling/content-calendar) for consistent posting
- [Explore BYOK options](/docs/byok/what-is-byok) to understand AI costs and providers
