---
title: Setup wizard
description: What each step of the first login wizard asks for and why the agents need it
category: self-hosting
order: 4
---

The wizard runs once, at the administrator's first sign in, and every value it asks for can be changed later in Settings, Instance.

## Instance

The instance name is shown in the sidebar and in the emails the instance sends. The app URL is the address in your browser bar without a path, prefilled with the address you opened. Pages and redirects follow each request on their own; this value is the one used in emails, which have no request to read. The timezone decides when daily limits and reports reset. The admin email receives operational alerts: a supplier balance running low, a renewal that failed, a LinkedIn control that stopped answering.

## AI key

Pick a provider (Anthropic, OpenAI, Google, Grok or Kimi) and paste one API key. It runs the agents (finding people, judging fit, writing messages) and reads your website in the agent wizard. The wizard also copies it into your own AI settings when those are still empty, which is what makes the post generator work for you straight away; every other account on the instance needs a key of its own in Settings. The key is stored encrypted; the test sends one short request and shows the answer.

Under advanced, 2 models share the work: a cheap one sorts and scores profiles, a better one writes anything a person will read. The 2 ceilings cap the spending on your own key, 1 dollar a day per agent and 12 dollars a month per LinkedIn account by default.

## Dedicated IP

LinkedIn compares where an account signs in from with where it always has, so each connected account gets its own residential or ISP address in its own country and keeps it for good. With a Proxy-Seller account, add credit and paste the API key from their account page. Their API only answers from addresses on your allowlist, so add this server's public address, shown on the step, in their dashboard before you test.

To bring your own proxy, leave the key empty: an advanced panel takes the host, port, username and password when you connect an account, and LinkedGrow never renews that address. You can skip the step, but no agent starts until an address exists.

## Email

LinkedGrow emails you when a lead replies, when LinkedIn asks for a verification code, when an agent stops, and once a week with the people it found. Resend needs an API key with a verified sending domain; SMTP takes a host, port, username, password and a TLS switch. The from address must belong to a domain your provider may send from, and the test sends one message to the admin address. Skip it and everything still shows in the dashboard.

## Storage

Images and carousels attached to posts live here. Local disk keeps them in the `uploads` volume, served by the app, the right choice for one server. S3 compatible storage (Cloudflare R2, MinIO, AWS) takes an endpoint, region, bucket, access key, secret key and the public URL files are read from.

## Review

A summary of the 5 steps and one checkbox, close sign ups, checked by default: only people you invite from the Team page can create an account. Finish, and the next screen creates your first agent.
