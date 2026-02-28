---
title: "Connecting Your LinkedIn Account"
description: "Step-by-step guide to connecting your LinkedIn account for publishing and scheduling posts from LinkedGrow."
category: "linkedin-integration"
order: 1
---

## Why connect LinkedIn?

Connecting your LinkedIn account enables LinkedGrow to publish and schedule posts on your behalf. Without a connection, you can still generate and draft content, but you will need to copy and paste it into LinkedIn manually.

Once connected, you can:

- Publish posts directly from the editor with one click
- Schedule posts for automatic publishing at specific dates and times
- Post to company pages you manage
- See your LinkedIn profile name and avatar in post previews

## Step-by-step connection

### 1. Open LinkedIn settings

Go to **Settings** from the sidebar and find the **Connect LinkedIn** card.

### 2. Click Connect LinkedIn

Click the **Connect LinkedIn** button. A new window or tab opens with LinkedIn's authorization page.

### 3. Authorize on LinkedIn

Sign in to LinkedIn if you are not already logged in, then review the permissions LinkedGrow is requesting:

| Permission | Purpose |
|---|---|
| OpenID Connect | Verifies your identity securely |
| Profile access | Reads your name and profile picture for display in LinkedGrow |
| Email access | Reads your LinkedIn email for account matching |
| Share on LinkedIn (w_member_social) | Allows LinkedGrow to create posts on your profile |

Click **Allow** to grant these permissions.

### 4. Return to LinkedGrow

After authorization, you are redirected back to LinkedGrow. Your LinkedIn profile name and a green "Connected" status indicator confirm the connection is active.

## Reconnecting when your token expires

LinkedIn access tokens expire periodically. When this happens:

- A warning appears in Settings indicating the connection needs to be refreshed
- Scheduled posts will not publish until you reconnect
- Your drafts and generated content are not affected

To reconnect, go to **Settings > LinkedIn** and click **Connect LinkedIn** again. The process takes about 10 seconds.

**Tip:** Reconnect as soon as you see the expiration warning to avoid missed scheduled posts.

## Disconnecting LinkedIn

To remove your LinkedIn connection, go to **Settings > LinkedIn** and click **Disconnect**. This immediately revokes LinkedGrow's posting ability. Scheduled posts will remain in your calendar but will not publish until you reconnect.

## Troubleshooting

- **Connection failed** - Disable popup blockers for linkedgrow.ai and try in a fresh browser tab
- **Wrong account connected** - Disconnect, log into the correct LinkedIn account in your browser, then reconnect
- **Posts failing after connection** - Check if your token has expired in Settings
- **"Insufficient permissions" error** - Disconnect and reconnect, making sure to accept all permissions

Contact us at contact@linkedgrow.ai if issues persist.
