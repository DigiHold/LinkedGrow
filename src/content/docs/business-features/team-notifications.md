---
title: "Team Notifications"
description: Why no email reaches your team when a post goes out, and what the Team screens still give you.
category: "business-features"
order: 5
---

## Overview

Team Notifications was meant to email the rest of your team whenever the team owner published a post, and it does not do that in this edition. There is no screen for it either. What exists is the team itself, its members and their roles, all under **Team** in the sidebar.

## What happens when a post goes out

Nothing is sent to anyone at all. The function that would write those emails lives in the code and neither the app nor the worker ever calls it, so the owner publishes, the post appears on LinkedIn as normal, and no team member is told about it.

Connecting that trigger again is a change to the code rather than a setting in the dashboard, so there is nothing here for you to switch on while it stays this way.

## What the Team screens still do

Everything described in [Team collaboration](/docs/business-features/team-collaboration) works: you create a team, you invite colleagues by email, you give each of them a role, and they share your workspace and your AI keys. Removing somebody takes their access away straight away.

## What it never did

LinkedGrow does not like, comment or repost on a team member's behalf, and that was already true while the email was being sent. Engagement has always been something each person does themselves, in their own voice, on LinkedIn.

## Questions?

The team screens and the email provider behind the invitations are set up by your instance administrator, and anything broken belongs on the [LinkedGrow issue tracker](https://github.com/DigiHold/LinkedGrow/issues).
