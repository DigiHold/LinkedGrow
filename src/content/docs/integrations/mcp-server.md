---
title: "MCP Server"
description: "Drive LinkedGrow from ChatGPT, Claude, Cursor or any other assistant that speaks MCP, using one URL and one API key."
category: "integrations"
order: 1
---

## Overview

LinkedGrow runs an MCP server, so an assistant you already use can operate your workspace directly. You ask for your warmest leads in the chat window, or for next week's posts to be written and spaced across the days you want, and the assistant calls LinkedGrow to do it.

There is one address and one key to paste, no local process to keep running, and nothing at all to install.

Every user of the instance can create a key and connect an assistant to it.

## What you need

| | |
| --- | --- |
| Endpoint | The address of your instance with `/api/mcp` on the end |
| Transport | HTTP |
| Authentication | `Authorization: Bearer YOUR_API_KEY` |

**You never give an assistant your LinkedIn login.** The only credential involved is a LinkedGrow API key, and it reaches your workspace, not your LinkedIn account.

## Creating your key

1. Open **Settings** in the dashboard, then **API keys**
2. Click **Create key** and give it a name you will recognise later, for example the assistant you are connecting
3. Copy the key immediately. It starts with `lg_live_` and it is shown once, because only a hash of it is stored

Only the workspace owner can create keys. Team members use the owner's agents through the app rather than through their own key.

A key can be deleted at any time from the same screen, and deleting it cuts off every assistant using it.

## Connecting your assistant

Most clients read the same JSON. Add the server under `mcpServers` in your client's configuration file:

```json
{
  "mcpServers": {
    "linkedgrow": {
      "type": "http",
      "url": "https://linkedgrow.example.com/api/mcp",
      "headers": {
        "Authorization": "Bearer lg_live_your_key_here"
      }
    }
  }
}
```

That file is `.mcp.json` in your project for **Claude Code**, and `mcp.json` for **Cursor**. **Hermes** keeps the same three values under `mcp_servers` in `~/.hermes/config.yaml`.

**ChatGPT** and other assistants that connect through a settings screen ask for the same three things: the URL above, bearer token authentication, and the key itself pasted as the token.

Once connected, ask the assistant to list its tools. Seeing 26 LinkedGrow tools means the handshake worked.

## What the assistant can do

The tools cover the whole product, grouped roughly as follows.

**Agents.** List them, read the funnel of any one, create a new one from a description of who you sell to, change its targeting, start it and pause it.

**Leads.** Point an agent at a market in plain language, list what it has found with the match score and the signal that surfaced each person, and pull one lead in full with the post they wrote.

**Replies.** Read who answered, and draft a response in your trained voice for you to approve.

**Content.** Write a post, save it, update it, generate an image, build a carousel, and schedule one post or a whole week at once.

**Reporting.** Ask how outreach is performing over a window and get the funnel back, along with the job titles and the sources that reply most.

## What it will not do

Nothing in the chat reaches into your LinkedIn account. LinkedIn actions belong to your agent, which runs on your own server inside its daily caps, and no tool sends a message to a person you name.

Starting an agent from the chat does cause real outreach the same way pressing the button in the dashboard does, so a good assistant tells you what it started. Everything an assistant writes lands somewhere you can read it: drafts sit in your posts, scheduled items sit in your calendar and can be cancelled there, and replies wait for your approval.

Lead names, headlines, post text and inbound replies come back wrapped in an `untrusted-content` marker. That tells the assistant to treat them as data rather than as instructions, whatever those messages appear to be asking for.

## Limits and costs

Each key is allowed 120 requests a minute, which ordinary conversation never comes close to spending.

Everything your agent does runs on the instance key the administrator pasted in the setup wizard, inside the daily ceiling per agent and the monthly ceiling per LinkedIn account. The tools that write content for you are the exception: they run on your own provider key, the one you added under Settings, AI keys. If no key is connected, those tools say so and nothing is spent.

## When it does not connect

Check the three values in this order.

A response of "Missing Authorization header" means the header never arrived. Some clients need the header nested under `headers`, exactly as shown above.

A response about an invalid key means the key was truncated on copy, or it has been deleted. Create a new one rather than guessing.

If the assistant connects but sees no tools, ask it to reconnect the server. A client that cached a failed handshake keeps showing an empty tool list until it retries.
