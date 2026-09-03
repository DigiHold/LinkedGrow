---
title: "Connecting Your LinkedIn Account"
description: Step-by-step guide to connecting your LinkedIn account for publishing and scheduling posts from LinkedGrow.
category: "linkedin-integration"
order: 1
---

## Why connect LinkedIn?

Connecting your LinkedIn account enables LinkedGrow to publish and schedule posts on your behalf. Without a connection, you can still generate and draft content, but you will need to copy and paste it into LinkedIn manually.

Once connected, you can:

- Publish posts directly from the editor with one click
- Schedule posts for automatic publishing at specific dates and times
- See your LinkedIn profile name and avatar in post previews

## Connecting, step by step

### 1. Open LinkedIn accounts

Open **LinkedIn accounts** in the dashboard sidebar and click **Connect an account**. The same button sits in every agent's settings, so you can also connect from there.

### 2. Enter the account's email and password

Give LinkedGrow the email address and password of the LinkedIn account. Both are encrypted before they are stored and decrypted only in memory on the machine that runs the browser.

There is no LinkedIn app to authorise and no permission screen, because LinkedGrow does not use LinkedIn's API. Your agent signs in to a real Chrome browser the way you would, from an address in your own country that is reserved for your account alone.

### 3. Choose where it signs in from

Pick the country you are actually in. LinkedIn compares it against where the account has always signed in from, and LinkedGrow reserves a dedicated address there for this one account through the instance's proxy supplier. If you already own good proxies, open **Use my own proxy** and enter the host, port, username and password instead; the country above is then ignored and the reputation of that address is yours.

### 4. Wait for the first sign in

The first sign in takes a minute or two. The worker opens the browser, signs in, and reads your profile back to confirm it worked. If LinkedIn asks for a verification, the prompt appears in the same dialog: type the code it sent, or approve the sign in from the LinkedIn app. If a code is needed again later, the prompt waits on the LinkedIn accounts page and the agent pauses until you answer it.

The account shows as **Signed in and working** with your profile name once that has happened.

## When the connection stops

The agent stops on anything unusual rather than pushing through it: a security check, a changed password, an unexpected screen. It tells you what it saw, on the dashboard and by email, and sends nothing until you have dealt with it.

Your leads, your conversations and your scheduled posts are untouched while it waits.

## Disconnecting LinkedIn

To remove a LinkedIn connection, open **LinkedIn accounts** and click **Disconnect** next to the account. The password and the signed in session are deleted, nothing changes on LinkedIn itself, and the dedicated address goes back to your pool for the next account. Scheduled posts will remain in your calendar but will not publish until you reconnect.

## Troubleshooting

- **The account stays on "Signing in":** check that the worker container is running with `docker compose ps`, then read `docker compose logs worker`
- **Wrong account connected:** disconnect it, then connect again with the right email and password
- **Posts failing after connection:** check the account's status on the LinkedIn accounts page and reconnect it if it shows "Disconnected"
- **"LinkedIn asked for a verification":** answer the prompt on the LinkedIn accounts page; a code expires quickly, so do it while the prompt is open

If the problem persists, read the [troubleshooting](/docs/self-hosting/troubleshooting) page for the stack itself, then open an issue on the [LinkedGrow GitHub repository](https://github.com/DigiHold/LinkedGrow/issues).
