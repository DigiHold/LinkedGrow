---
title: "Scheduling Posts"
description: "How to schedule LinkedIn posts for future dates and times, manage scheduled content, and understand scheduling limits by plan."
category: "scheduling"
order: 1
---

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin-bottom:24px;border-radius:12px">
<iframe src="https://www.youtube.com/embed/3T7xYfv9GfU" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
</div>

## Why schedule posts?

Scheduling lets you create content in batches and have it published automatically at the best times for your audience. This means you can:

- Write posts during your creative hours and publish when your audience is most active
- Maintain a consistent posting cadence without being online every day
- Plan content around events, launches, or campaigns in advance

## How to schedule a post

1. Create or edit a post in the **Editor**
2. Click the **Schedule** button at the bottom of the editor
3. A date and time picker appears
4. Select the date you want the post to go live
5. Choose the time (shown in your configured timezone)
6. Click **Schedule**

The post is saved with a "Scheduled" status and will be published automatically at the specified time. You can see all scheduled posts in your Posts library and on the Calendar.

## Timezone support

All scheduled times use your configured timezone. To set or change your timezone:

1. Go to **Settings**
2. Find the **Timezone** section
3. Select your timezone from the dropdown, or choose "Auto" to detect your browser's timezone

When you schedule a post for "9:00 AM," it will publish at 9:00 AM in your selected timezone.

## Managing scheduled posts

### Editing a scheduled post

Open the post from the Posts library or Calendar. Make your changes in the editor, then save. The scheduled time remains the same unless you explicitly change it.

### Rescheduling

Open the post, click the Schedule button again, and pick a new date and time. The post will publish at the updated time instead.

### Canceling a scheduled post

Open the post and click **Save as Draft** to remove it from the schedule. The post moves back to draft status and will not be published automatically.

## Scheduling limits by plan

| Plan | Scheduled posts |
|---|---|
| 7-day Pro trial | Unlimited (full Pro access) |
| Pro | Unlimited |
| Business | Unlimited |

Scheduling is unlimited on both plans and during the trial, so there is no queue cap to plan around.

## How scheduling works behind the scenes

A scheduled post is not published by LinkedGrow at its minute. Some hours
earlier, during your day, LinkedGrow opens your connected session, writes the
post into LinkedIn's own composer and uses LinkedIn's Schedule control, exactly
as you would if you sat down the evening before and planned tomorrow. LinkedIn
then publishes it itself, on time, to the second.

Two things follow from that. Your post goes out whether or not you are logged
into LinkedGrow, and whether or not anything of ours is running at that moment.
And it appears in your own LinkedIn scheduled-posts list before it goes out, so
you can see it there and change your mind.

If a post is scheduled for less than about ninety minutes from now, there is no
time for that, so LinkedGrow publishes it directly at the slot instead. In that
case it may land a few minutes after the time you picked, on purpose: a post
that appears at 09:00:00 every single day is a pattern, and LinkedGrow avoids
giving your account one.

## Video scheduling limitation

Posts with video attachments cannot be scheduled. Videos are too large for
LinkedGrow to keep, so the file is passed straight to LinkedIn and deleted,
which only works while you are publishing. Use "Publish Now" for video posts.

## Best practices

- **Schedule a week ahead** if possible - this gives you a buffer and reduces content stress
- **Vary your posting times** to reach different audience segments
- **Check your schedule regularly** on the Calendar to spot gaps or overlaps
- **Reconnect LinkedIn before tokens expire** to prevent scheduled post failures
