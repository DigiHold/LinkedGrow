---
day: 2
title: "Reverse-Engineering LinkedIn's 360Brew From Their Engineering Blog"
description: "LinkedIn replaced its multi-pipeline ranker with one 150B-parameter language model in 2026. What their engineering team actually said about how it works, what it killed, and what it rewards."
tags:
  - ai
  - machinelearning
  - linkedin
  - discuss
---

LinkedIn quietly replaced its feed ranking system in 2026. Not with a tweaked version of the old one. With a single 150-billion-parameter language model called 360Brew, built on top of LLaMA 3 and fine-tuned on internal data. They published the technical details on their engineering blog. Most people did not read it.

Here is what the paper actually says, with the parts that matter for anyone building on or analyzing the platform.

## What it replaced

The old LinkedIn ranking pipeline was a chain of around thirty specialized models. Each one scored a numerical feature: dwell time, sender-receiver affinity, click-through rate, comment likelihood, and so on. The features were stitched together by a final ranking layer that picked which posts to show.

This is the same pattern most social platforms have used since the 2010s. It is fast, cheap, well-understood, and easy to A/B test. The downside is that it can only see what the engineers thought to measure. Anything outside those features is invisible.

## What 360Brew does instead

360Brew is one decoder-only model. It takes a post, the author profile, the candidate reader profile, and recent interaction history, and asks itself a single question: would this specific reader find this specific post worth engaging with.

The reason this matters: the model understands language. The old pipeline could count words but could not tell that a post about "Gong's revenue intelligence platform" and "Salesforce CRM workflows" are talking about the same thing. 360Brew can. That changes which posts get cross-cluster distribution.

It also changes which posts get punished. If the model decides a post sounds generic or rehearsed, it lowers the score regardless of how engagement-bait the structure is.

## Concrete behaviors that changed

A few patterns I noticed by looking at my own posts and a friend's analytics, then matching against what the paper says is happening:

**Hooks that worked in 2024 stop working.** The "Stop scrolling. This will change your life." family of openers ranks lower because the model recognizes them as a pattern. Even small variations get caught.

**Saves and long thoughtful comments matter more than likes.** The old pipeline scored all engagement somewhat similarly. 360Brew weights interactions by how much intent they show, and saving is the biggest signal because it costs the user something.

**Topic clusters lock in faster.** Your profile gets classified into a topic cluster based on your last 60 to 90 days of posting. Once you are in a cluster, posting outside it gets capped. The old system was more forgiving about category drift.

**Pods and engagement rings died.** The old engagement-counting models could not tell the difference between "200 people who care liked this" and "200 people in a pod liked this." 360Brew sort of can, by reading the comments. If the comments are off-topic or generic, the model assumes the engagement is fake and downweights distribution.

## Why this matters for builders

If you are writing tools that touch LinkedIn data, you cannot rely on the old engagement-rate metrics anymore. Two posts with identical likes and comments can have wildly different reach because 360Brew weighs the quality of the engagement, not just the count.

A few practical implications for any tool that schedules, generates, or analyzes LinkedIn content:

- Scoring "good content" by like-prediction is now wrong. The model rewards substance, not engagement-bait. Your scoring model should reward specificity, not virality patterns.
- Voice-matching matters more than format-matching. The old algo loved certain formats (line-broken hooks, three-bullet bodies). 360Brew does not care about format. It cares whether the post says something a real person would say.
- Comment quality is a real ranking signal now. If you build comment automation, the model can tell. Generic comments hurt your distribution score.

## The part the paper does not say

The paper is careful to never give actual weights or thresholds. No "saves count X times more than likes." No "the topic cluster window is exactly 60 days." Those numbers are inferred from creator behavior, not declared.

That means anyone telling you the exact recipe for going viral under 360Brew is making it up. The honest answer is the model rewards posts that say something specific, posted into a topic cluster the author has been building, and engaged with by people in that cluster within the first hour.

The full paper is on the [LinkedIn Engineering Blog](https://www.linkedin.com/blog/engineering/feed/engineering-the-next-generation-of-linkedins-feed). Worth reading even if you do not build on LinkedIn. It is one of the cleaner public write-ups of replacing a feature-engineering pipeline with a foundation model.
