---
day: 7
title: "Voice-Matching LinkedIn Posts With Claude + 5 Sample Posts"
description: "Fine-tuning is overkill for matching one person's writing voice. Five sample posts in a system prompt does most of the job. Here is the prompt structure that worked for me."
tags:
  - ai
  - claude
  - prompts
  - nextjs
---

When users sign up for my LinkedIn tool, the first request I get is "make it sound like me." Generic AI output sounds the same across every account, and people can tell. The model writes the way training data writes. To match a specific person's voice, you have to either fine-tune or feed examples in-context. Fine-tuning is expensive, requires hundreds of samples, and locks you into one model. Examples in-context cost nothing extra and work across any frontier model.

Five sample posts is the threshold I have found where Claude (Sonnet 4.6 in my testing) reliably matches sentence rhythm, word choice, opener style, and ending pattern. Three samples is too noisy. Ten samples does not measurably improve over five, and it eats context.

Here is the prompt structure I landed on after a lot of iteration.

## The system prompt

```
You are writing a LinkedIn post in the user's exact voice.

The user's writing style is defined by these five sample posts.
Study them for: sentence length distribution, opener patterns,
word choice, transition style, ending patterns, and any
recurring phrases.

DO NOT copy phrases or sentences verbatim from the samples.
DO match the rhythm, tone, and structural choices.

Sample 1:
[paste full post 1]

Sample 2:
[paste full post 2]

Sample 3:
[paste full post 3]

Sample 4:
[paste full post 4]

Sample 5:
[paste full post 5]

User context:
- Business: [user.businessDescription]
- Audience: [user.targetAudience]
- Tone preference: [user.writingTone]
- Topics to avoid: [user.neverMention]

Write a new LinkedIn post on the topic the user provides.
Match the voice from the samples. The post should feel like
something this user would write today, not a generic AI output.
```

The exact wording matters less than the structure. Five labeled samples, then context, then the task. Putting the task before the samples weakens voice transfer measurably.

## What changed when I used Anthropic's prompt caching

Five sample posts at 200-400 words each is roughly 4,000-8,000 input tokens. Plus the system prompt scaffolding. Plus user context. You are at 10,000 input tokens per request before the user's actual prompt arrives. At standard Claude pricing, that is about $0.03 per generation just for the voice setup.

Anthropic's prompt caching makes the same setup cheap to reuse:

```ts
const message = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  system: [
    {
      type: "text",
      text: voicePrompt, // the structured prompt above
      cache_control: { type: "ephemeral" },
    },
  ],
  messages: [
    { role: "user", content: userTopic },
  ],
});
```

Mark the system prompt with `cache_control: { type: "ephemeral" }`. The first request computes the cache. Every subsequent request from the same user reuses it at 10% of the input cost. Cached entries live 5 minutes by default.

For a user generating multiple drafts in a session, the first generation costs full price ($0.03). The next 5-10 inside that 5-minute window cost about $0.003 each. The cost math gets a lot better when you multiply across users.

## What "voice match" actually means

When I say Claude "matches voice" with five samples, here is what it actually does well and what it does not:

**Does well:**
- Sentence length distribution. If samples are mostly 8-15 words, output trends 8-15. If samples mix short and long, output mixes.
- Opener style. Question openers, story openers, contrarian openers. Picks up the dominant pattern from samples.
- Word choice. If you avoid corporate words in samples, output avoids them. If you use technical terms, output uses them.
- Closing pattern. Question closer, takeaway closer, no closer. The model picks one consistent with samples.

**Does not do well:**
- Specific anecdotes. The model will not invent your stories. If you want a story-shaped post, you have to give it the story in the prompt.
- Inside-baseball references. If your audience knows specific tools, names, or running jokes, the model misses them unless you list them in user context.
- Long-form structural patterns. For posts under 300 words, voice transfer is strong. For longer-form (1000+ words), the model's training-data rhythm starts leaking through.

## Sample selection matters

Bad sample selection breaks voice match. Three rules I learned from testing:

1. **Use posts the user actually wrote alone.** Posts written by ghostwriters or heavily edited by an editor pull voice in the wrong direction.
2. **Pick posts that did well, not random ones.** Successful posts represent the user at their best. The model anchors on whatever you feed it, including bad posts.
3. **Vary the post types.** One opinion post, one story, one contrarian, one tactical, one personal. Five copies of the same format teaches the model to write that format, not to match the voice.

A user who pastes their five top-performing varied-format posts gets dramatically better output than a user who pastes the first five posts off their profile.

## What this replaced

Before voice matching, my generated posts felt like AI output. Generic. Same cadence as every other tool's output. Users would generate, look at it, and rewrite from scratch. Conversion to a paying plan was bad.

After voice matching, generated posts feel like the user's posts. They still need light editing, but the editing is "fix one phrase" not "rewrite from scratch." The conversion math changed because users actually use the output instead of treating it as a starting brainstorm.

The whole feature is twenty lines of code plus the prompt template. It is one of those moments where the AI-product cliché ("the prompt is the product") turns out to be literally true.
