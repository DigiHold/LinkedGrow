---
title: "About LinkedGrow"
description: What LinkedGrow is, the licence it ships under, who builds it, and where the hosted service fits alongside an instance you run yourself.
category: "getting-started"
order: 5
---

## What LinkedGrow is

LinkedGrow does 2 jobs from one install. Agents drive a real Chrome signed in to your LinkedIn account to find the people who match who you sell to, invite them and hold the conversation that follows, and a set of content tools writes, schedules and publishes the posts that make your profile worth landing on.

There is no LinkedIn API anywhere in it, which is why the agents can invite and message at all, and it is also why the pace they work at is deliberately slow.

## Open source, on your own server

The code is licensed under the AGPL-3.0 and the whole stack installs on a machine you control with Docker Compose. Your leads, your drafts, your database and the signed in browser sessions all stay on that machine, and nothing in the product reports anything back to us. The [requirements](/docs/self-hosting/requirements) page lists every address the stack calls out to, and every one of them is a service you chose and pay for yourself.

Every feature is open on an instance you run. There is no tier, no metering and nothing held back for a paid version.

## Who builds it

Nicolas Lecocq and Maria Lecocq build LinkedGrow, husband and wife, working under Vayalis. Nicolas writes the code and has spent 16+ years on the web; he created the OceanWP WordPress theme in 2016, built it to 500,000 installs and sold it in 2019. Maria Lecocq runs operations and community.

## The hosted service

The same product runs as a subscription at [linkedgrow.ai](https://linkedgrow.ai), for people who would rather not run and update a server. Running it yourself costs you the machine and your own AI key instead of that subscription, and both editions are built from this repository.

## Where your data lives

On your server, wherever you decided to put it, which is not a decision anyone here gets to make for you. No copy of your leads or your drafts is kept anywhere else.

## Questions?

Everything the product does has a page in this documentation. If something is broken or missing, open an issue on the [LinkedGrow GitHub repository](https://github.com/DigiHold/LinkedGrow/issues).
