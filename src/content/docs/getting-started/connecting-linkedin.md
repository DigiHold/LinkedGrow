---
title: "Connecting Your LinkedIn Account"
description: Step-by-step guide to connecting your LinkedIn account to LinkedGrow for publishing and scheduling posts.
category: "getting-started"
order: 2
---

## Why connect LinkedIn?

Connecting your LinkedIn account allows LinkedGrow to:

- **Publish posts** directly to your LinkedIn profile
- **Schedule posts** for future dates and times
- **Sync your profile** name and avatar for post previews

Without connecting LinkedIn, you can still generate and draft posts, but you will need to copy and paste them manually.

## How to connect

1. Open **LinkedIn accounts** in the dashboard sidebar (the same button sits in every agent's settings)
2. Click **Connect an account**
3. Enter the email and password of the LinkedIn account; they are encrypted the moment they arrive and never shown again
4. Choose the country you are actually in, and LinkedGrow reserves a dedicated address there for this one account through the instance's proxy supplier; if you already own good proxies, open **Use my own proxy** and enter the host, port, username and password instead
5. Stay on the dialog while the worker signs in, which takes a minute or two; if LinkedIn asks for a verification, the prompt appears in the same dialog, so type the code it sent or approve the sign in from the LinkedIn app

Once the worker has read your profile back, the account shows as **Signed in and working** with your profile name and country.

## How the connection works

There is no LinkedIn app to authorise, because LinkedGrow does not use LinkedIn's API. Your agent works the way you would: in a real Chrome browser, signed in to your account, on an address in your own country that is reserved for that one account and never shared.

That is why you give LinkedGrow the email and password of the account, and a 2FA code if you have it switched on. Both are encrypted before they are stored, decrypted only in memory on the machine that drives the browser, and never written to a log.

What this buys you is everything the API cannot do: your agent can search, open profiles, send invitations, write messages and read replies, which is the whole product. What it costs is that LinkedIn sees a browser, so the agent moves at a human pace and inside limits you can watch.

## What the agent does on your account

- Opens searches and reads profiles to find people worth contacting
- Sends connection invitations, spread through your working day
- Writes and sends messages, and reads the replies back
- Publishes the posts you scheduled, and leaves the first comment

It never likes or comments on other people's posts on your behalf, and it never contacts anybody on your do-not-contact list.

## When the connection needs your attention

LinkedIn sometimes asks for a security check, or the password changes on your side. When that happens the agent stops, tells you exactly what it saw, and waits. It does not retry, because retrying into a checkpoint is how accounts get restricted.

- The agent shows as paused with the reason on your dashboard
- An email tells you the same thing
- Nothing is sent until you have sorted it out

## Troubleshooting

**The account stays on "Signing in":**
- Check that the worker container is running with `docker compose ps`, and read its output with `docker compose logs worker`
- On a proxy you supplied yourself, check the host, port, username and password you entered

**"LinkedIn asked for a verification":**
- Open the LinkedIn accounts page and answer the prompt: type the code LinkedIn sent, or approve the sign in from the LinkedIn app
- A code expires quickly, so answer it while the prompt is open

**Posts failing after connection:**
- Check the account's status on the LinkedIn accounts page and reconnect it if it shows "Disconnected"
- Check that the post is queued against the LinkedIn account you meant, if you have connected more than one

**Profile picture not showing:**
- Your LinkedIn avatar syncs when the worker first signs in
- If it is not appearing, disconnect and reconnect the account

If you are still stuck, read the [troubleshooting](/docs/self-hosting/troubleshooting) page for the stack itself, then open an issue on the [LinkedGrow GitHub repository](https://github.com/DigiHold/LinkedGrow/issues).
