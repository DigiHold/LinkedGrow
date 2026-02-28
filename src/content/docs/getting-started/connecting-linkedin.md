---
title: "Connecting Your LinkedIn Account"
description: "Step-by-step guide to connecting your LinkedIn account to LinkedGrow for publishing and scheduling posts."
category: "getting-started"
order: 2
---

## Why connect LinkedIn?

Connecting your LinkedIn account allows LinkedGrow to:

- **Publish posts** directly to your LinkedIn profile
- **Schedule posts** for future dates and times
- **Post to company pages** you manage
- **Sync your profile** name and avatar for post previews

Without connecting LinkedIn, you can still generate and draft posts, but you will need to copy and paste them manually.

## How to connect

1. Go to **Settings** from the dashboard sidebar
2. Find the **Connect LinkedIn** card at the top of the page
3. Click **Connect LinkedIn**
4. A popup window opens with LinkedIn's authorization page
5. Review the permissions and click **Allow**
6. You are redirected back to LinkedGrow

Once connected, you will see your LinkedIn profile name and a green "Connected" status indicator.

## Permissions explained

When you authorize LinkedGrow, LinkedIn asks you to grant these permissions:

- **OpenID Connect** - Verifies your identity (name, email, profile picture)
- **Profile access** - Reads your basic profile information
- **Share on LinkedIn (w_member_social)** - Allows LinkedGrow to create posts on your behalf

LinkedGrow only uses these permissions to publish content you explicitly choose to post. We never post without your action, and we never read your private messages or connections list.

## Reconnecting when your token expires

LinkedIn access tokens expire periodically. When this happens:

- You will see a yellow warning in Settings indicating the connection has expired
- Scheduled posts will fail until you reconnect
- Your drafts and generated content are not affected

To reconnect, simply click **Connect LinkedIn** again in Settings and re-authorize. The process takes about 10 seconds.

## Troubleshooting

**"Connection failed" error:**
- Make sure popup blockers are disabled for linkedgrow.ai
- Try using a different browser (Chrome or Firefox recommended)
- Clear your browser cookies for linkedin.com and try again

**"Authorization denied" message:**
- You must click "Allow" on LinkedIn's authorization page
- If you clicked "Cancel," try connecting again

**Posts failing after connection:**
- Check if your token has expired in Settings
- Reconnect your account if the status shows "Disconnected"
- Make sure you are posting to the correct profile (personal vs. company page)

**Profile picture not showing:**
- Your LinkedIn avatar syncs when you first connect
- If it is not appearing, disconnect and reconnect your account

If you continue to experience issues, contact us at contact@linkedgrow.ai.
