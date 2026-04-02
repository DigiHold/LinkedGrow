---
title: "Team Auto-Engagement"
description: "Automatically boost company page posts with likes, comments, and reposts from team members."
category: "business-features"
order: 3
---

## Overview

Team auto-engagement automatically boosts your company page posts using your team members' personal LinkedIn profiles. When the team owner publishes a post to a company page, LinkedGrow schedules likes, comments, and reposts from every opted-in team member - without anyone needing to approve or take manual action.

This gives company page posts an immediate engagement boost from real team member profiles, improving visibility in the LinkedIn algorithm.

Team auto-engagement is available exclusively on the **Business plan**.

## Requirements

Before using team auto-engagement, you need:

- A **Business plan** on LinkedGrow
- An existing **team** (see [Team Collaboration](/docs/business-features/team-collaboration))
- Each team member must **connect their own LinkedIn account** (Dashboard > Settings > LinkedIn)

Team members who have not connected their LinkedIn account will be skipped when engagement actions are scheduled.

## Setting Up

Each team member controls their own auto-engagement preferences:

1. Go to **Team** in the left sidebar
2. Find the **Auto-Engagement** section
3. Connect your LinkedIn account if you have not already
4. Toggle the actions you want to perform automatically:
   - **Like** - automatically like the company page post
   - **Comment** - automatically post an AI-generated comment
   - **Share** - automatically repost to your personal feed

Each toggle can be turned on or off independently. Team members can change their preferences at any time.

## How It Works

Team auto-engagement is fully automatic. Here is the flow:

1. The team owner publishes a post to a **company page** via LinkedGrow
2. LinkedGrow detects the company page post and checks which team members have auto-engagement enabled
3. For each opted-in member, the system schedules the appropriate actions (like, comment, repost)
4. Actions execute automatically at staggered intervals

No approval step is needed. Once a team member opts in, their engagement happens automatically for every new company page post.

## Timing

Actions are staggered with random delays to appear natural on LinkedIn:

| Action | Timing After Post |
|--------|------------------|
| Like | 2 - 8 minutes |
| Comment | 5 - 20 minutes |
| Share | 15 - 45 minutes |

Each team member's actions are scheduled independently with random jitter. This means if you have five team members opted in, their likes, comments, and shares will be spread out over the full time window rather than happening all at once.

## AI Comments

When a team member has the Comment toggle enabled, LinkedGrow generates a comment automatically using the **team owner's AI API key**. The generated comment is contextual - it reads the post content and produces a relevant, natural-sounding response.

If the AI comment generation fails for any reason (API key issue, rate limit, service outage), the system falls back to a generic supportive comment so the engagement action is not lost.

Team members do not need their own AI API key for auto-engagement. All AI usage goes through the team owner's key.

## Difference from Cross Promotion

LinkedGrow offers two ways to boost engagement - team auto-engagement and cross promotion. Here is how they compare:

| Feature | Team Auto-Engagement | Cross Promotion |
|---------|---------------------|-----------------|
| Plan required | Business | Pro or higher |
| Approval needed | No - fully automatic | Yes - manual approval each time |
| Post types | Company page posts only | All posts (personal and company) |
| Participants | Team members only | Any LinkedGrow user you invite |
| AI API key | Uses team owner's key | Each member uses their own key |
| Setup | Opt-in toggles per member | Create groups and invite members |

In short, team auto-engagement is a hands-off solution for company page visibility within your organization. Cross promotion is a collaborative approach that works across any group of LinkedIn creators and gives each person control over what they engage with.

You can use both features at the same time. For example, your team members could auto-engage with company posts while also participating in cross-promotion groups with external partners.

## Monitoring

Team owners and admins can monitor auto-engagement activity from the **Team** page:

- View the **engagement job log** showing all scheduled and completed actions
- See the **status** of each action (completed, pending, or failed)
- Identify any **errors** - for example, a team member's LinkedIn token expiring
- Track which team members are opted in and which actions they have enabled

If a team member's LinkedIn connection expires or is revoked, their engagement actions will fail. The job log will show the error so the owner can notify the member to reconnect.

## Questions?

For help with team auto-engagement, contact us at [contact@linkedgrow.ai](mailto:contact@linkedgrow.ai).
